import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import messageRoutes from "./routes/messageRoutes.js";
import Message from "./models/Message.js";

dotenv.config();

const app = express();
const PORT = 3003;
const NOTIFICATION_URL = process.env.NOTIFICATION_URL || "http://localhost:3004";

const sendNotification = async (type, title, message, userId, projectId) => {
  try {
    await fetch(`${NOTIFICATION_URL}/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title, message, userId, projectId }),
    });
  } catch (err) {
    console.error("Notification error:", err.message);
  }
};
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
  console.log(data);
  try {
    const message = new Message({
        text: data.text,
        projectId: data.projectId,
        user: socket.user.id,
        username: socket.user.email.split("@")[0],
      });
      await message.save();
      const populated = await message.populate("user", "username");
      io.to(data.projectId).emit("newMessage", populated);
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
