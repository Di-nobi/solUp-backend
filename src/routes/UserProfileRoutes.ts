import express from "express";
import { isAuthenticated } from "../middlewares/AuthValidate";
import { validate } from "../middlewares/Validate";
import { updateUserValidationRules } from "../middlewares/UserProfileValidate";
import { getMyProfile, getUserProfileById, updateUser, uploadImage, updateFCMToken } from "../controllers/UserProfileControllers";
import { profileUpload } from "../middlewares/ProfileUpload";

const router = express.Router();

router.put(
  "/update-profile",
  isAuthenticated,
  updateUserValidationRules,
  validate,
  updateUser
);
router.post('/update-token', isAuthenticated, updateFCMToken);
router.post('/upload-image', isAuthenticated, profileUpload, uploadImage);
router.get('/my-profile', isAuthenticated, getMyProfile);
router.get('/user-profile/:userId', isAuthenticated, getUserProfileById);




export default router;
