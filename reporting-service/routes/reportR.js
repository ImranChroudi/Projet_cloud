const express = require('express');
const router = express.Router();
const { getTaskStats, getTasksByUser, getProjectProgress, getUserWorkload, getOverviewStats } = require('../controllers/reportC');
const authMiddleware = require('../middleware/auth');

router.get('/tasks-priority', authMiddleware, getTaskStats);
router.get('/tasks-user', authMiddleware, getTasksByUser);
router.get('/project-progress', authMiddleware, getProjectProgress);
router.get('/user-workload', authMiddleware, getUserWorkload);
router.get('/overview', authMiddleware, getOverviewStats);

module.exports = router;