import { isAuthenticated } from "../middlewares/AuthValidate";
import { Router } from "express";
import { managePostVisibility,  } from "../controllers/HiddenPostController";

const router = Router();

router.post("/:postId", isAuthenticated, managePostVisibility);


export default router;