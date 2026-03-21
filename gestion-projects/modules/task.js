import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema({
  text: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

const taskSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  status: { type: String, enum: ["todo", "in-progress", "done"], default: "todo" },
  deadline: Date,
  assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
  projectId: { type: Schema.Types.ObjectId, ref: "Project" },
  comments: [commentSchema],
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Task = mongoose.model("Task", taskSchema);

export default Task;
