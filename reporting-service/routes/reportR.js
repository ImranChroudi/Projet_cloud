const express = require('express');
const router = express.Router();
const { getTaskStats, getTasksByUser } = require('../controllers/reportC');
const authMiddleware = require('../middleware/auth');

router.get('/tasks-priority', authMiddleware, getTaskStats);
router.get('/tasks-user', authMiddleware, getTasksByUser);

module.exports = router;