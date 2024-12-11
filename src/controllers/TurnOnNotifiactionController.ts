import { Request, Response } from "express";
import NotificationPreference from "../models/TurnOnNotificationData";
import { decoded } from "../utils/decodeJwt";
import Post from "../models/PepPostData";

export const turnOnUserNotification = async (req: Request, res: Response) => {
  try {
    const user = decoded(req);
    const { targetUserId } = req.body; 

    if (!user || !user.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!targetUserId) {
      return res.status(400).json({ message: "Target user ID is required" });
    }

 
    const existingPreference = await NotificationPreference.findOne({
      userId: user.userId,
      targetUserId,
    });

    if (existingPreference) {
      return res.status(400).json({ message: "Notifications are already turned on for this user" });
    }

  
    const preference = new NotificationPreference({
      userId: user.userId,
      targetUserId,
    });

    await preference.save();

    res.status(201).json({ message: "Notifications turned on successfully" });
  } catch (error) {
    console.error("Error turning on notifications:", error);
    res.status(500).json({ message: "An error occurred while turning on notifications" });
  }
};

export const turnOnPostNotification = async (req: Request, res: Response) => {
    try {
      const user = decoded(req);
      const { postId } = req.body;
  
      if (!user || !user.userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
  
      if (!postId) {
        return res.status(400).json({ message: "Post ID is required" });
      }
  
      const existingPreference = await NotificationPreference.findOne({
        userId: user.userId,
        postId,
      });
  
      if (existingPreference) {
        return res
          .status(400)
          .json({ message: "Notifications for this post are already enabled" });
      }
  
      const preference = new NotificationPreference({
        userId: user.userId,
        postId,
      });
  
      await preference.save();
  
      res.status(201).json({ message: "Post notifications turned on successfully" });
    } catch (error) {
      console.error("Error turning on post notifications:", error);
      res.status(500).json({ message: "An error occurred while enabling notifications" });
    }
  };


export const createPost = async (req: Request, res: Response) => {
  try {
    const user = decoded(req);
    const { content } = req.body;

    if (!user || !user.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Content is required" });
    }
    const post = new Post({
      userId: user.userId,
      content,
    });

    await post.save();
    const notificationPreferences = await NotificationPreference.find({
      targetUserId: user.userId,
    });

    const notifications = notificationPreferences.map((preference) => ({
      userId: preference.userId,
    //   content: `${user.firstName} ${user.lastName} posted: "${content}"`,
      postId: post._id,
    }));

    // await Notification.insertMany(notifications);

    res.status(201).json({ message: "Post created successfully", post });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "An error occurred while creating the post" });
  }
};
