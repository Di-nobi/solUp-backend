import { Router } from "express";
import { isAuthenticated } from "../middlewares/AuthValidate";
import { uploadMiddleware } from "../middlewares/Uploads";
import { addRepost, removeRepost } from "../controllers/RepostController";

const router = Router();

router.post(
    "/add-repost/:postId",
    isAuthenticated,
    addRepost
  );

router.delete(
    "/remove-repost/:postId",
    isAuthenticated,
    removeRepost
)
export default router;