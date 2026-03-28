import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema({
  text: { type: String, default: "" },
  user: { type: String },
  username: { type: String },
  projectId: { type: String },
  fileUrl: { type: String, default: null },
  fileName: { type: String, default: null },
  fileType: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);

export default Message;
