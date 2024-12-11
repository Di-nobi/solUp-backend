import express, { Request, Response } from 'express';
import { decoded } from "../utils/decodeJwt";
import Message from '../models/SingleMessage';
// Single Messaging chat using websocket connection
// import crypto from 'crypto';
import User from "../models/UserData";
import ConnectionData from '../models/ConnectionData';
import { sendFCMNotification } from '../middlewares/fcm';
import { getRecipientId } from '../websocket/HandleSocket';
// import { io } from '../websocket/HandleSocket';
import { mediaUpload } from '../middlewares/MediaUpload';
import multer from 'multer';
import mongoose from 'mongoose';
import { emitUnreadMessageCount } from '../websocket/HandleSocket';

// function createdAt(utcTime: any, timezoneOffset: any) {
//   return new Date(utcTime.getTime() + timezoneOffset * 60000);
// }
export const sendMessage = async (req: Request, res: Response, io: any) => {
  try {
    const userId: string = decoded(req).userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { content, replyTo }: { content: string, replyTo: string } = req.body;
    const { id: recipientId } = req.params;
    // console.log("Message:", content);
    if (!content && !req.files){
      return res.status(400).json({ error: "Message or file is required" });
    }
    const senderId = userId;

    if (senderId === recipientId) {
      return res.status(400).json({ error: "Recipient cannot be the same as the sender" });
    }

    // const timezoneOffset = new Date().getTimezoneOffset(); 

    const verifyconnected = await ConnectionData.findOne({
      status: 'accepted',
      $or: [
        { sender: userId, receiver: recipientId },
        { sender: recipientId, receiver: userId }
      ]
    });
    // const sanitizeFileName = (filename: any) => {
    //   return filename.trim()
    //           .replace(/\s+/g, "_")
    //           .replace(/[^a-zA-Z0-9._-]/g, "")
    //           .slice(0, 100);
    //   };

    
    if (verifyconnected) {
        let chkId;
        if (replyTo) {
          chkId = await Message.findById(replyTo);
          if (!chkId) {
            return res.status(404).json({ error: "Original message not found" });
          }
        }
        const mediaFiles = req.files && !Array.isArray(req.files) && req.files['mediaFile']
        ? (req.files['mediaFile'] as Express.MulterS3.File[]).map((file) => file.location)
        : [];
        const mediaTypes = req.files && !Array.isArray(req.files) && req.files['mediaFile']
        ? (req.files['mediaFile'] as Express.MulterS3.File[]).map((file) => file.mimetype) 
        : [];
        // const mediaFiles = req.files as Express.Multer.File[];
        // const mediaUrls = mediaFiles.map(file => `${baseUrl}/uploads/media/${encodeURIComponent(file.filename)}`);
        // const mediaTypes = mediaFiles.map(file => file.mimetype);
        const newMessage = new Message({
          senderId,
          recipientId,
          content: content || null,
          mediaUrl: mediaFiles || null,
          mediaType: mediaTypes || null,
          replyTo: replyTo || null,
          createdAt: new Date()
        });
        if (newMessage) {
          await newMessage.save()
            
        }
        const sender = await User.findById(senderId).select('firstName lastName profilePicture').lean();
        const recipient = await User.findById(recipientId).select('firstName lastName profilePicture').lean();

        if (!sender || !recipient) {
          return res.status(404).json({ error: "User not found" });
        }
        const messageWithDetails = {
          ...newMessage.toObject({versionKey: false}),
          sender: {
            firstName: sender.firstName,
            lastName: sender.lastName,
            profilePicture: sender.profilePicture|| null,
          },
          recipient: {
            firstName: recipient.firstName,
            lastName: recipient.lastName,
            profilePicture: recipient.profilePicture || null,
          },
          replyTo: replyTo || null,
          createdAt: newMessage.createdAt.toISOString(),
        };
        const recipientSocketId = getRecipientId(recipientId);
        if (recipientSocketId){
          io.to(recipientSocketId).emit('newMessage', JSON.stringify({
            myConnection: {
              firstName: recipient.firstName || 'Unknown',
              lastName: recipient.lastName || 'Unknown',
              profilePicture: recipient.profilePicture || null,
            },
            messages: [messageWithDetails]
          }));
          const unreadCount = await Message.countDocuments({
            senderId,
            recipientId,
            read: false,
          }).exec();
          emitUnreadMessageCount(recipientId.toString(), unreadCount);
          io.to(recipientSocketId).emit('messageListUpdate', JSON.stringify({
            getUser: {
              _id: senderId,
              firstName: sender.firstName,
              lastName: sender.lastName,
              profilePicture: sender.profilePicture || null,
            },
            lastMessageText: messageWithDetails.content || (messageWithDetails.mediaUrl ? "media file" : ""),
            lastMessageTime: messageWithDetails.createdAt
          }));

          io.to(recipientSocketId).emit('Unreadmessages', JSON.stringify({
            getUser: {
              _id: senderId,
              firstName: sender.firstName,
              lastName: sender.lastName,
              profilePicture: sender.profilePicture || null,
            },
            lastMessageText: messageWithDetails.content || (messageWithDetails.mediaUrl ? "media file" : ""),
            lastMessageTime: messageWithDetails.createdAt
          }));
        }
        const receiver = await User.findById(recipientId);
        if (receiver && receiver.fcmToken) {
          // Send notification
          await sendFCMNotification(receiver.fcmToken, 'New Message', `${sender.firstName}: ${newMessage.content || (newMessage.mediaUrl ? "media file": "")}`);
        }
        return res.status(200).json({
          myConnection: {
            firstName: recipient.firstName || 'Unknown',
            lastName: recipient.lastName || 'Unknown',
            profilePicture: recipient.profilePicture || null,
          },
          messages: [messageWithDetails]
        });
      } else {
        return res.status(400).json({ error: "User not connected" });
      }
  } catch (error) {
    console.error("Error fetching messages: " + error);
    res.status(500).json({ error: "Unable to initiate messaging chat" });
  }

};


// Fetch messages in a conversation by the chat id
export const getMessages = async (req: Request, res: Response, io: any) => {
  try {
    // const page = req.query.page ? parseInt(req.query.page as string) : 1;
    // const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    // const skip = (page - 1) * limit;

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId: string = decoded(req).userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id: chatId } = req.params;
    const verifyconnected = await ConnectionData.find({
      status: 'accepted',
      $or: [
        { sender: userId, receiver: chatId },
        { sender: chatId, receiver: userId }
      ]
    });

    if (verifyconnected && verifyconnected.length > 0) {
        verifyconnected.map(conn => 
        conn.sender.toString() === userId ? conn.receiver : conn.sender
      );

      const convo = await Message.find({ $or: [
        { senderId: userId, recipientId: chatId },
        { senderId: chatId, recipientId: userId }
      ]
      }).select('senderId recipientId content mediaUrl mediaType createdAt replyTo edited' ).lean();
      if (!convo) {
        return res.status(200).json([]);
      }

      const me = await User.findById(userId).select('firstName lastName profilePicture').lean();
      const myConnection = await User.findById(chatId).select('firstName lastName profilePicture').lean();
      
      // Map messages to include sender and recipient names and profile pictures
      const getPrivateMessages = convo.map((message: any) => {
        const isSender = message.senderId?.toString() === userId;
        return {
          ...message,
          replyTo: message.replyTo || null,
          edited: message.edited ? true : false,
          mediaUrl: message.mediaUrl,
          mediaType: message.mediaType,
          read: message.read ? true : false,
          archive: message.archive ? true : false,
          updatedAt: message.updatedAt,
          sender: isSender
            ? {
                firstName: me?.firstName || 'Unknown',
                lastName: me?.lastName || 'Unknown',
                profilePicture: me?.profilePicture || null,
              }
            : {
                firstName: myConnection?.firstName || 'Unknown',
                lastName: myConnection?.lastName || 'Unknown',
                profilePicture: myConnection?.profilePicture || null,
              },
          recipient: !isSender
            ? {
                firstName: me?.firstName || 'Unknown',
                lastName: me?.lastName || 'Unknown',
                profilePicture: me?.profilePicture || null,
              }
            : {
                firstName: myConnection?.firstName || 'Unknown',
                lastName: myConnection?.lastName || 'Unknown',
                profilePicture: myConnection?.profilePicture || null,
              },
        };
      });
      if (getPrivateMessages) {
        const recipientSocketId = getRecipientId(chatId);
      if (recipientSocketId){
        io.to(recipientSocketId).emit('newMessage', JSON.stringify({
          myConnection: {
            firstName: myConnection?.firstName || 'Unknown',
            lastName: myConnection?.lastName || 'Unknown',
            profilePicture: myConnection?.profilePicture || null,
          },
          messages: getPrivateMessages
        }));
      }
      return res.status(200).json({
        myConnection: {
          firstName: myConnection?.firstName || 'Unknown',
          lastName: myConnection?.lastName || 'Unknown',
          profilePicture: myConnection?.profilePicture || null,
        },
        messages: getPrivateMessages,
        // currentPage: page,
        // totalPages: Math.ceil(totalMessages / limit),
      });
      } else {
        return res.status(200).json({message: "You Havent started any conversation with this user"});
      }
    } else {
      return res.status(404).json({message: "You are not connected with this user"});
    }
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Unable to fetch messages" });
  }
};

export const getDisplay = async (req: Request, res: Response, io: any) => {
  try {
    const baseUrl = process.env.BASE_URL;
    const uploadDir: any = process.env.UPLOAD_DIR;
    const signedIn = decoded(req).userId;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const skip = (page - 1) * limit;

    if (!signedIn) {
      return res.status(404).json({ message: 'Invalid access'});
    }
    const verifyconnected = await ConnectionData.find({
      $and: [
        { status: 'accepted' },
        { $or: [{ sender: signedIn }, { receiver: signedIn }] }
      ]
    });

    if (verifyconnected && verifyconnected.length > 0) {
      const getId = verifyconnected.map(conn => 
        conn.sender.toString() === signedIn ? conn.receiver : conn.sender
      );

      // Paginate connected users
      const totalUsers = getId.length;
      // const paginatedUsers = getId.slice(skip, skip + limit);

      const userMessages = await Promise.all(
        getId.map(async (id) => {
          const user = await User.findById(id).select("profilePicture firstName lastName").exec();

          const getUser = {
            _id: user?.id,
            firstName: user?.firstName,
            lastName: user?.lastName,
            profilePicture: user?.profilePicture || null,
          }
          console.log("Signed-in User:", signedIn);
          console.log("Connected User ID:", id);
          // Fetch the most recent unread message
          const recentMessage = await Message.findOne({
            $or: [
              { senderId: id, recipientId: signedIn },
              { senderId: signedIn, recipientId: id }
            ],
            archive: false
          }).sort({ createdAt: -1 }).select("content createdAt").exec();
          console.log("Recent Message:", recentMessage);
          if (!recentMessage) return null;
          // Fetch the count of unread messages from the sender
          const unreadCount = await Message.countDocuments({
            senderId: id,
            recipientId: signedIn,
            read: false,
          }).exec();
          const lastMessageText = recentMessage
          ? recentMessage.content || (recentMessage.mediaUrl ? recentMessage.mediaUrl : 'media file') : '';

          const lastMessageTime = recentMessage ? recentMessage.createdAt : null;
          emitUnreadMessageCount(signedIn.toString(), unreadCount);

          return { getUser, lastMessageText, unreadCount, lastMessageTime };
        })
      );
      const sortedUserMessages = userMessages
        .filter((message): message is NonNullable<typeof message> => message !== null)
        .sort((a, b) => {
          const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
          const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
          return timeB - timeA;
        });


        if (sortedUserMessages.length > 0) {
          // Emit sorted user messages via WebSocket
          const socketId = getRecipientId(signedIn);
          if (socketId) {
            io.to(socketId).emit('messageListUpdate', JSON.stringify(sortedUserMessages));
          }
          return res.status(200).json({
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            sortedUserMessages
          });
        } else{
          return res.status(200).json({ message: "No users with messages to display" });
        }
    } else {
      return res.status(400).json({ message: "Users arent connected" });
    }
  } catch (err) {
    console.error("Error fetching users:", err);
    return res.status(500).json({ error: "Unable to fetch users", err });
  }
};

export const UnRead = async (req: Request, res: Response, io: any) => {
  try {
    const baseUrl = process.env.BASE_URL;
    const uploadDir: any = process.env.UPLOAD_DIR;
    const signedIn = decoded(req).userId;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const skip = (page - 1) * limit;

    // Fetch connections where the user is either the sender or receiver and the connection is accepted
    const verifyconnected = await ConnectionData.find({
      $and: [{ status: 'accepted' }, { $or: [{ sender: signedIn }, { receiver: signedIn }] }]
    });

    if (verifyconnected && verifyconnected.length > 0) {
      // Map to get the IDs of the users connected to the signed-in user
      const getId = verifyconnected.map(conn => conn.sender.toString() === signedIn ? conn.receiver : conn.sender);

      // Paginate connected users
      const totalUsers = getId.length;
      // const paginatedUsers = getId.slice(skip, skip + limit);
      // Fetch user information along with their unread messages
      const userMessages = await Promise.all(
        getId.map(async (id) => {
          const user = await User.findById(id).select("profilePicture firstName lastName").exec();

          const getUser = {
            firstName: user?.firstName,
            lastName: user?.lastName,
            profilePicture: user?.profilePicture || null,
          }
          // Fetch the most recent unread message
          const recentMessage = await Message.findOne({
            $or: [
              { senderId: id, recipientId: signedIn },
              { senderId: signedIn, recipientId: id }
            ],
            read: false,
            archive: false
          }).sort({ createdAt: -1 }).select("content createdAt").exec();
          // Fetch the count of unread messages from the sender
          const unreadCount = await Message.countDocuments({
            senderId: id,
            recipientId: signedIn,
            read: false
          }).exec();
          const lastMessageText = recentMessage && Array.isArray(recentMessage.content) ?
          recentMessage.content[0] : recentMessage?.content || '';
          const lastMessageTime = recentMessage ? recentMessage.createdAt : null;

          return { getUser, lastMessageText, unreadCount, lastMessageTime };
        })
      );
      const filterOutUnread = userMessages.filter(msg => msg.unreadCount > 0);
      if (filterOutUnread.length > 0) {
        const socketId = getRecipientId(signedIn);
          if (socketId) {
            io.to(socketId).emit('Unreadmessages', JSON.stringify(filterOutUnread));
          }
  
          return res.status(200).json({
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            filterOutUnread
          });
      } else {
        return res.status(200).json({message: "No unread messages"}); // No unread messages
      }
    } else {
      return res.status(200).json({message: "Users are not connected"}); // No connected users
    }
  } catch (e) {
    console.error("Error fetching unread messages:", e);
    return res.status(500).json({ error: "Unable to fetch unread messages" });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const signedIn = decoded(req).userId;
    // Fetch connections where the user is either the sender or receiver and the connection is accepted
    const verifyconnected = await ConnectionData.find({
      $and: [{ status: 'accepted' }, { $or: [{ sender: signedIn }, { receiver: signedIn }] }]
    });

    if (verifyconnected && verifyconnected.length > 0) {
      // Map to get the IDs of the users connected to the signed-in user
      const getId = verifyconnected.map(conn => conn.sender.toString() === signedIn ? conn.receiver : conn.sender);

      // Fetch user information along with their unread messages
      const userMessages = await Promise.all(getId.map(async (id) => {
        const user = await User.findById(id).select("profilePicture firstName lastName").exec();
        const unreadMessages = await Message.find({
          senderId: id,
          recipientId: signedIn,
          read: false
        }).select("content createdAt").exec(); // Assuming 'content', 'createdAt' are message fields

        return {
          user,
          unreadMessages
        };
      }));

      // Flatten the unread messages for processing
      const allUnreadMessages = userMessages.flatMap(item => item.unreadMessages);

      if (allUnreadMessages.length > 0) {
        // Update all unread messages to marked as read
        await Message.updateMany(
          { _id: { $in: allUnreadMessages.map(msg => msg._id) } },
          { read: true }
        );

        return res.status(200).json({ message: "Messages marked as read" });
      } else {
        return res.status(200).json({ error: "No unread messages to mark as read" });
      }
    } else {
      return res.status(400).json({ error: "No connections found" });
    }
  } catch (e) {
    console.error("Error marking messages as read:", e);
    return res.status(500).json({ error: "Unable to mark messages as read" });
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { name } = req.query;
    console.log(name)
    if (!name) {
      return res.status(400).json({ error: "Search query is required" });
    }
    const signedInUser = decoded(req).userId;

    const findConnections = await ConnectionData.find({
      $or: [
        { sender: signedInUser },
        { receiver: signedInUser },
      ],
      status: 'accepted'
    });
    const connections = findConnections.map(conn => conn.sender.toString() === signedInUser? conn.receiver : conn.sender);
    const users = await User.find({
      $or: [
        { firstName: { $regex: name, $options: 'i' } },
        { lastName: { $regex: name, $options: 'i' } },
        { email: { $regex: name, $options: 'i' } },
      ],
      _id: { $in: connections } // Only include users who are connected
    })
     .select("firstName lastName profilePicture")
     .exec();
    if (!users || users.length === 0) {
      return res.status(404).json({ error: "Connection not found" });
    }
    return res.status(200).json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    return res.status(500).json({ error: "Unable to search users" });
  }
};

export const deleteMessage = async (req: Request, res: Response, io: any) => {
  try {
    const { messageId } = req.params;
    const signedIn = decoded(req).userId;

    if (!messageId) {
      return res.status(400).json({ error: "Invalid message ID" });
    }

    const message = await Message.findById(messageId).exec();

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Ensure the signed-in user is the sender of the message
    if (message.senderId.toString() !== signedIn) {
      return res.status(403).json({ error: "Unauthorized to delete this message" });
    }
    const recipientId = message.recipientId.toString();
    await Message.deleteOne({ _id: messageId }).exec();

    const senderSocketId = getRecipientId(signedIn);
    const recipientSocketId = getRecipientId(recipientId);
    
    const messageDeletionPayload = {
      messageId: messageId,
      senderId: signedIn,
      recipientId: recipientId,
      deletedAt: new Date().toISOString(),
    };

    // Notify the sender via WebSocket
    if (senderSocketId) {
      io.to(senderSocketId).emit('messageDeleted', JSON.stringify(messageDeletionPayload));
    }

    // Notify the recipient via WebSocket
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('messageDeleted', JSON.stringify(messageDeletionPayload));
    }
    return res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    return res.status(400).json({ error: "Error deleting message" });
  }
};

export const archiveMessages = async (req: Request, res: Response) => {
  try {
    const baseUrl = process.env.BASE_URL;
    const uploadDir = process.env.UPLOAD_DIR;
    const { recipientId } = req.params;
    const signedIn = decoded(req).userId;
    if (!signedIn) {
      return res.status(401).json({ error: "Unauthorized to archive messages" });
    }
    if (!recipientId) {
      return res.status(400).json({ error: "Invalid recipient ID" });
    }
    

    // Verify that the users are connected
    const verifyconnected = await ConnectionData.find({
      $and: [
        { status: 'accepted' },
        {
          $or: [
            { sender: signedIn, receiver: recipientId },
            { sender: recipientId, receiver: signedIn },
          ]
        }
      ]
    });
    if (!verifyconnected || verifyconnected.length === 0) {
      return res.status(400).json({ error: "Users are not connected" });
    }

    // Find all messages exchanged between the signed-in user and the recipient
    const messages = await Message.find({
      $or: [
        { senderId: signedIn, recipientId },
        { senderId: recipientId, recipientId: signedIn }
      ]
    }).exec();

    if (!messages || messages.length === 0) {
      return res.status(404).json({ error: "No messages found between the users" });
    }

    // Archive all found messages
    await Message.updateMany(
      { _id: { $in: messages.map(msg => msg._id) } },
      { $set: { archive: true } }
    );

    return res.status(200).json({ message: "Message archived successfully"});
  } catch (error) {
    console.error("Error archiving message:", error);
    return res.status(500).json({ error: 'An error occurred: ' + error });
  }
};


export const getArchivedMessages = async (req: Request, res: Response) => {
  try {
    const baseUrl = process.env.BASE_URL;
    const uploadDir: any = process.env.UPLOAD_DIR;
    const signedIn = decoded(req).userId;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const skip = (page - 1) * limit;

    // Validate that signedIn is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(signedIn)) {
      console.error(`Invalid signed-in user ID: ${signedIn}`);
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Verify that the users are connected
    const verifyconnected = await ConnectionData.find({
      $and: [
        { status: 'accepted' },
        { $or: [{ sender: signedIn }, { receiver: signedIn }] }
      ]
    }).skip(skip).limit(limit);

    if (verifyconnected && verifyconnected.length > 0) {
      const getId = verifyconnected.map(conn => 
        conn.sender.toString() === signedIn ? conn.receiver : conn.sender
      );

      // Paginate connected users
      const totalUsers = getId.length;
      // const paginatedUsers = getId.slice(skip, skip + limit);

      const userMessages = await Promise.all(
        getId.map(async (id) => {
          const user = await User.findById(id).select("profilePicture firstName lastName").exec();

          const getUser = {
            _id: user?.id,
            firstName: user?.firstName,
            lastName: user?.lastName,
            profilePicture: user?.profilePicture ||  null,
          }
          // Fetch the most recent unread message
          const recentMessage = await Message.findOne({
            $or: [
              { senderId: id, recipientId: signedIn },
              { senderId: signedIn, recipientId: id }
            ],
            archive: true
          }).sort({ createdAt: -1 }).skip(skip).limit(limit).select("content createdAt").exec();

          if (!recentMessage) {
            return null;  // No archived messages found for this user
          }
          // Fetch the count of unread messages from the sender
          const unreadCount = await Message.countDocuments({
            senderId: id,
            recipientId: signedIn,
            read: false,
          }).exec();
          const lastMessageText = recentMessage && Array.isArray(recentMessage.content) ?
          recentMessage.content[0] : recentMessage?.content || '';
          const lastMessageTime = recentMessage ? recentMessage.createdAt : null;

          return { getUser, lastMessageText, unreadCount, lastMessageTime };
        })
      );
      const sortedUserMessages = userMessages
        .filter((message) => message !== null)
        .sort((a, b) => {
          if (!a?.lastMessageTime || !b?.lastMessageTime) return 0;
          return new Date(b.lastMessageTime!).getTime() - new Date(a.lastMessageTime!).getTime();
        });

      if (sortedUserMessages.length > 0) {
        return res.status(200).json({
          currentPage: page,
          totalPages: Math.ceil(totalUsers / limit),
          sortedUserMessages
        });
      } else {
        return res.status(200).json({ message: "No users with messages to display" });
      }
      
    } else {
      return res.status(400).json({ error: "Users arent connected" });
    }
  } catch (error) {
    console.error("Error archiving message:", error);
    return res.status(500).json({ error: 'An error occurred: ' + error });
  }
};

export const unarchiveMessages = async (req: Request, res: Response) => {
  try {
    const baseUrl = process.env.BASE_URL;
    const uploadDir = process.env.UPLOAD_DIR;
    const { recipientId } = req.params;
    const signedIn = decoded(req).userId;
    if (!signedIn) {
      return res.status(401).json({ error: "Unauthorized to unarchive messages" });
    }
    if (!recipientId) {
      return res.status(400).json({ error: "Invalid recipient ID" });
    }
    

    // Verify that the users are connected
    const verifyconnected = await ConnectionData.find({
      $and: [
        { status: 'accepted' },
        {
          $or: [
            { sender: signedIn, receiver: recipientId },
            { sender: recipientId, receiver: signedIn },
          ]
        }
      ]
    });
    if (!verifyconnected || verifyconnected.length === 0) {
      return res.status(400).json({ error: "Users are not connected" });
    }

    // Find all messages exchanged between the signed-in user and the recipient
    const messages = await Message.find({
      $or: [
        { senderId: signedIn, recipientId },
        { senderId: recipientId, recipientId: signedIn }
      ]
    }).exec();

    if (!messages || messages.length === 0) {
      return res.status(404).json({ error: "No messages found between the users" });
    }

    // Archive all found messages
    await Message.updateMany(
      { _id: { $in: messages.map(msg => msg._id) } },
      { $set: { archive: false } }
    );

    return res.status(200).json({ message: "Message unarchived successfully"});
  } catch (error) {
    console.error("Error unarchiving message:", error);
    return res.status(500).json({ error: 'An error occurred: ' + error });
  }
};

export const unreadmessagesCount = async (req: Request, res: Response) => {
  try {
    const userId = decoded(req).userId;
    const { id } = req.params;
    if (!userId) {
      return res.status(409).json({message: 'Invalid access'})
    }
    if (!id) {
      return res.status(400).json({message: 'Recipient id  is required'})
    }

    // Gets the count of unread messages from the sender
    const unreadCount = await Message.countDocuments({
      senderId: id,
      recipientId: userId,
      read: false
    }).exec();
    return res.status(200).json({message: unreadCount})
  } catch (error) {
    return res.status(500).json({ error: error });
  }
}

// export const replyMessage = async (req: Request, res: Response) => {
//   try {
//     const userId = decoded(req).userId;
//     const { msgId } = req.params;
//     if (!userId) {
//       return res.status(400).json({message: 'Unauthorized access'});
//     }
//     if (!msgId) {
//       return res.status(400).json({message: 'message id is required'})
//     }
//     const msg = await Message.findById(msgId);
//     if (!msg) {
//       return res.status(400).json({message: 'Message not found'})
//     }
//     msg.replyTo.push(msgId);
//     await msg.save();
//     return res.status(201).json({message:'You just replied this message'});
//   } catch (err) {
//     return res.status(500).json({message:'An error occured at ', err});
//   }
// }

export const editMessage = async (req: Request, res: Response) => {
  try {
    const userId = decoded(req).userId;
    const { msgId } = req.params;
    const { message } = req.body;
    if (!userId) {
      return res.status(401).json({message: 'Unauthorized access'});
    }
    if (!msgId) {
      return res.status(400).json({message: 'message id is required'})
    }
    if (!message) {
      return res.status(400).json({message: 'A message is required during edit'});
    }
    const msg = await Message.findById(msgId);
    if (!msg) {
      return res.status(404).json({message: 'Message not found'})
    }
    if (msg.senderId.toString() !== userId.toString()) {
      return res.status(403).json({message: 'You are unauthorized to edit this message'});
    }
    msg.content = message;
    msg.edited = true;
    await msg.save();
    return res.status(201).json({message: 'You just edited this message'})
  } catch (err) {
    return res.status(500).json({message: 'An error occured while editing this message', err});
  }
}