const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const path = require("path")

const taskRoutes = require("./routes/taskRoutes")
const commentRoutes = require("./routes/commentRoutes")

const app = express()

const NOTIFICATION_URL = process.env.NOTIFICATION_URL || "http://localhost:3003";

const sendNotification = async (type, title, message, userId, projectId) => {
  try {
    await fetch(`${NOTIFICATION_URL}/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title, message, userId, projectId }),
    });
  } catch (err) {
    console.error("Notification error:", err.message);
  }
};

app.set("sendNotification", sendNotification);

app.use(cors())
app.use(express.json())

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

mongoose.connect("mongodb://localhost:27017/project-cloud")
.then(()=>console.log("DB connected"))

app.use("/tasks", taskRoutes)
app.use("/comments", commentRoutes)

// Deadline reminder check — runs every hour
const Task = require("./models/Task")
const checkDeadlines = async () => {
  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tasks = await Task.find({
      deadline: { $gte: now, $lte: in24h },
      status: { $ne: "done" }
    });
    for (const task of tasks) {
      const assignees = task.assignedTo || [];
      for (const userId of assignees) {
        await sendNotification(
          "deadline_reminder",
          "Rappel de deadline",
          `La tâche "${task.title}" arrive à échéance le ${new Date(task.deadline).toLocaleDateString("fr-FR")}`,
          userId,
          task.projectId
        );
      }
    }
    if (tasks.length > 0) console.log(`Sent deadline reminders for ${tasks.length} tasks`);
  } catch (err) {
    console.error("Deadline check error:", err.message);
  }
};

// Check deadlines every hour
setInterval(checkDeadlines, 60 * 60 * 1000);
// Also check on startup after 10s
setTimeout(checkDeadlines, 10000);

app.listen(5003, ()=>{
 console.log("Task service running")
})

