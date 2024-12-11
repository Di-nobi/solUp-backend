import { Router } from "express";
import { isAuthenticated } from "../middlewares/AuthValidate";
import { uploadMiddleware } from "../middlewares/Uploads";
import {
  deletePost,
  getAllPosts,
  editPost,
  getSavedPosts,
  removeSavedPost,
  savePost,
  searchUsers,
  createPost,
} from "../controllers/PostControllers";
import { createPostValidationRules, reactToPostValidationRules } from "../middlewares/PepPostValidators";
import { toggleReaction } from "../controllers/ReactionController";

const router = Router();

router.post(
  "/create-post",
  isAuthenticated,
  createPostValidationRules,
  uploadMiddleware,
  createPost
);

router.get("/get-posts", isAuthenticated, getAllPosts);
router.delete("/:postId", isAuthenticated, deletePost);
router.get("/find-user", isAuthenticated, searchUsers);
router.put("/edit-post/:postId", isAuthenticated, createPostValidationRules, uploadMiddleware,
   editPost);
router.post('/:postId/reactions', isAuthenticated, reactToPostValidationRules, toggleReaction);
router.post('/save-post/:postId', isAuthenticated, savePost);
router.get('/saved-posts', isAuthenticated, getSavedPosts);
router.delete('/saved-posts/:postId', isAuthenticated, removeSavedPost);



// router.delete('/:postId/reactions/:reactionId', isAuthenticated, deleteReaction);


export default router;
