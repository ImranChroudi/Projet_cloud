import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import Project from "./modules/project.js";
import Category from "./modules/category.js";
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import authMidlleware from "./midllewares/auth.js";

dotenv.config();
const app = express();
const PORT = 3000;
const NOTIFICATION_URL = process.env.NOTIFICATION_URL || "http://localhost:3003";

const sendNotification = async (type, title, message, userId, projectId) => {
  try {
    console.log(`Sending notification: type=${type}, title=${title}, message=${message}, userId=${userId}, projectId=${projectId}`);
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


app.post("/projects", authMidlleware, async (req, res) => {
  console.log("Creating project with data:", req.body, "by user:", req.user);
  console.log(req.user)
  try {
    const newProject = new Project({ ...req.body, createdBy: req.user.id , members: [req.user.id , ...req.body.members] , ownerName: req.user.username });
    const project = await newProject.save();

    // Send notification only to added members (not the creator)
  
    const addedMembers = (req.body.members || []).filter(id => id !== req.user.id);
    for (const memberId of addedMembers) {
      console.log(`Sending notification for project ${project._id} to user ${memberId}`);
      await sendNotification(
        "project",
        "Ajouté à un projet",
        `Vous avez été ajouté au projet "${project.name}" par ${req.user.username}`,
        memberId,
        project._id
      );
    }
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

app.get("/projects", authMidlleware, async (req, res) => {
  try {
    const projects = await Project.find({members: req.user.id });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

app.get("/projects/search", authMidlleware, async (req, res) => {
  const { name, idCategory, startDate, endDate, status } = req.query;
  console.log('Search query:', req.query);
  const filter = {members: req.user.id  };
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
    const project = await Project.findOne({ _id: req.params.id , createdBy: req.user.id });
    if (!project) return res.status(404).json({ message: "Projet non trouvé" });
    await project.deleteOne();
    res.json({ message: "Projet supprimé" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});


app.get("/categories",authMidlleware ,  async (req, res) => {
  console.log('Fetching categories');
  const data = await Category.find({ createdBy: req.user.id });
  res.json(data);
});

app.post("/categories", authMidlleware, async (req, res) => {
  try {
    const cat = new Category({ ...req.body, createdBy: req.user.id, userName: req.user.username });
    await cat.save();
    res.status(201).json(cat);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

app.put("/categories/:id", authMidlleware, async (req, res) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, { ...req.body, createdBy: req.user.id, userName: req.user.username }, { new: true });
    if (!cat) return res.status(404).json({ message: "Catégorie non trouvée" });
    res.json(cat);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

app.delete("/categories/:id", authMidlleware, async (req, res) => {
  try {
    const cat = await Category.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!cat) return res.status(404).json({ message: "Catégorie non trouvée" });
    await cat.deleteOne();
    res.json({ message: "Catégorie supprimée" });
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
