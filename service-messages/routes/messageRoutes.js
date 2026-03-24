import express from "express";
import Message from "../models/Message.js";
import authMiddleware from "../middlewares/auth.js";

const router = express.Router();

router.get("/:projectId", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ projectId: req.params.projectId })
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const message = new Message({ ...req.body, user: req.user.id });
    await message.save();
    const populated = await message.populate("user", "username");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

export default router;
