import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import authMidlleware from "./midllewares/auth.js";

dotenv.config();
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());





app.listen(PORT, async () => {
  mongoose
    .connect("mongodb://localhost:27017/project-cloud")
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => {
      console.error("Error connecting to MongoDB:", err);
    });
  console.log(`Server is running on port ${PORT}`);
});
