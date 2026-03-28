const mongoose = require("mongoose")

const TaskSchema = new mongoose.Schema({

 title: { type: String, required: true },

 description: String,

 priority: {
  type: String,
  enum: ["low","medium","high"],
  default: "medium"
 },

 deadline: Date,

 status: {
  type: String,
  enum: ["todo","in-progress","done"],
  default: "todo"
 },
 createdBy: String,
 assignedTo: String,
 responsible: String,
 creatorName: String,

 projectId: String

},{timestamps:true})

module.exports = mongoose.model("Task", TaskSchema)