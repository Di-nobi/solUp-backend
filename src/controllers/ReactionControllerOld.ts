// import { Request, Response } from "express";
// import { decoded } from "../utils/decodeJwt";
// import Reaction from "../models/ReactionData";
// import Post from "../models/PepPostData";
// import Repost from "../models/RepostData";
// import { sendFCMNotification } from "../middlewares/fcm";
// import NotificationData from "../models/NotificationData";
// import User from "../models/UserData";
// import mongoose from "mongoose";
// const { ObjectId } = require('mongodb');
// import { io } from '../websocket/HandleSocket';
// import { emitNotification } from "../websocket/HandleSocket";

// export const addReaction = async (req: Request, res: Response) => {
//     try {
//       const { postId } = req.params;
//       const { type } = req.body;
//       const currentUser = decoded(req); 
  
//       if (!currentUser) {
//         return res.status(401).json({ message: 'User not authenticated' });
//       }
  
//       const post = await Post.findById(postId);
  
//       if (!post) {
//         return res.status(404).json({ message: 'Post not found' });
//       }
      
//       const user = await User.findById(currentUser.userId);
//       if (!user) {
//         return res.status(404).json({ message: 'User not found' });
//       }
  
//       // Remove any existing reaction from the user
//       // post.reactions = post.reactions.filter(
//       //   // (reaction) => !reaction.userId.equals(currentUser.userId)
//       // );
  
//       const reaction = new Reaction({ ...req.body, userId: currentUser.userId, type: type });
      
//       // Add the new reaction
//       post.reactions.push(reaction);
//       post.isLiked = true;
//       // post.isLikedCount += 1;
//       await post.save();
//       await reaction.save();

//       // Create a notification record for the recipient
//       const notification = new NotificationData({
//         senderId: user,
//         recipientId: post.author,
//         type: 'reaction',
//         message: `${user.firstName} ${user.lastName} ${type} your post`,
//         postId: post._id,
//         isRead: false,
//       });
//       await notification.save();
//       // Emit a notification event to the recipient
//       // emitNotification(post.author.toString(), { // Convert ObjectId to string
//       //   type: 'reaction',
//       //   message: `${user.firstName} ${user.lastName} ${type} your post`,
//       //   postId: post._id,
//       //   senderId: user,
//       // });
//       const recipient = await User.findById(post.author.toString());
//         if (recipient && recipient.fcmToken) {
//           // Send notification
//           await sendFCMNotification(recipient.fcmToken, 'Pepoz', `${user.firstName} just liked your post`);
//         }

//       res.status(200).json(post);
//     } catch (error) {
//       res.status(500).json({ message: 'Something went wrong', error });
//     }
//   };
  
  
//   export const deleteReaction = async (req: Request, res: Response) => {
//     try {
//       const { postId, reactionId } = req.params;
//       const userId = decoded(req);  // Assuming you have user info in req.user
  
//       // Find the post by ID
//       const post = await Post.findById(postId);

      
  
//       if (!post) {
//         return res.status(404).json({ message: 'Post not found' });
//       }

//       const idOfReaction = new ObjectId(reactionId);
     
      
//       // Find the reaction within the post
//       const reactionIndex = post.reactions.findIndex(reaction => reaction.id === reactionId);
      
//       console.log(reactionIndex);
//       if (reactionIndex === -1) {
//         return res.status(404).json({ message: 'Reaction not found' });
//       }

//       const reaction = post.reactions[reactionIndex];

//       console.log(reaction);
      
  
//       // Check if the reaction belongs to the logged-in user
//       if (reaction.userId.toString() !== userId.userId.toString()) {
//         return res.status(403).json({ message: 'Unauthorized action' });
//       }
      
//       // Remove the reaction
//       post.reactions.splice(reactionIndex, 1);
//       post.isLiked = false;
//       // post.isLikedCount -= 1;
//       // Save the post
//       await post.save();
  
//       res.status(200).json({ message: 'Reaction deleted successfully' });
//     } catch (error) {
//       res.status(500).json({ message: 'Something went wrong', error });
//     }
//   };
  