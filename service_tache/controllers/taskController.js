const { request } = require("express")
const Task = require("../models/Task")

exports.createTask = async (req,res)=>{
  console.log("Creating task with data:", req.user);
 try{
  const task = new Task({...req.body, createdBy:String( req.user?.userId) , creatorName: req.user?.username || "Unknown" , responsible: req.body.responsible || [] })
  await task.save()
  console.log("Task created:", task._id);
  const sendNotification = req.app.get("sendNotification");
  if (sendNotification && task.assignedTo && task.assignedTo !== String(req.user?.userId)) {
    await sendNotification(
      "task_created",
      "Nouvelle tâche assignée",
      `La tâche "${task.title}" vous a été assignée par ${req.user?.username || "un utilisateur"}`,
      task.assignedTo,
      task.projectId
    );
  }
  res.status(201).json(task)
 }catch(err){
  res.status(500).json(err)
 }
}

exports.getTasks = async (req,res)=>{
 try{
  const filter = {
    $or:[
      { createdBy: String(req.user?.userId) },
      { assignedTo: String(req.user?.userId) },
    ]
  };
  if(req.query.projectId) 
    {
      filter.projectId = req.query.projectId
    }

  const tasks = await Task.find(filter)

  console.log(`Tasks for user ${req.user?.userId} and project ${req.query.projectId}:`, tasks);
  res.json(tasks)
 }catch(err){
  res.status(500).json(err)
 }
}

exports.updateTask = async (req,res)=>{
 try{

  console.log(req.body)
  console.log(req.params.id)
  const task = await Task.findByIdAndUpdate(
   req.params.id,
   req.body,
   {new:true}
  )
  res.json(task)
 }catch(err){
  res.status(500).json(err)
 }
}

// DELETE
exports.deleteTask = async (req,res)=>{
 try{
  await Task.findByIdAndDelete(req.params.id)
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