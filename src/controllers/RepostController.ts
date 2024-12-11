
//Upcoming updates

import { Request, Response } from "express";
import Repost from "../models/RepostData"; 
import Post from "../models/PepPostData";
import User, { IUser } from "../models/UserData";
import NotificationData from "../models/NotificationData";
import { sendFCMNotification } from "../middlewares/fcm";
import { decoded } from "../utils/decodeJwt";
import Comment from "../models/CommentData";
import mongoose from "mongoose";


export const addRepost = async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const { repostThoughts } = req.body;
      const { postId } = req.params;
  
      const repostMedia = req.files && !Array.isArray(req.files) && req.files['media']
    ? (req.files['media'] as Express.MulterS3.File[]).map((file) => file.location)
    : [];
  
      const user = decoded(req);
      if (!user || !user.userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
  
      const post = await Post.findById(postId).session(session);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
  
      const userId = user.userId;
  
      if (repostThoughts) {
        const existingRepostWithThoughts = await Post.findOne({
          author: userId,
          postRef: post._id,
        }).session(session);
  
        if (existingRepostWithThoughts) {
          return res
            .status(400)
            .json({ message: "You have already reposted this post with thoughts" });
        }
          const newPost = new Post({
          author: userId,
          repostThoughts,
          repostMedia,
          postRef: post._id,
        });
        await newPost.save({ session });
      } else {
        const existingRepost = await Repost.findOne({ userId, postId }).session(
          session
        );
  
        if (existingRepost) {
          return res
            .status(400)
            .json({ message: "You have already reposted this post without thoughts" });
        }
          const repost = new Repost({
          userId,
          postId,
          createdAt: new Date(),
        });
        await repost.save({ session });
      }
  
      post.repostCount += 1;
      await post.save({ session });
  
      const notificationMessage = repostThoughts
        ? `${user.firstName} reposted your post with thoughts.`
        : `${user.firstName} reposted your post.`;
  
      const notification = new NotificationData({
        recipientId: post.author,
        senderId: userId,
        type: "repost",
        postId,
        message: notificationMessage,
      });
      await notification.save({ session });
  
      const postAuthor = await User.findById(post.author).session(session);
      if (postAuthor?.fcmToken) {
        await sendFCMNotification(
          postAuthor.fcmToken,
          "New Repost Alert",
          notificationMessage
        );
      }
  
      await session.commitTransaction();
      session.endSession();
  
      res.status(200).json({
        message: repostThoughts
          ? "Post reposted with thoughts successfully"
          : "Post reposted successfully",
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error("Repost Error:", error);
      res.status(500).json({ message: "An error occurred while reposting" });
    }
  };
  

  export const removeRepost = async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      const user = decoded(req);
      const userId = user.userId;
  
      const repost = await Repost.findOneAndDelete({ userId, postId });
      let isRepostWithThoughts = false;
  
      if (!repost) {
        const repostWithThoughts = await Post.findOneAndDelete({ postRef: postId, author: userId });
        if (!repostWithThoughts) {
          return res.status(404).json({ message: "Repost not found" });
        }
        isRepostWithThoughts = true;
      }

      const originalPost = await Post.findById(postId);
      if (originalPost && originalPost.repostCount > 0) {
        originalPost.repostCount -= 1;
        await originalPost.save();
      }

      await NotificationData.findOneAndDelete({
        recipientId: originalPost?.author,
        senderId: userId,
        type: "repost",
        postId,
      });
  
      res.status(200).json({
        message: isRepostWithThoughts
          ? "Repost with thoughts removed successfully"
          : "Repost removed successfully",
      });
    } catch (error) {
      console.error("Remove Repost Error:", error);
      res.status(500).json({ message: "An error occurred while removing the repost" });
    }
  };