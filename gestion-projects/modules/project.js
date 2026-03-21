import mongoose, { Schema } from "mongoose";

const projectSchema = new Schema({
  name: String,
  description: String,
  startDate: Date,
  endDate: Date,
  status: String,
  idCategory: { type: Schema.Types.ObjectId, ref: "Category" },
  members: {
    type: [{ type: Schema.Types.ObjectId, ref: "User" }],
    default: [],
  },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
});

const Project = mongoose.model("Project", projectSchema);

export default Project;
