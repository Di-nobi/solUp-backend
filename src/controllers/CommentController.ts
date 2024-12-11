
import { Request, Response } from "express";
import Post from "../models/PepPostData";
import Comment from "../models/CommentData";
import NotificationData from "../models/NotificationData";
import User from "../models/UserData";
import Reaction from "../models/ReactionData"; 
import { sendFCMNotification } from "../middlewares/fcm";
import { decoded } from "../utils/decodeJwt";
import mongoose from "mongoose";
import NotificationPreference from "../models/TurnOnNotificationData";

export const createComment = async (req: Request, res: Response) => {
  try {
  
    const { id } = req.params; 
  
    const { content } = req.body;
    const media = (req.files as { [fieldname: string]: Express.MulterS3.File[] })?.['media']?.[0]?.location || "";

    const user = decoded(req);

    if (!user.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const getuser = await User.findById(user.userId);
    if (!getuser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Content is required" });
    }

    let comment;
    let notificationRecipient;
    let notificationMessage;

    const post = await Post.findById(id);

    if (post) {
      comment = new Comment({
        content,
        media,
        postId: id,
        userId: user.userId,
        createdAt: new Date(),
      });
      post.commentCount += 1;
      await post.save();
      notificationRecipient = post.author;
      notificationMessage = `${getuser.firstName} commented on your post`;
    } else {
      const parentComment = await Comment.findById(id);
      if (!parentComment) {
        return res.status(404).json({ message: "Invalid postId or commentId" });
      }
      comment = new Comment({
        content,
        media,
        commentId: id,
        userId: user.userId,
        createdAt: new Date(),
      });

      parentComment.commentCount += 1;
      await parentComment.save();

      notificationRecipient = parentComment.userId;
      notificationMessage = `${getuser.firstName} replied to your comment`;
    }

    await comment.save();
//commentCount
    const notification = new NotificationData({
      senderId: getuser,
      recipientId: notificationRecipient,
      type: post ? "comment" : "reply",
      message: notificationMessage,
      postId: comment.postId || null,
      isRead: false,
    });

    await notification.save();

    const recipient = await User.findById(notificationRecipient);
    if (recipient && recipient.fcmToken) {
      await sendFCMNotification(
        recipient.fcmToken,
        post ? "New Comment Alert!" : "New Reply Alert!",
        notificationMessage
      );
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Something went wrong", error });
  }
};


export const getCommentsForPost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }


    const totalComments = await Comment.countDocuments({ postId, commentId: null });

    const topLevelComments = await Comment.find({ postId, commentId: null })
      .populate({
        path: "userId",
        model: "UserData",
        select: "firstName lastName _id profilePicture jobTitle",
      })
      .skip(skip)
      .limit(limit)
      .lean();

 
    const getReplies : any = async (parentId: string) => {
      const replies = await Comment.find({ commentId: parentId })
        .populate({
          path: "userId",
          model: "UserData",
          select: "firstName lastName _id profilePicture jobTitle",
        })
        .lean();

      return Promise.all(
        replies.map(async (reply) => ({
          ...reply,
          user: {
            ...reply.userId,
            profilePicture: reply.userId.profilePicture?.length
              ? reply.userId.profilePicture
              : null,
          },
          replies: await getReplies(reply._id), 
        }))
      );
    };

 
    const commentsWithReplies = await Promise.all(
      topLevelComments.map(async (comment) => ({
        ...comment,
        user: {
          ...comment.userId,
          profilePicture: comment.userId.profilePicture?.length
            ? comment.userId.profilePicture
            : null,
        },
        replies: await getReplies(comment._id),
      }))
    );

    return res.status(200).json({
      comments: commentsWithReplies,
      currentPage: page,
      totalPages: Math.ceil(totalComments / limit),
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
};



export const addReactionToComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { type } = req.body;
    const user = decoded(req);

    if (!user?.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userDetails = await User.findById(user.userId);
    if (!userDetails) {
      return res.status(404).json({ message: "User not found" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const existingReaction = await Reaction.findOne({ commentId, userId: user.userId });
    if (existingReaction) {
      await existingReaction.deleteOne();
      comment.reactionCount = Math.max(comment.reactionCount - 1, 0);
      await comment.save();
      return res.status(200).json({ message: "Reaction removed" });
    }

    const newReaction = new Reaction({
      userId: user.userId,
      commentId,
      type,
      createdAt: new Date(),
    });

    comment.reactionCount += 1;
    await newReaction.save();
    await comment.save();

    const notification = new NotificationData({
      senderId: userDetails._id,
      recipientId: comment.userId,
      type: "reaction",
      message: `${userDetails.firstName} reacted to your comment`,
      postId: comment.postId,
      isRead: false,
    });
    await notification.save();

    const recipient = await User.findById(comment.userId);
    if (recipient?.fcmToken) {
      await sendFCMNotification(
        recipient.fcmToken,
        "New Reaction Alert!",
        `${userDetails.firstName} reacted to your comment`
      );
    }

    return res.status(201).json({ message: "Reaction added" });
  } catch (error) {
    console.error("Error adding reaction:", error);
    res.status(500).json({ message: "Failed to add reaction" });
  }
};


export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const user = decoded(req);

    if (!user?.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userDetails = await User.findById(user.userId);
    if (!userDetails) {
      return res.status(404).json({ message: "User not found" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.userId.toString() !== user.userId.toString()) {
      return res.status(403).json({ message: "You are not authorized to delete this comment" });
    }

    if (comment.postId) {
      const post = await Post.findById(comment.postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      post.commentCount = Math.max(post.commentCount - 1, 0);
      await post.save();
    } else if (comment.commentId) {
      const parentComment = await Comment.findById(comment.commentId);
      if (parentComment) {
        parentComment.commentCount = Math.max(parentComment.commentCount - 1, 0);
        await parentComment.save();
      }
    }
    await Comment.deleteMany({ commentId });
    await comment.deleteOne();
    await Reaction.deleteMany({ commentId });

    res.status(200).json({ message: "Comment and associated replies deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Failed to delete comment" });
  }
};



export const editComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const media = req.file ? req.file.path : null;
    const user = decoded(req);

    if (!user.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const getuser = await User.findById(user.userId);
    if (!getuser) {
      return res.status(404).json({ message: "User not found" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    if (comment.userId.toString() !== user.userId.toString()) {
      return res.status(403).json({ message: "You are not authorized to edit this comment" });
    }
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Content is required" });
    }

    comment.content = content;

    if (media) {
      comment.media = media;
    }

    await comment.save();

    res.status(200).json({ message: "Comment updated successfully", comment });
  } catch (error) {
    console.error("Error editing comment:", error);
    res.status(500).json({ message: "Failed to edit comment" });
  }
};


//GET /comments/:id?sort=relevant, GET /comments/:id?sort=newest,GET /comments/:id?sort=liked

export const getComments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; 
    const { sort } = req.query;

    const query: any = { postId: id };
    const sortCriteria: any = {};

    switch (sort) {
      case "relevant":

        sortCriteria.commentCount = -1;
        break;
      case "newest":
  
        sortCriteria.createdAt = -1;
        break;
      case "liked":
  
        sortCriteria.reactionCount = -1;
        break;
      case "all":
      default:
      
        sortCriteria.createdAt = 1;
        break;
    }

    const comments = await Comment.find(query)
      .populate("userId", "firstName lastName avatar") 
      .populate("postId", "title") 
      .sort(sortCriteria);

    if (!comments.length) {
      return res.status(404).json({ message: "No comments found" });
    }

    res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Something went wrong", error });
  }
};
