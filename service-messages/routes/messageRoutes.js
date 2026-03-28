import express from "express";
import Message from "../models/Message.js";
import authMiddleware from "../middlewares/auth.js";

const router = express.Router();

router.get("/:projectId", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ projectId: req.params.projectId })
    console.log(`Messages pour le projet ${messages} :`, messages);

    console.log(`Messages pour le projet ${req.params.projectId} :`, messages);
    
    console.log(`Messages pour le projet ${req.params.projectId} :`, messages);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const message = new Message({ ...req.body, user: req.user.id , username: req.user.email.split("@")[0]});
    await message.save();
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

router.get("/" , (req, res) => {
    console.log("Service de messagerie opérationnel");
  res.json({ message: "Service de messagerie opérationnel" });
});

export default router;
