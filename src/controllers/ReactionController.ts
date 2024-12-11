
import { Request, Response } from "express";
import { decoded } from "../utils/decodeJwt";
import Reaction from "../models/ReactionData";
import Post from "../models/PepPostData";
import { sendFCMNotification } from "../middlewares/fcm";
import NotificationData from "../models/NotificationData";
import User, { IUser } from "../models/UserData";
import Comment from "../models/CommentData";


export const toggleReaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    const currentUser = decoded(req);

    if (!currentUser) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const user = await User.findById(currentUser.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const post = await Post.findById(id);
    const comment = post ? null : await Comment.findById(id);

    if (!post && !comment) {
      return res.status(404).json({ message: "Post or Comment not found" });
    }

    const target = post || comment; 
    if (!target) {
        return res.status(500).json({ message: "An unexpected error occurred" });
      }

    const existingReaction = await Reaction.findOne({
      postId: post ? id : undefined,
      commentId: comment ? id : undefined,
      userId: currentUser.userId,
    });

    if (existingReaction) {
      if (existingReaction.type === type) {
        await existingReaction.deleteOne();
        target.reactionCount = Math.max(0, target.reactionCount - 1);
      } else {
        existingReaction.type = type;
        await existingReaction.save();
      }
    } else {
      const newReaction = new Reaction({
        userId: currentUser.userId,
        postId: post ? id : undefined,
        commentId: comment ? id : undefined,
        type,
      });
      await newReaction.save();
      target.reactionCount += 1;
      
    }

    await target.save();

    const notification = new NotificationData({
      senderId: user._id,
      recipientId: post ? post.author : comment?.userId,
      type: 'reaction',
      message: `${user.firstName} ${user.lastName} ${type} your ${post ? "post" : "comment"}`,
      postId: post ? post._id : undefined,
      commentId: comment ? comment._id : undefined,
      isRead: false,
    });
    await notification.save();

    const recipient = await User.findById(post ? post.author : comment?.userId);
    if (recipient && recipient.fcmToken) {
      await sendFCMNotification(
        recipient.fcmToken,
        'Pepoz',
        `${user.firstName} just ${type} your ${post ? "post" : "comment"}`
      );
    }

    res.status(200).json({ message: "Reaction toggled successfully", target });
  } catch (error) {
    console.error("Error toggling reaction:", error);
    res.status(500).json({ message: "An error occurred", error });
  }
};

  
  
export const getReactionsByPost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const reactions = await Reaction.find({ post: postId })
      .populate({
        path: 'userId',
        select: 'firstName lastName profilePicture', 
      })
      .lean();

    const reactionsWithUsers = reactions.map((reaction) => ({
      user: {
        firstName: (reaction.userId as IUser).firstName,
        lastName: (reaction.userId as IUser).lastName,
        profilePicture: (reaction.userId as IUser).profilePicture,
      },
      type: reaction.type,
    }));

    res.status(200).json(reactionsWithUsers);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
};