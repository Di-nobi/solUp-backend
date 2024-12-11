import { Request, Response } from "express";
import School from "../models/SchoolData";
import { decoded } from "../utils/decodeJwt";
import User from "../models/UserData";

// Add a new school
export const addSchool = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = decoded(req).userId;
    const getProfile = await User.findById(user);
    if (!getProfile) {
      return res.status(401).json({ error: "User not found" });
    }
    const school = new School({ ...req.body, userId: user });

    await school.save();
    getProfile.school.push(school);
    await getProfile.save();
    res.status(201).json(school);
  } catch (error) {
    res.status(500).json({ error: "Unable to add school" });
  }
};

// Get schools by user ID
export const getSchoolsByUser = async (req: Request, res: Response) => {
  try {
    const user = decoded(req).userId;
    const getProfile = await User.findById(user);
    if (!getProfile) {
      return res.status(401).json({ error: "User not found" });
    }

    const schools = await School.find({ userId: req.params.userId });
    res.status(200).json(schools);
  } catch (error) {
    res.status(500).json({ error: "Unable to fetch schools" });
  }
};

// Update a school
export const updateSchool = async (req: Request, res: Response) => {
  try {
    const user = decoded(req).userId;
    const getProfile = await User.findById(user);
    if (!getProfile) {
      return res.status(401).json({ error: "User not found" });
    }

    const school = await School.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!school) {
      return res.status(404).json({ error: "School not found" });
    }
    getProfile.school.filter(r => r._id !== req.params.id);
    getProfile.school.push(school);
    await getProfile.save();
    res.status(200).json(school);
  } catch (error) {
    res.status(500).json({ error: "Unable to update school" });
  }
};

// Delete a school
export const deleteSchool = async (req: Request, res: Response) => {
  try {
    const user = decoded(req).userId;
    const getProfile = await User.findById(user);
    if (!getProfile) {
      return res.status(401).json({ error: "User not found" });
    }
    const school = await School.findByIdAndDelete(req.params.id);
    if (!school) {
      return res.status(404).json({ error: "School not found" });
    }
    getProfile.school.filter(r => r._id !== req.params.id);
    await getProfile.save();
    res.status(200).json({ message: "School deleted" });
  } catch (error) {
    res.status(500).json({ error: "Unable to delete school" });
  }
};
