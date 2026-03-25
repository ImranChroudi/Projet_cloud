require("dotenv").config();
const mongoose = require("mongoose");
const Task = require("./models/Task");
const Project = require("./models/Project");

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected for seeding...");
    await Task.deleteMany();
    await Project.deleteMany();
    const project1 = await Project.create({ name: "Project A", status: "In Progress" });
    const project2 = await Project.create({ name: "Project B", status: "Not Started" });
    await Task.create([
      { title: "Task 1", status: "To Do", priority: "High", assignedTo: "user1@example.com", project: project1._id },
      { title: "Task 2", status: "In Progress", priority: "Medium", assignedTo: "user2@example.com", project: project1._id },
      { title: "Task 3", status: "Done", priority: "Low", assignedTo: "user1@example.com", project: project2._id },
    ]);

    console.log("Seeding done!");
    process.exit();
  })
  .catch(err => console.log(err));