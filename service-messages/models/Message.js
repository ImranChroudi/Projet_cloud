import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema({
  text: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: "User" },
  username: { type: String },
  projectId: { type: Schema.Types.ObjectId, ref: "Project" },
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);

export default Message;
