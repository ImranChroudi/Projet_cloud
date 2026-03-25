const express = require("express")
const router = express.Router()

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

router.post("/", createTask)

router.get("/", getTasks)

router.put("/:id", updateTask)

router.delete("/:id", deleteTask)

// Kanban
router.put("/status/:id", changeStatus)

// Comments nested under tasks
router.post("/:taskId/comments", addComment)
router.get("/:taskId/comments", getComments)

module.exports = router