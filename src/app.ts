import 'reflect-metadata';
import express, { Application } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/AuthRoutes";
import schoolRoutes from "./routes/SchoolRoutes";
import groupRoutes from "./routes/GroupRoutes";
import workExperienceRoutes from "./routes/WorkExperienceRoutes";
import updateProfileRoutes from "./routes/UserProfileRoutes";
import postRoutes from "./routes/PostRoutes";
import commentRoutes from "./routes/CommentRoutes";
import connectionRoutes from "./routes/ConnectionRoutes";
import jobPostingRoutes from "./routes/JobPostingRoutes";
import messageRoutes from "./routes/MessageRoutes";
import repostRoutes from "./routes/RepostRoutes";
import reportRoutes from "./routes/ReportRoutes";
import hideRoutes from "./routes/HidePostRoute";
import notificationRoute from "./routes/NotificationRoute";
import shareLinkRoutes from "./routes/ShareLinkRoutes";
import { status } from './routes/status.route'
import { errorHandler } from "./middlewares/ErrorHandler";
import { app } from "./websocket/HandleSocket";
import { DatabaseWatcher } from "./utils/databaseWatcher";
import path from "path";
import cors from 'cors';



dotenv.config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Used to server static files - have to get the destination from the mobile application
app.use(
  "/uploads/posts",
  express.static(path.join(__dirname, "uploads/posts"))
);
app.use(
  "/uploads/profile",
  express.static(path.join(__dirname, "uploads/profile"))
);
app.use(
  "/uploads/resumes",
  express.static(path.join(__dirname, "uploads/resumes"))
);
app.use(
  "/uploads/banner",
  express.static(path.join(__dirname, "uploads/banner"))
);
app.use(
  "/uploads/groupMedia",
  express.static(path.join(__dirname, "uploads/groupMedia"))
);
app.use(
  "/uploads/groupPicture",
  express.static(path.join(__dirname, "uploads/groupPicture"))
);
app.use(
  "/uploads/media",
  express.static(path.join(__dirname, "uploads/media"))
);
app.use(
  "/uploads/logos",
  express.static(path.join(__dirname, "uploads/logos"))
);

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1);
  }
};

// connectDB(); -- moved the connectDB function to the server file

// Add routes here
app.use("/api/auth", authRoutes);
app.use("/api/profile", schoolRoutes);
app.use("/api/profile", workExperienceRoutes);
app.use("/api/profile", updateProfileRoutes);
app.use("/api/pep-post", postRoutes);
app.use("/api/pep-post/comments", commentRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/jobs", jobPostingRoutes);
app.use("/api/messages", messageRoutes);
app.use("/group", groupRoutes);
app.use("/api/repost", repostRoutes);
app.use("/api/hide", hideRoutes);
app.use("/api", reportRoutes);
app.use("/api/notifications", notificationRoute);
app.use("/posts", shareLinkRoutes);
app.use("/api", status);

// Error handling middleware to catch any errors centrally
app.use(errorHandler)

// Initialize all database watchers
DatabaseWatcher.initializeWatchers().catch((error) => {
  console.error("Error initializing watchers:", error);
});

