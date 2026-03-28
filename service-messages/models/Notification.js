import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema({
  type: {
    type: String,
    enum: ["project", "task_created", "message_sent", "file_shared"],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  userId: { type: String },
  projectId: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
