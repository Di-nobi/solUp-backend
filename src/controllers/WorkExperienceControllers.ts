import { Request, Response } from "express";
import WorkExperience from "../models/WorkExperienceData";
import { decoded } from "../utils/decodeJwt";
import User from "../models/UserData";
// Add a new work experience
export const addWorkExperience = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = decoded(req).userId;

    const getProfile = await User.findById(user);
    if (!getProfile) {
      return res.status(401).json({ error: "User not found" });
    }

    const workExperience = new WorkExperience({
      ...req.body,
      userId: user,
    });
    await workExperience.save();
    getProfile.workDetails.push(workExperience);
    await getProfile.save();
    res.status(201).json(workExperience);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to add work experience", error });
  }
};

// Get work experiences by user ID
export const getWorkExperiencesByUser = async (req: Request, res: Response) => {
  try {
    const user = decoded(req).userId;

    const getProfile = await User.findById(user);
    if (!getProfile) {
      return res.status(401).json({ error: "User not found" });
    }
    const workExperiences = await WorkExperience.find({
      userId: req.params.userId,
    });
    res.status(200).json(workExperiences);
  } catch (error) {
    res.status(500).json({ error: "Unable to fetch work experiences" });
  }
};

// Update a work experience
export const updateWorkExperience = async (req: Request, res: Response) => {
  try {
    const user = decoded(req).userId;

    const getProfile = await User.findById(user);
    if (!getProfile) {
      return res.status(401).json({ error: "User not found" });
    }
    const workExperience = await WorkExperience.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!workExperience) {
      return res.status(404).json({ error: "Work experience not found" });
    }
    getProfile.workDetails.filter(r => r._id !== req.params.id);
    getProfile.workDetails.push(workExperience);
    await getProfile.save();
    res.status(200).json(workExperience);
  } catch (error) {
    res.status(500).json({ error: "Unable to update work experience" });
  }
};

// Delete a work experience
export const deleteWorkExperience = async (req: Request, res: Response) => {
  try {
    const user = decoded(req).userId;

    const getProfile = await User.findById(user);
    if (!getProfile) {
      return res.status(401).json({ error: "User not found" });
    }
    const workExperience = await WorkExperience.findByIdAndDelete(
      req.params.id
    );
    if (!workExperience) {
      return res.status(404).json({ error: "Work experience not found" });
    }
    getProfile.workDetails.filter(r => r._id !== req.params.id);
    await getProfile.save();
    res.status(200).json({ message: "Work experience deleted" });
  } catch (error) {
    res.status(500).json({ error: "Unable to delete work experience" });
  }
};
