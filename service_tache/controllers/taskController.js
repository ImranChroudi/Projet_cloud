const { request } = require("express")
const Task = require("../models/Task")
const Comment = require("../models/Comment")
const multer = require("multer")
const path = require("path")
const fs = require("fs")

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads")),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip|rar/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    cb(ext ? null : new Error("Type de fichier non autorisé"), ext);
  }
});
exports.upload = upload;

exports.createTask = async (req,res)=>{
  console.log("Creating task with data:", req.user);
  console.log("Request body:", req.body);
 try{
  // Ensure assignedTo is always an array
  let assignedTo = req.body.assignedTo || [];
  if (typeof assignedTo === "string") assignedTo = assignedTo ? [assignedTo] : [];
  let responsible = req.body.responsible || [];
  if (typeof responsible === "string") responsible = responsible ? [responsible] : [];

  const task = new Task({...req.body, assignedTo, responsible, createdBy:String( req.user?.userId) , creatorName: req.user?.username || "Unknown" })
  await task.save()
  console.log("Task created:", req.app.get("sendNotification") ? "Yes" : "No", "Assigned to:", task.assignedTo);
  const sendNotification = req.app.get("sendNotification");
  if (sendNotification && task.assignedTo.length > 0) {
    for (const userId of task.assignedTo) {
      if (userId !== String(req.user?.userId)) {
        console.log(`Sending notification for task ${task._id} to user ${userId}`);
        await sendNotification(
          "task_created",
          "Nouvelle tâche assignée",
          `La tâche "${task.title}" vous a été assignée par ${req.user?.username || "un utilisateur"}`,
          userId,
          task.projectId
        );
      }
    }
  }
  res.status(201).json(task)
 }catch(err){
  res.status(500).json(err)
 }
}

exports.getTasks = async (req,res)=>{
  console.log("Getting tasks for user:", req.user);
 try{
  const userId = String(req.user?.userId);
  const filter = {
    $or:[
      { createdBy: userId },
      { assignedTo: userId },
    ]
  };
  if(req.query.projectId) 
    {
      filter.projectId = req.query.projectId
    }

  const tasks = await Task.find(filter)

  // Aggregate comment counts for these tasks
  const taskIds = tasks.map(t => t._id);
  const commentCounts = await Comment.aggregate([
    { $match: { taskId: { $in: taskIds } } },
    { $group: { _id: "$taskId", count: { $sum: 1 } } }
  ]);
  const countMap = {};
  for (const c of commentCounts) {
    countMap[c._id.toString()] = c.count;
  }
  const tasksWithCounts = tasks.map(t => {
    const obj = t.toObject();
    obj.commentCount = countMap[t._id.toString()] || 0;
    return obj;
  });

  console.log(`Tasks for user ${req.user?.userId} and project ${req.query.projectId}:`, tasksWithCounts);
  res.json(tasksWithCounts)
 }catch(err){
  res.status(500).json(err)
 }
}

exports.updateTask = async (req,res)=>{
 try{
  console.log(req.body)
  console.log(req.params.id)

  // Ensure assignedTo is always an array
  if (req.body.assignedTo !== undefined) {
    if (typeof req.body.assignedTo === "string") {
      req.body.assignedTo = req.body.assignedTo ? [req.body.assignedTo] : [];
    }
  }
  if (req.body.responsible !== undefined) {
    if (typeof req.body.responsible === "string") {
      req.body.responsible = req.body.responsible ? [req.body.responsible] : [];
    }
  }

  const task = await Task.findByIdAndUpdate(
   req.params.id,
   req.body,
   {new:true}
  )

  // Notify newly assigned users
  const sendNotification = req.app.get("sendNotification");
  if (sendNotification && req.body.assignedTo) {
    for (const userId of req.body.assignedTo) {
      if (userId !== String(req.user?.userId)) {
        await sendNotification(
          "task_updated",
          "Tâche mise à jour",
          `La tâche "${task.title}" vous a été assignée`,
          userId,
          task.projectId
        );
      }
    }
  }

  res.json(task)
 }catch(err){
  res.status(500).json(err)
 }
}

// Upload attachment
exports.uploadAttachment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Tâche introuvable" });

    const attachment = {
      fileName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      uploadedAt: new Date()
    };
    task.attachments.push(attachment);
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json(err);
  }
};

// Delete attachment
exports.deleteAttachment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Tâche introuvable" });

    const attachment = task.attachments.id(req.params.attachmentId);
    if (!attachment) return res.status(404).json({ message: "Fichier introuvable" });

    // Delete file from disk
    const filePath = path.join(__dirname, "..", attachment.fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    task.attachments.pull(req.params.attachmentId);
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json(err);
  }
};

// Get tasks with approaching deadlines
exports.getDeadlineReminders = async (req, res) => {
  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const userId = String(req.user?.userId);
    const tasks = await Task.find({
      deadline: { $gte: now, $lte: in24h },
      status: { $ne: "done" },
      $or: [{ createdBy: userId }, { assignedTo: userId }]
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json(err);
  }
};

// DELETE
exports.deleteTask = async (req,res)=>{
 try{
  const task = await Task.findById(req.params.id);
  if (task) {
    // Delete associated files
    for (const att of task.attachments || []) {
      const filePath = path.join(__dirname, "..", att.fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await Task.findByIdAndDelete(req.params.id);
  }
  res.json({message:"Deleted"})
 }catch(err){
  res.status(500).json(err)
 }
}

// CHANGE STATUS (Kanban)
exports.changeStatus = async (req,res)=>{
 try{
  const task = await Task.findByIdAndUpdate(
   req.params.id,
   {status: req.body.status},
   {new:true}
  )
  res.json(task)
 }catch(err){
  res.status(500).json(err)
 }
}