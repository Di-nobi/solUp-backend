import { Router } from "express";
import { isAuthenticated } from "../middlewares/AuthValidate";
import { uploadMiddleware } from "../middlewares/Uploads";
import { getShareLinkPost } from "../controllers/PostControllers";

const router = Router();

router.get("/:postId", isAuthenticated, getShareLinkPost);

export default router;