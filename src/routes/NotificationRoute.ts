import { isAuthenticated } from "../middlewares/AuthValidate";
import { Router } from "express";
import { getNotifications, markNotificationAsRead } from "../controllers/NotificationController";

const router = Router();

router.get("/", isAuthenticated, getNotifications);
router.patch("/read", isAuthenticated, markNotificationAsRead);

export default router;