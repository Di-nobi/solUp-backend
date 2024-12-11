import express, { Request, Response } from 'express';
import { decoded } from "../utils/decodeJwt";
import { v4 as uuidv4 } from 'uuid';
import Group, { GroupSetting } from "../models/Group";
import User from '../models/UserData';
import grpMessage from '../models/GroupMessages';
import { emitUnreadMessageCount } from '../websocket/HandleSocket';
import { sendFCMNotification } from '../middlewares/fcm';
import { getRecipientId } from '../websocket/HandleSocket';

// function createdAt(utcTime: any, timezoneOffset: any) {
//       return new Date(utcTime.getTime() + timezoneOffset * 60000);
// }

export const sendGroupMessage = async (req: Request, res: Response, io: any) => {
    try {

        const baseUrl = process.env.BASE_URL;
        const uploadDir: any = process.env.UPLOAD_DIR;

        // const utcTime = new Date();
        // const timezoneOffset = new Date().getTimezoneOffset(); 
        // GroupMediaUpload(req, res, async (err: any) => {
        //     if (err instanceof multer.MulterError) {
        //       console.error("Multer Error:", err);
        //       return res.status(400).json({ error: err.message });
        //     } else if (err) {
        //       console.error("File Upload Error:", err);
        //       return res.status(500).json({ error: "File upload failed" });
        //     }
            const userId = decoded(req).userId;
            if (!userId) {
                return res.status(400).json({message: 'Invalid user'});
            }
            const { groupId } = req.params;
            const {  content, replyTo } = req.body;
            console.log(groupId);
            const findGrp = await Group.findOne({_id: groupId});
            console.log(findGrp);
            if (!findGrp) {
                return res.status(400).json({message: "Group does not exist"});
            }

            const isMember = findGrp.members.includes(userId);
            if (!isMember) {
                return res.status(403).json({ message: "User is not a member of the group" });
            } else {
            // const sanitizeFileName = (filename: any) => {
            //     return filename.trim()
            //             .replace(/\s+/g, "_")
            //             .replace(/[^a-zA-Z0-9._-]/g, "")
            //             .slice(0, 100);
            //     };

            // const sanitized_name = req.file ? sanitizeFileName(req.file.filename) : null;
            let chkId;
            if (replyTo) {
              chkId = await grpMessage.findById(replyTo);
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
            // const mediaUrls = mediaFiles.map(file => `/uploads/groupMedia/${encodeURIComponent(file.filename)}`);
            // const mediaTypes = mediaFiles.map(file => file.mimetype);
            const newMessage = new grpMessage({
                userId,
                groupId,
                content,
                mediaUrl: mediaFiles,
                mediaType: mediaTypes,
                replyTo: replyTo || null,
                createdAt: new Date().toISOString(),
            });
            if (newMessage) {
                await newMessage.save();
                findGrp.messages.push(String(newMessage._id));
                await findGrp.save();
            }
            const sender = await User.findById(userId).select('firstName lastName profilePicture').lean();
            if (!sender) {
            return res.status(404).json({ error: "User not found" });
            }
            
            const messageWithSender = {
            _id: newMessage._id,
            content: newMessage.content,
            mediaUrl: newMessage.mediaUrl || null,
            mediaType: newMessage.mediaType,
            userId: newMessage.userId,
            groupId: newMessage.groupId,
            createdAt: newMessage.createdAt,
            replyTo: newMessage.replyTo || null,
            edited: newMessage.edited ? true : false,
            firstName: sender ? sender.firstName : null,
            lastName: sender? sender.lastName : null,
            profilePicture: sender.profilePicture || null,
            groupName: findGrp.name,
            groupPhoto: findGrp.profilePhoto || null,
            };
            io.to(groupId).emit('newGroupMessage', JSON.stringify({
                groupName: findGrp.name,
                groupPhoto: findGrp.profilePhoto || null,
            createdBy: findGrp.createdBy,
            messages: [messageWithSender]
            }));
        

            const groupUpdateData = {
                groupId: findGrp._id,
                name: findGrp.name,
                profilePhoto: findGrp.profilePhoto || null,
                lastMessage: `${sender.firstName}: ${newMessage.content || 'media file'}`,
                lastMessageTime: newMessage.createdAt,
            };

            const socketId = getRecipientId(userId);
            if (socketId) {
                io.to(socketId).emit('groupListUpdate', JSON.stringify(groupUpdateData));
            }
            

            const unreadCount = await grpMessage.countDocuments({
                groupId,
                readBy: { $ne: userId },
            });
            emitUnreadMessageCount(userId.toString(), unreadCount);
            // const recipient = await User.findById(userId);
            // if (recipient && recipient.fcmToken) {
            //   // Send notification
            //   await sendFCMNotification(recipient.fcmToken, findGrp.name, newMessage.content || (newMessage.mediaUrl ? "media file": ""));
            // }
            for (const memberId of findGrp.members) {
                if (memberId.toString() !== userId.toString()) {
                    const recipient = await User.findById(memberId);
                    if (recipient && recipient.fcmToken) {
                        await sendFCMNotification(recipient.fcmToken, 'New group message',`${sender.firstName}:${newMessage.content || (newMessage.mediaUrl ? "media file" : "")}`);
                    }
                }
            }

            return res.status(200).json({
                groupName: findGrp.name,
                groupPhoto: findGrp.profilePhoto || null,
            createdBy: findGrp.createdBy,
                messages: [messageWithSender]
            });
    }
// });
    } catch (error) {
        return res.status(500).json({error: "An error occured sending group message " + error});
    }
}


export const getGroupMessage = async (req: Request, res: Response) => {
    try{
        const userId = decoded(req).userId;

        // const page = req.query.page ? parseInt(req.query.page as string) : 1;
        // const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        // const skip = (page - 1) * limit;
        if (!userId) {
            return res.status(400).json({message: "Invalid user"});
        }

        const { groupId } = req.params;
        if (!groupId) {
            return res.status(400).json({message: "Invalid group"});
        }

        // const totalMessages = await grpMessage.countDocuments({ groupId }).exec();
        const getGrp = await Group.findOne({ _id: groupId})
        .populate({
            path: 'messages',
            model: 'grpMessage',
            select: 'content mediaUrl mediaType createdAt replyTo edited',
            // options: { skip, limit, sort: { createdAt: -1 } },
            populate: {
                path: 'userId',
                model: 'UserData',
                select: 'firstName lastName profilePicture'
            }
        }).lean();
        if (!getGrp) {
            return res.status(404).json({error: "Group not found"});
        }
        const messages = getGrp.messages.map((msg: any) => ({
            _id: msg._id,
            content: msg.content,
            mediaUrl: msg.mediaUrl || null,
            mediaType: msg.mediaType,
            userId: msg.userId._id,
            replyTo: msg.replyTo || null,
            edited: msg.edited ? true : false,
            groupId: groupId,  
            firstName: `${msg.userId.firstName}`,
            lastName: `${msg.userId.lastName}`,
            createdAt: msg.createdAt,
            profilePhoto: msg.userId.profilePicture || null,
        }));

        const allData = {
            groupName: getGrp.name,
            groupPhoto: getGrp.profilePhoto || null,
            groupMemberCount: getGrp.members.length,
            createdBy: getGrp.createdBy,
            messages: messages,
        };
        
        return res.status(200).json({
            // currentPage: page,
            // totalPages: Math.ceil(totalMessages / limit),
            allData
        });
    } catch (error) {
        return res.status(500).json({error: "An error occured getting group messages " + error});
    }
}

export const deleteUserMessage = async (req: Request, res: Response, io: any) => {
    try {
        const userId = decoded(req).userId;
        if (!userId) {
            return res.status(400).json({ message: "Invalid user" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const { messageId, groupId } = req.params;
        if (!messageId || !groupId) {
            return res.status(400).json({ message: "Invalid request" });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (!group.members.includes(userId)) {
            return res.status(403).json({ message: "Unauthorized to delete message" });
        }

        const message = await grpMessage.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        if (message.userId.toString() !== userId) {
            return res.status(403).json({ message: "You are not authorized to delete this message" });
        }

        await Group.findByIdAndUpdate(groupId, { $pull: { messages: messageId } });     
        await grpMessage.findByIdAndDelete(messageId);

        group.members.forEach((memberId) => {
            const memberSocketId = getRecipientId(memberId); // Get the socket ID of each member
      
            if (memberSocketId) {
              io.to(memberSocketId).emit('groupUserDeletedMessage', {
                groupId: groupId,
                messageId: messageId,
                message: `Message deleted by ${user}`,
              });
            }
          });

        return res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
        return res.status(500).json({ error: "An error occurred deleting message " + error });
    }
}
export const deleteMessageByAdmin = async (req: Request, res: Response, io: any) => {
    try {
        const userId = decoded(req).userId;
        if (!userId) {
            return res.status(400).json({ message: "Invalid user" });
        }

        const { messageId, groupId } = req.params;
        if (!messageId || !groupId) {
            return res.status(400).json({ message: "Invalid request" });
        }

        const group = await Group.findById(groupId);
        if (!group) {
        return res.status(404).json({ message: "Group not found" });
        }

        if (group.createdBy.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized to delete message" });
        }

        await Group.findByIdAndUpdate(groupId, { $pull: { messages: messageId } });

        const message = await grpMessage.findByIdAndDelete(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        group.members.forEach((memberId) => {
            const memberSocketId = getRecipientId(memberId); // Get the socket ID of each member
      
            if (memberSocketId) {
              io.to(memberSocketId).emit('messageDeleted', {
                groupId: groupId,
                messageId: messageId,
                adminId: userId,
                message: "Message deleted by the admin.",
              });
            }
          });
        return res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
        return res.status(500).json({ error: "An error occured deleting message " + error });
    }
}

// export const replyGroupMessage = async (req: Request, res: Response) => {
//     try {
//       const userId = decoded(req).userId;
//       const { msgId, groupId } = req.params;
//       if (!userId) {
//         return res.status(400).json({message: 'Unauthorized access'});
//       }
//       if (!msgId || !groupId) {
//         return res.status(400).json({message: 'message and group ids are required'})
//       }
//       const grp = await Group.findById(groupId);
//       if (!grp) {
//         return res.status(404).json({message: 'Group not found'});
//       }
//       const msg = await grpMessage.findById(msgId);
//       if (!msg) {
//         return res.status(400).json({message: 'Message not found'})
//       }
//       msg.replyTo.push(msgId);
//       await msg.save();
//       return res.status(201).json({message:'You just replied this message'});
//     } catch (err) {
//       return res.status(500).json({message:'An error occured at ', err});
//     }
//   }
  
  export const editGroupMessage = async (req: Request, res: Response) => {
    try {
      const userId = decoded(req).userId;
      const { msgId, groupId } = req.params;
      const { message } = req.body;
      if (!userId) {
        return res.status(401).json({message: 'Unauthorized access'});
      }
      if (!msgId || !groupId) {
        return res.status(400).json({message: 'message and group ids are required'})
      }
      if (!message) {
        return res.status(400).json({message: 'A message is required during edit'});
      }
      const grp = await Group.findById(groupId);
      if (!grp) {
        return res.status(404).json({message: 'Group not found'});
      }
      const msg = await grpMessage.findById(msgId);
      if (!msg) {
        return res.status(404).json({message: 'Message not found'})
      }
      if (msg.userId.toString() !== userId.toString()) {
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