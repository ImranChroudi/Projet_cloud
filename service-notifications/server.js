import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Notification from "./models/Notification.js";

dotenv.config();

const app = express();
const PORT = 3004;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json());

// ── REST: other services call this to create a notification ──
app.post("/notifications", async (req, res) => {
  try {
    const { type, title, message, userId, projectId } = req.body;
    const notif = new Notification({ type, title, message, userId, projectId });
    await notif.save();
    // Broadcast to all connected clients
    io.emit("notification", notif);
    res.status(201).json(notif);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

// ── REST: get notifications (with optional unread filter) ──
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

// ── REST: mark notification as read ──
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

// ── REST: mark all as read ──
app.put("/notifications/read-all", async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ message: "Toutes les notifications marquées comme lues" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

// ── Socket.IO: auth + live connection ──
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Token requis"));
  try {
    const decoded = jwt.verify(token, process.env.SECRET_TOKEN);
    socket.user = { id: decoded.id, role: decoded.role, email: decoded.email };
    next();
  } catch (err) {
    next(new Error("Token invalide"));
  }
});

io.on("connection", (socket) => {
  console.log("Notification client connected:", socket.user.id);
  socket.on("disconnect", () => {
    console.log("Notification client disconnected:", socket.user.id);
  });
});

httpServer.listen(PORT, () => {
  mongoose
    .connect("mongodb://localhost:27017/project-cloud")
    .then(() => console.log("Notifications DB connected"))
    .catch((err) => console.error("DB error:", err));
  console.log(`Service Notifications running on port ${PORT}`);
});
