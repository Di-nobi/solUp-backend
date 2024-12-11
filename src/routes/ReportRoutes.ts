import { Router } from "express";
import { isAuthenticated } from "../middlewares/AuthValidate";
import { reportPost,  } from "../controllers/ReportPostController";
import { reportUser } from "../controllers/ReportUserController";
const router = Router();

router.post(
    "/add-report/post/:postId",
    isAuthenticated,
    reportPost
  );
  router.post(
    "/add-report/user/:reportedUserId",
    isAuthenticated,
    reportUser
  );

export default router;