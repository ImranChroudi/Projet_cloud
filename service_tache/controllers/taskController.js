const { request } = require("express")
const Task = require("../models/Task")

// CREATE
exports.createTask = async (req,res)=>{
 try{
  const task = new Task(req.body)
  await task.save()
  res.status(201).json(task)
 }catch(err){
  res.status(500).json(err)
 }
}

// READ
exports.getTasks = async (req,res)=>{
 try{
  const filter = {};
  if(req.query.projectId) filter.projectId = req.query.projectId;
  const tasks = await Task.find(filter)
  res.json(tasks)
 }catch(err){
  res.status(500).json(err)
 }
}

// UPDATE
exports.updateTask = async (req,res)=>{
 try{
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