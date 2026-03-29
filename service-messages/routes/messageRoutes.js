import express from "express";
import Message from "../models/Message.js";
import authMiddleware from "../middlewares/auth.js";

const router = express.Router();

router.get("/:projectId", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ projectId: req.params.projectId })
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    console.log("Données reçues pour le message :", req.body);
    const message = new Message({ ...req.body, user: req.user.id , username: req.user.username });
    await message.save();
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

router.get("/" , (req, res) => {
  res.json({ message: "Service de messagerie opérationnel" });
});

export default router;
