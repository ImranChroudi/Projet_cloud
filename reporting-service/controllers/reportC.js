const Project = require('../models/Project');
const Task = require('../models/Task');

//repartition des taches par priorite
const getTaskStats = async (req, res) => {
  try {
    const stats = await Task.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// taches par utilisateur
const getTasksByUser = async (req, res) => {
  try {
    const stats = await Task.aggregate([
      { $group: { _id: "$assignedTo", count: { $sum: 1 } } }
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getTaskStats, getTasksByUser };