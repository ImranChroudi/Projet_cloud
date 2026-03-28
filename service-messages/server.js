import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import messageRoutes from "./routes/messageRoutes.js";
import Message from "./models/Message.js";
import Notification from "./models/Notification.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3003;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

// ── File upload setup ──
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Type de fichier non autorisé"));
    }
  },
});

// Serve uploaded files statically
app.use("/uploads", express.static(uploadDir));

// Make io accessible in routes
app.set("io", io);

app.use("/messages", messageRoutes);

// ── File upload endpoint ──
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Aucun fichier fourni" });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    fileUrl,
    fileName: req.file.originalname,
    fileType: req.file.mimetype,
  });
});

// ── Notification: create a notification ──
app.post("/notifications", async (req, res) => {
  try {
    const { type, title, message, userId, projectId } = req.body;
    const notif = new Notification({ type, title, message, userId, projectId });
    await notif.save();
    // Emit to specific user only
    if (userId) {
      io.to(`user_${userId}`).emit("notification", notif);
    }
    res.status(201).json(notif);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

app.get("/notifications", async (req, res) => {
  try {
    const filter = {};
    if (req.query.unread === "true") filter.read = false;
    // Filter by userId so each user only sees their own notifications
    if (req.query.userId) filter.userId = req.query.userId;
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

app.put("/notifications/:id/read", async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: "Notification non trouvée" });
    res.json(notif);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

// ── Notification: mark all as read for a user ──
app.put("/notifications/read-all", async (req, res) => {
  try {
    const filter = { read: false };
    if (req.query.userId) filter.userId = req.query.userId;
    await Notification.updateMany(filter, { read: true });
    res.json({ message: "Toutes les notifications marquées comme lues" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

// ── Unread messages count per project for a user ──
app.get("/unread-counts", async (req, res) => {
  try {
    const { userId, projectIds } = req.query;
    if (!userId || !projectIds) {
      return res.json({});
    }
    const ids = projectIds.split(",");
    const counts = {};

    // Get last read timestamps from the lastRead map
    for (const pid of ids) {
      const key = `${userId}_${pid}`;
      const lastRead = lastReadMap.get(key) || new Date(0);
      const count = await Message.countDocuments({
        projectId: pid,
        createdAt: { $gt: lastRead },
        user: { $ne: userId },
      });
      if (count > 0) counts[pid] = count;
    }
    res.json(counts);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

// ── Mark project messages as read ──
app.put("/mark-read/:projectId", async (req, res) => {
  try {
    const { userId } = req.body;
    if (userId && req.params.projectId) {
      const key = `${userId}_${req.params.projectId}`;
      lastReadMap.set(key, new Date());
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

// In-memory map for last-read timestamps (persists during runtime)
const lastReadMap = new Map();

// Helper: create notification for a specific user and emit via socket
const sendNotification = async (type, title, message, userId, projectId) => {
  try {
    const notif = new Notification({ type, title, message, userId, projectId });
    await notif.save();
    // Emit to specific user room only
    if (userId) {
      io.to(`user_${userId}`).emit("notification", notif);
    }
  } catch (err) {
    console.error("Notification error:", err.message);
  }
};

// Socket.IO auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Token requis"));
  }
  try {
    const decoded = jwt.verify(token, process.env.SECRET_TOKEN);
    socket.user = { id: decoded.id, role: decoded.role, email: decoded.email };
    next();
  } catch (err) {
    next(new Error("Token invalide"));
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.user.id);

  // Join user's personal room for targeted notifications
  socket.join(`user_${socket.user.id}`);

  socket.on("joinProject", (projectId) => {
    console.log(`User ${socket.user.id} joining project ${projectId}`);
    socket.join(projectId);
    // Mark as read when joining
    const key = `${socket.user.id}_${projectId}`;
    lastReadMap.set(key, new Date());
  });

  socket.on("leaveProject", (projectId) => {
    console.log(`User ${socket.user.id} leaving project ${projectId}`);
    socket.leave(projectId);
  });

  socket.on("sendMessage", async (data) => {
    try {
      const message = new Message({
        text: data.text || "",
        projectId: data.projectId,
        user: socket.user.id,
        username: socket.user.email.split("@")[0],
        fileUrl: data.fileUrl || null,
        fileName: data.fileName || null,
        fileType: data.fileType || null,
      });
      await message.save();
      io.to(data.projectId).emit("newMessage", message);

      // Notify other users in the project (not the sender)
      const content = data.fileUrl
        ? `${message.username} a partagé un fichier`
        : `${message.username || "Utilisateur"}: ${data.text.substring(0, 50)}`;

      // Get all sockets in the project room to notify them
      const room = io.sockets.adapter.rooms.get(data.projectId);
      if (room) {
        for (const socketId of room) {
          const s = io.sockets.sockets.get(socketId);
          if (s && s.user.id !== socket.user.id) {
            await sendNotification(
              data.fileUrl ? "file_shared" : "message_sent",
              "Nouveau message",
              content,
              s.user.id,
              data.projectId
            );
          }
        }
      }
    } catch (error) {
      socket.emit("error", { message: "Erreur envoi message" });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.user.id);
  });
});

httpServer.listen(PORT, async () => {
  mongoose
    .connect("mongodb://localhost:27017/project-cloud")
    .then(() => {
      console.log("Connected to MongoDB");
      console.log(`Service Messages running on port ${PORT}`);
    })
    .catch((err) => {
      console.error("Error connecting to MongoDB:", err);
    });
  console.log(`Service Messages running on port ${PORT}`);
});
