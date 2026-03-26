import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import messageRoutes from "./routes/messageRoutes.js";
import Message from "./models/Message.js";
import Notification from "./models/Notification.js";

dotenv.config();

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

// Make io accessible in routes
app.set("io", io);

app.use("/messages", messageRoutes);

// ── Notification: create a notification ──
app.post("/notifications", async (req, res) => {
  try {
    const { type, title, message, userId, projectId } = req.body;
    const notif = new Notification({ type, title, message, userId, projectId });
    await notif.save();
    io.emit("notification", notif);
    res.status(201).json(notif);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

app.get("/notifications", async (req, res) => {
  try {
    const filter = {};
    if (req.query.unread === "true") filter.read = false;
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

// ── Notification: mark all as read ──
app.put("/notifications/read-all", async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ message: "Toutes les notifications marquées comme lues" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

// Helper: create notification locally and emit via socket
const sendNotification = async (type, title, message, userId, projectId) => {
  try {
    const notif = new Notification({ type, title, message, userId, projectId });
    await notif.save();
    io.emit("notification", notif);
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

  socket.on("joinProject", (projectId) => {
    console.log(`User ${socket.user.id} joining project ${projectId}`);
    socket.join(projectId);
  });

  socket.on("leaveProject", (projectId) => {
    console.log(`User ${socket.user.id} leaving project ${projectId}`);
    socket.leave(projectId);
  });

socket.on("sendMessage", async (data) => {
  try {
    const message = new Message({
        text: data.text,
        projectId: data.projectId,
        user: socket.user.id,
        username: socket.user.email.split("@")[0],
      });
          console.log("data received:", data);
      await message.save();
      const populated =  await Message.find({ _id: message._id });
      io.emit("newMessage", populated);
      console.log("data projectID:", data.projectId);
      await sendNotification("message_sent", "Nouveau message", `${populated.user?.username || "Utilisateur"}: ${data.text.substring(0, 50)}`, socket.user.id, data.projectId);
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
