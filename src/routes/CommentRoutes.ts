
import express from "express";
import {
  addReactionToComment,
  createComment,
  deleteComment,
  editComment,
  getCommentsForPost,
  getComments
} from "../controllers/CommentController"; // Adjust the path
import { isAuthenticated } from "../middlewares/AuthValidate";
import { commentUpload } from "../middlewares/commentMediaUpload";
import { createCommentValidationRules } from "../middlewares/CommentValidators";

const router = express.Router();

router.post(
  "/:id/create",
  isAuthenticated,
  createCommentValidationRules,
  commentUpload,
  createComment
);

router.get("/:postId", isAuthenticated, getCommentsForPost);

router.post("/:commentId", isAuthenticated, addReactionToComment);
router.delete("/:commentId", isAuthenticated, deleteComment);
router.get("/post/:postId", isAuthenticated, getComments)
router.patch("/:commetId", isAuthenticated, editComment)

export default router;
