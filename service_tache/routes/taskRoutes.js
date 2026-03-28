const express = require("express")
const router = express.Router()
const { authMidlleware } = require("../midllewares/auth")

const {
 createTask,
 getTasks,
 updateTask,
 deleteTask,
 changeStatus,
 uploadAttachment,
 deleteAttachment,
 getDeadlineReminders,
 upload
} = require("../controllers/taskController")

const {
 addComment,
 getComments
} = require("../controllers/commentController")

router.post("/", authMidlleware, createTask)

router.get("/", authMidlleware, getTasks)

// Deadline reminders (must be before /:id routes)
router.get("/deadlines", authMidlleware, getDeadlineReminders)

router.put("/:id", authMidlleware, updateTask)

router.delete("/:id", authMidlleware, deleteTask)

// Kanban
router.put("/status/:id", authMidlleware, changeStatus)

// File attachments
router.post("/:id/attachments", authMidlleware, upload.single("file"), uploadAttachment)
router.delete("/:id/attachments/:attachmentId", authMidlleware, deleteAttachment)

// Comments nested under tasks
router.post("/:taskId/comments", authMidlleware, addComment)
router.get("/:taskId/comments", authMidlleware, getComments)

module.exports = router