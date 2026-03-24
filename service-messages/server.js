import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import messageRoutes from "./routes/messageRoutes.js";

dotenv.config();

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());

app.use("/messages", messageRoutes);

app.listen(PORT, async () => {
  mongoose
    .connect("mongodb://localhost:27017/project-cloud")
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => {
      console.error("Error connecting to MongoDB:", err);
    });
  console.log(`Service Messages running on port ${PORT}`);
});
