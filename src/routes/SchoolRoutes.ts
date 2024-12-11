import express from "express";
import { body } from "express-validator";
import {
  addSchool,
  getSchoolsByUser,
  updateSchool,
  deleteSchool,
} from "../controllers/SchoolControllers";
import { validate } from "../middlewares/Validate";
import { isAuthenticated } from "../middlewares/AuthValidate";
import { schoolValidationRules } from "../middlewares/UserProfileValidate";

const router = express.Router();

router.post(
  "/schools",
  isAuthenticated,
  schoolValidationRules,
  validate,
  addSchool
);
router.get("/schools/:userId", isAuthenticated, getSchoolsByUser);
router.put(
  "/schools/:id",
  isAuthenticated,
  schoolValidationRules,
  validate,
  updateSchool
);
router.delete("/schools/:id", isAuthenticated, deleteSchool);

export default router;
