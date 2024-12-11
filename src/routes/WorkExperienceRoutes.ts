import express from "express";
import { body } from "express-validator";
import {
  addWorkExperience,
  getWorkExperiencesByUser,
  updateWorkExperience,
  deleteWorkExperience,
} from "../controllers/WorkExperienceControllers";
import { validate } from "../middlewares/Validate";
import { isAuthenticated } from "../middlewares/AuthValidate";
import { workExperienceValidationRules } from "../middlewares/UserProfileValidate";

const router = express.Router();

router.post(
  "/work-experiences",
  isAuthenticated,
  workExperienceValidationRules,
  validate,
  addWorkExperience
);
router.get(
  "/work-experiences/:userId",
  isAuthenticated,
  getWorkExperiencesByUser
);
router.put(
  "/work-experiences/:id",
  isAuthenticated,
  workExperienceValidationRules,
  validate,
  updateWorkExperience
);
router.delete("/work-experiences/:id", isAuthenticated, deleteWorkExperience);

export default router;
