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
 assignedTo: { type: [String], default: [] },
 responsible: { type: [String], default: [] },
 creatorName: String,

 projectId: String,

 attachments: [{
  fileName: String,
  fileUrl: String,
  uploadedAt: { type: Date, default: Date.now }
 }]

},{timestamps:true})

module.exports = mongoose.model("Task", TaskSchema)