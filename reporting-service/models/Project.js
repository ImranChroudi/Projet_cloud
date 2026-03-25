const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: String,
  description: String,
  startDate: Date,
  endDate: Date,
  status: { type: String, enum: ["en cours", "terminé", "en attente"], default: "en cours" }
});

module.exports = mongoose.model("Project", projectSchema);