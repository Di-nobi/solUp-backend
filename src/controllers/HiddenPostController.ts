import express, { Request, Response } from 'express';
import { HiddenPost } from "../models/HiddenPostData";
import Post from "../models/PepPostData";
import { decoded } from "../utils/decodeJwt";
import { BlockedUser } from '../models/BlockedUserData';
import Comment from '../models/CommentData';



export const managePostVisibility = async (req: Request, res: Response) => {
  try {
    const { postId, commentId } = req.params;
    const { action } = req.body;
    const user = decoded(req);
    const userId = user.userId;

    const isCommentAction = commentId !== undefined;

    if (!isCommentAction) {
      const post = await Post.findById(postId);
      if (!post) return res.status(404).json({ message: "Post not found" });

      if (action === "hide") {
        const existingHiddenPost = await HiddenPost.findOne({ userId, postId });
        if (existingHiddenPost) {
          return res.status(400).json({ message: "This post is already hidden" });
        }
        const hiddenPost = new HiddenPost({ userId, postId });
        await hiddenPost.save();
        return res.status(200).json({ message: "Post hidden successfully" });

      } else if (action === "block") {
        const existingBlock = await BlockedUser.findOne({ userId, blockedUserId: post.author });
        if (existingBlock) {
          return res.status(400).json({ message: "User already blocked" });
        }
        const block = new BlockedUser({ userId, blockedUserId: post.author });
        await block.save();
        return res.status(200).json({ message: "User blocked successfully" });

      } else {
        return res.status(400).json({ message: "Invalid action for post" });
      }

    } else {
      const comment = await Comment.findById(commentId);
      if (!comment) return res.status(404).json({ message: "Comment not found" });

      if (action === "hide") {
        const existingHiddenComment = await HiddenPost.findOne({ userId, commentId });
        if (existingHiddenComment) {
          return res.status(400).json({ message: "This comment is already hidden" });
        }
        const hiddenComment = new HiddenPost({ userId, postId, commentId });
        await hiddenComment.save();
        return res.status(200).json({ message: "Comment hidden successfully" });

      } else {
        return res.status(400).json({ message: "Invalid action for comment. Only 'hide' is allowed." });
      }
    }
  } catch (error) {
    console.error("Error managing post/comment visibility:", error);
    res.status(500).json({ message: "An error occurred while managing visibility." });
  }
};
  


//   const getUserFeed = async (req: Request, res: Response) => {
//     const user = decoded(req);
//     const userId = user.userId;
  
//     const hiddenPostIds = await HiddenPost.find({ userId }).distinct("postId");
  
//     const feedPosts = await Post.find({ _id: { $nin: hiddenPostIds } })
//       .sort({ createdAt: -1 }) // or other sorting criteria
//       .limit(20); // or other pagination settings
  
//     res.status(200).json(feedPosts);
//   };

// for later used in tracking feed