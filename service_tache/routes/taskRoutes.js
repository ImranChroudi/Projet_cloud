const express = require("express")
const router = express.Router()
const { authMidlleware } = require("../midllewares/auth")

const {
 createTask,
 getTasks,
 updateTask,
 deleteTask,
 changeStatus
} = require("../controllers/taskController")

const {
 addComment,
 getComments
} = require("../controllers/commentController")

router.post("/", authMidlleware, createTask)

router.get("/", authMidlleware, getTasks)

router.put("/:id", authMidlleware, updateTask)

router.delete("/:id", authMidlleware, deleteTask)

// Kanban
router.put("/status/:id", authMidlleware, changeStatus)

// Comments nested under tasks
router.post("/:taskId/comments", authMidlleware, addComment)
router.get("/:taskId/comments", authMidlleware, getComments)

module.exports = router