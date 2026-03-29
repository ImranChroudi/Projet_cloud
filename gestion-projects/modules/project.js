import mongoose, { Schema } from "mongoose";

const projectSchema = new Schema({
  name: String,
  description: String,
  startDate: Date,
  endDate: Date,
  status: String,
  idCategory: { type: Schema.Types.ObjectId, ref: "Category" , default: null},
  members: {
    type: [Number],
    default: [],
  },
  createdBy: { type: Schema.Types.Mixed },
  ownerName: String
});

const Project = mongoose.model("Project", projectSchema);

export default Project;
