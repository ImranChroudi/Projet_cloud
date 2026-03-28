const Project = require('../models/Project');
const Task = require('../models/Task');

// Répartition des tâches par priorité
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

// Tâches par utilisateur
const getTasksByUser = async (req, res) => {
  try {
    const stats = await Task.aggregate([
      { $group: { _id: "$assignedTo", count: { $sum: 1 }, responsible: { $first: "$responsible" } } }
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Avancement des projets (tâches par statut pour chaque projet)
const getProjectProgress = async (req, res) => {
  try {
    const projects = await Project.find().lean();

    const progress = await Task.aggregate([
      {
        $group: {
          _id: { projectId: "$projectId", status: "$status" },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.projectId",
          statuses: {
            $push: { status: "$_id.status", count: "$count" }
          },
          total: { $sum: "$count" }
        }
      }
    ]);

    // Merge project names
    const projectMap = {};
    projects.forEach(p => { projectMap[p._id.toString()] = p.name; });

    const result = progress.map(p => ({
      projectId: p._id,
      projectName: projectMap[p._id] || p._id || 'Sans projet',
      total: p.total,
      statuses: p.statuses,
      doneCount: p.statuses.find(s => s.status === 'done')?.count || 0,
      percentage: Math.round(
        ((p.statuses.find(s => s.status === 'done')?.count || 0) / p.total) * 100
      )
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Charge de travail par utilisateur (tâches par statut)
const getUserWorkload = async (req, res) => {
  try {
    const workload = await Task.aggregate([
      {
        $group: {
          _id: { user: "$assignedTo", status: "$status" },
          count: { $sum: 1 },
          responsible: { $addToSet: "$responsible" }
        }
      },
      {
        $group: {
          _id: "$_id.user",
          statuses: {
            $push: { status: "$_id.status", count: "$count" }
          },
          total: { $sum: "$count" },
          responsible: { $first: "$responsible" }
        }
      },
      { $sort: { total: -1 } }
    ]);

    console.log("Workload data:", workload);

    const result = workload.map(w => ({
      user: w._id || 'Non assigné',
      total: w.total,
      todo: w.statuses.find(s => s.status === 'todo')?.count || 0,
      inProgress: w.statuses.find(s => s.status === 'in-progress')?.count || 0,
      done: w.statuses.find(s => s.status === 'done')?.count || 0,
      responsible: w.responsible[0]
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Statistiques globales
const getOverviewStats = async (req, res) => {
  try {
    const [totalTasks, totalProjects, statusStats, recentTasks] = await Promise.all([
      Task.countDocuments(),
      Project.countDocuments(),
      Task.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      Task.find().sort({ createdAt: -1 }).limit(5).lean()
    ]);

    const statusMap = {};
    statusStats.forEach(s => { statusMap[s._id] = s.count; });

    res.json({
      totalTasks,
      totalProjects,
      todo: statusMap['todo'] || 0,
      inProgress: statusMap['in-progress'] || 0,
      done: statusMap['done'] || 0,
      recentTasks
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getTaskStats, getTasksByUser, getProjectProgress, getUserWorkload, getOverviewStats };