const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")

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

mongoose.connect("mongodb://localhost:27017/project-cloud")
.then(()=>console.log("DB connected"))

app.use("/tasks", taskRoutes)
app.use("/comments", commentRoutes)

app.listen(5003, ()=>{
 console.log("Task service running")
})

