const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")

const taskRoutes = require("./routes/taskRoutes")
const commentRoutes = require("./routes/commentRoutes")

const app = express()

app.use(cors())
app.use(express.json())

mongoose.connect("mongodb://localhost:27017/project-cloud")
.then(()=>console.log("DB connected"))

app.use("/tasks", taskRoutes)
app.use("/comments", commentRoutes)

app.listen(5003, ()=>{
 console.log("Task service running")
})

