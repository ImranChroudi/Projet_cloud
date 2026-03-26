import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import Project from "./modules/project.js";
import Category from "./modules/category.js";
import User from "./modules/user.js";
import Task from "./modules/task.js";
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import authMidlleware from "./midllewares/auth.js";

dotenv.config();
const app = express();
const PORT = 3000;
const NOTIFICATION_URL = process.env.NOTIFICATION_URL || "http://localhost:3003";

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

app.use(cors());
app.use(express.json());


app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    if (user.status === "banned") {
      return res.status(403).json({ message: "Votre compte est bloqué" });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.SECRET_TOKEN
    );
    res.json({ token, user: { _id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(400).json({ message: "Username ou email déjà utilisé" });
    }
    const user = new User({ username, email, password });
    await user.save();
    res.status(201).json({ message: "Inscription réussie" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

// ===================== USERS =====================

app.get("/users", authMidlleware, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

app.post("/users", authMidlleware, async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

app.put("/users/:id", authMidlleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: Date.now() }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

app.delete("/users/:id", authMidlleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Utilisateur supprimé" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

// ===================== PROJECTS =====================

app.post("/projects", authMidlleware, async (req, res) => {
  try {
    const newProject = new Project({ ...req.body, createdBy: req.user.id });
    const project = await newProject.save();
    await sendNotification("project_created", "Nouveau projet", `Le projet "${project.name}" a été créé`, req.user.id, project._id);
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

app.get("/projects", authMidlleware, async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

app.get("/projects/search", async (req, res) => {
  const { name, idCategory, startDate, endDate, status } = req.query;
  console.log('Search query:', req.query);
  const filter = {};
  if (name) filter.name = { $regex: name, $options: "i" };
  if (idCategory) filter.idCategory = idCategory;
  if (startDate && endDate) {
    filter.startDate = { $gte: new Date(startDate) };
    filter.endDate = { $lte: new Date(endDate) };
  }
  if (status) filter.status = status;
  const projects = await Project.find(filter);
  res.json(projects);
});

app.put("/projects/:id", authMidlleware, async (req, res) => {
  console.log("Updating project:", req.params.id, req.body);
  try {
    const project = await Project.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!project) return res.json({success : false , message: "Projet non trouvé" });
    Object.assign(project, req.body);
    await project.save();
    res.json({success: true, project});
  } catch (error) {
    res.status(500).json({success: false, message: "Erreur serveur", error });
  }
});

app.delete("/projects/:id", authMidlleware, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!project) return res.status(404).json({ message: "Projet non trouvé" });
    await project.deleteOne();
    res.json({ message: "Projet supprimé" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});


app.get("/categories", async (req, res) => {
  console.log('Fetching categories');
  const data = await Category.find();
  res.json(data);
});

app.post("/categories", authMidlleware, async (req, res) => {
  try {
    const cat = new Category(req.body);
    await cat.save();
    res.status(201).json(cat);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

app.put("/categories/:id", authMidlleware, async (req, res) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cat) return res.status(404).json({ message: "Catégorie non trouvée" });
    res.json(cat);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

app.delete("/categories/:id", authMidlleware, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Catégorie supprimée" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});


app.get("/tasks", authMidlleware, async (req, res) => {
  try {
    const filter = {};
    if (req.query.projectId) filter.projectId = req.query.projectId;
    const tasks = await Task.find(filter)
      .populate("assignedTo", "username email")
      .populate("projectId", "name")
      .populate("comments.user", "username");
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

app.post("/tasks", authMidlleware, async (req, res) => {
  try {
    const task = new Task({ ...req.body, createdBy: req.user.id });
    await task.save();
    const populated = await task.populate("assignedTo", "username email");
    await sendNotification("task_created", "Nouvelle tâche", `La tâche "${task.title}" a été créée`, req.user.id, task.projectId);
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

app.put("/tasks/:id", authMidlleware, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    ).populate("assignedTo", "username email").populate("comments.user", "username");
    if (!task) return res.status(404).json({ message: "Tâche non trouvée" });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

app.delete("/tasks/:id", authMidlleware, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Tâche supprimée" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

app.post("/tasks/:id/comments", authMidlleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Tâche non trouvée" });
    task.comments.push({ text: req.body.text, user: req.user.id });
    await task.save();
    const populated = await task.populate("comments.user", "username");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});





app.listen(PORT, async () => {
  mongoose
    .connect("mongodb://localhost:27017/project-cloud")
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => {
      console.error("Error connecting to MongoDB:", err);
    });
  console.log(`Server is running on port ${PORT}`);
});
