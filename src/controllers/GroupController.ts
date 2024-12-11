import express, { Request, Response, NextFunction } from 'express';
import { decoded } from "../utils/decodeJwt";
import { v4 as uuidv4 } from 'uuid';
import Group, { GroupSetting } from "../models/Group";
import grpMessage  from "../models/GroupMessages";
import { io } from '../websocket/HandleSocket';
import { generateInviteLink } from '../middlewares/InviteLinkGenerator';
import mongoose, { Schema, Document } from "mongoose";
import NotificationData from '../models/NotificationData';
import Invite from '../models/InviteData';
import { emitNotification, emitUnreadMessageCount } from '../websocket/HandleSocket';
import { getRecipientId } from '../websocket/HandleSocket';
import User from '../models/UserData';
import ConnectionData from '../models/ConnectionData';
import { validateRequest } from '../utils/requestValidator';
import { UpdateGroupInfoDto } from '../dtos/group.dto';
import { GroupService } from '../services/group.service';

export const createGroup = async (req: Request, res: Response) => {
    try {
    const userId = decoded(req).userId;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized user" });
    }

    // const user = await User.findById(userId).select(' firstName lastName ');
    // if (!user) {
    //     return res.status(400).json({message: "User dosent exist"})
    // }

    const { name, description, settings } = req.body;
    if (!name ||!description ||!settings) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const profilePhoto = req.files && !Array.isArray(req.files) && req.files['profilePhoto']
    ? (req.files['profilePhoto'] as Express.MulterS3.File[])[0]?.location || ""
    : "";
    const bannerPhoto = req.files && !Array.isArray(req.files) && req.files['bannerPhoto']
    ? (req.files['bannerPhoto'] as Express.MulterS3.File[])[0]?.location || ""
    : "";

    // if (!profilePhoto || !bannerPhoto) {
    //     return res.status(400).json({ error: "Profile photo and banner photo are required" });
    // }
    console.log(profilePhoto, bannerPhoto);
    if (!Object.values(GroupSetting).includes(settings)) {
        return res.status(400).json({ error: "Invalid settings" });
    }
    const groupId = new mongoose.Types.ObjectId();
    const inviteLink = generateInviteLink(groupId.toString());
    const group = new Group({
        _id: groupId,
        name,
        description,
        profilePhoto,
        bannerPhoto,
        settings,
        createdBy: userId,
        inviteLink: inviteLink,
        numberofMembers: 1,
        members: [userId],
    });
    console.log(group);
    await group.save()
    return res.status(201).json({message: 'Group created successfully'});
    } catch (error) {
        return res.status(500).json({ error: `Error occurred at ${error}` });
    }

}

export const getGroups = async (req: Request, res: Response) => {
    try {
        const baseUrl = process.env.BASE_URL;
        const uploadDir: any = process.env.UPLOAD_DIR;
        const userId = decoded(req).userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        const skip = (page - 1) * limit;
        
        const myquery = { $or: [
            { createdBy: userId },
            { members: userId }
        ]}

        const groups = await Group.find(myquery).sort({ createdAt: -1 }).skip(skip).limit(limit).select(' name profilePhoto ');
        // .populate({
        //     path: 'createdBy',
        //     model: 'UserData',
        //     select: 'firstName',
            
        // });
        if (!groups) {
            return res.status(403).json({ error: "Invalid Group" });
        }
        const groupsWithLastMessages = await Promise.all(groups.map(async (group) => {
            const lastMessage = await grpMessage.findOne({ groupId: group._id })
              .sort({ createdAt: -1 })
              .populate({
                path: 'userId',
                model: 'UserData',
                select: 'firstName'
              });
              const senderFirstName = lastMessage?.userId && typeof lastMessage.userId !== 'string'
              ? (lastMessage.userId as any).firstName : '';

            const unreadCount = await grpMessage.countDocuments({
                groupId: group._id,
                readBy: { $ne: userId },
            });
            emitUnreadMessageCount(userId.toString(), unreadCount);
              return {
                groupId: group._id,
                name: group.name || null,
                profilePhoto: group.profilePhoto  || null,
                
                lastMessage: lastMessage ? `${senderFirstName}: ${lastMessage.content || 'media file'}` : "No messages yet",
                lastMessageTime: lastMessage ? lastMessage.createdAt : null,
            };
          }));

          const sortedGroups = groupsWithLastMessages.sort((a, b) => {
            return new Date(b.lastMessageTime!).getTime() - new Date(a.lastMessageTime!).getTime();
        });

          const totalGroups = await Group.countDocuments(myquery);

        const socketId = getRecipientId(userId);
        if (socketId) {
            io.to(socketId).emit('groupListUpdate', JSON.stringify(sortedGroups));
        }
        return res.status(200).json({
            currentPage: page,
            totalPages: Math.ceil(totalGroups / limit),
            groupsWithLastMessages: sortedGroups
        });
    } catch (error) {
        console.error("Error getting groups:", error); 
        return res.status(500).json({ error: "An error occured getting groups" });
    }
}

export const getGroupMembers = async (req: Request, res: Response) => {
    try {
        const baseUrl = process.env.BASE_URL;
        const uploadDir: any = process.env.UPLOAD_DIR;
        const userId = decoded(req).userId;
        if (!userId) {
            return res.status(400).json({message: 'Invalid access'});
        }
        const { groupId } = req.params;
        if (!groupId) {
            return res.status(400).json({message: 'Invalid group'});
        }
        const grp = await Group.findById(groupId).populate('members');
        if (!grp) {
            return res.status(400).json({message: 'Group not found'});
        }
        if (!grp.members.includes(userId)) {
            return res.status(403).json({message: "User is not a member of this group"});
        }
        const memberDetails = await User.find({ _id: { $in: grp.members } })
            .select('firstName lastName profilePicture'); // Select the required fields
        const formattedMembers = memberDetails.map(member => ({
            _id: member._id,
            firstName: member.firstName || null,
            lastName: member.lastName || null,
            profilePicture: member.profilePicture || null
        }));
        return res.status(200).json({
        members: formattedMembers
        });
    } catch (err) {
        return res.status(500).json({message: err});
    }
}
// export const getGroupMembers = async (req: Request, res: Response) => {
//     try {
//         const baseUrl = process.env.BASE_URL;
//         const uploadDir: any = process.env.UPLOAD_DIR;
//         const userId = decoded(req).userId;
//         if (!userId) {
//             return res.status(400).json({message: 'Invalid access'});
//         }
//         const { groupId } = req.params;
//         if (!groupId) {
//             return res.status(400).json({message: 'Invalid group'});
//         }
//         const grp = await Group.findById(groupId).populate('members');
//         if (!grp) {
//             return res.status(400).json({message: 'Group not found'});
//         }

//         const mydata = await ConnectionData.find({
//             $or: [{ sender: userId }, { receiver: userId }]
//         });
//         const totalNum = grp.members;
//         const UserIds = mydata.map(connection => {
//             return connection.sender.toString() === userId ? connection.receiver.toString() : connection.sender.toString();
//         });
//         const getMember = totalNum.filter(member => UserIds.includes(member));
//         const user = await User.find({ _id: { $in: getMember } }).select('firstName lastName profilePicture')
//         const formattedMembers = user.map(member => {
//             return {
//                 firstName: member.firstName || 'Unknown',
//                 lastName: member.lastName || 'Unknown',
//                 profilePicture: member.profilePicture?  `${baseUrl}/uploads${member.profilePicture?.replace(uploadDir, '')}`: null,
//             }
//         })
//         return res.status(200).json({
//         members: formattedMembers
//         });
//     } catch (err) {
//         return res.status(500).json({message: err});
//     }
// }

export const disableUnreadCount = async (req: Request, res: Response) => {
    try {
        const userId = decoded(req).userId;
        if (!userId) {
            return res.status(400).json({ message: "Invalid user" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const { groupId } = req.params;
        console.log(groupId);
        if (!groupId) {
            return res.status(400).json({message: "Invalid group"});
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

       
        await grpMessage.updateMany(
            { groupId, readBy: { $ne: userId } },
            { $addToSet: { readBy: userId }}
        );
        return res.status(200).json({
            message: 'disabled unread count'
        });

    } catch (error) {
        return res.status(500).json({ error: "An error occured disabling unread counter" + error });
    }
}

// export const enableUnreadCount = async (req: Request, res: Response) => {
//     try {
//         const userId = decoded(req).userId;
//         if (!userId) {
//             return res.status(400).json({ message: "Invalid user" });
//         }

//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         const { groupId } = req.params;
//         console.log(groupId);
//         if (!groupId) {
//             return res.status(400).json({message: "Invalid group"});
//         }

//         const group = await Group.findById(groupId);
//         if (!group) {
//             return res.status(404).json({ message: "Group not found" });
//         }

//         await grpMessage.updateMany(
//             { groupId, readBy: userId  },
//             { $pull: { readBy: userId }}
//         );

//         return res.status(200).json({
//             message: 'enabled unread counter'
//         });
//     } catch (error) {
//         return res.status(500).json({ error: "An error occured enabling unread count " + error });
//     }
// }

export const deleteGroup = async (req: Request, res: Response, io: any) => {
    try {
        const userId = decoded(req).userId;
        if (!userId) {
            return res.status(404).json({error: "User not found"});
        }
        const groupId = req.params.groupId;

        if (!groupId) {
            return res.status(404).json({error: "Invalid group"});
        }
        const group = await Group.findOne({ _id: groupId });
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        if (group.createdBy.toString() !== userId) {
            return res.status(403).json({ error: "Unauthorized to delete group" });
        }

        const groupMembers = group.members;
        
        await Group.deleteOne({ _id: groupId });

        if (groupMembers && groupMembers.length > 0) {
            groupMembers.forEach((memberId) => {
              const memberSocketId = getRecipientId(memberId); // Get the socket ID of each member
      
              if (memberSocketId) {
                io.to(memberSocketId).emit('groupDeleted', {
                  groupId: groupId,
                  message: `Group "${group.name}" has been deleted by the admin.`,
                });
              }
            });
        }      
        return res.status(200).json({message: "Group deleted successfully"});
    }catch (error) {
        return res.status(500).json({error: "An error occured deleting group " + error});
    }
}

export const AddUserToGroup = async (req: Request, res: Response, io: any) => {
    const userId = decoded(req).userId;
    if (!userId) {
        return res.status(404).json({error: "User not found"});
    }
    const { groupId } = req.params;
    console.log(groupId);
    if (!groupId) {
        return res.status(404).json({error: "Group link required"});
    }

    const user = await User.findById(userId).select(' firstName lastName ');
    if (!user) {
        return res.status(400).json({message: 'User does not exist'});
    }
    const group = await Group.findOne({_id: groupId});
    if (!group) {
        return res.status(404).json({error: "Group not found or unauthorized"});
    }
    console.log(group);

    if (group.members.includes(userId)) {
        return res.status(400).json({message: "User is already a member of this group"});
    }
    group.numberofMembers += 1;
    //Add user id to group
    group.members.push(userId);
    await group.save();
    io.to(groupId).emit('userJoined', { groupId, userId });
    return res.status(200).json({message: "User added to group successfully"});
}

export const AddUserToGroupWithLink = async (req: Request, res: Response, io: any) => {
    const userId = decoded(req).userId;
    if (!userId) {
        return res.status(404).json({error: "User not found"});
    }
    const { groupId, token } = req.params;
    console.log(groupId);
    if (!groupId) {
        return res.status(404).json({error: "Group link required"});
    }

    const group = await Group.findOne({_id: groupId});
    if (!group) {
        return res.status(404).json({error: "Group not found or unauthorized"});
    }
    console.log(group);

    if (group.members.includes(userId)) {
        return res.status(400).json({message: "User is already a member of this group"});
    }

    if (token) {
        const tokenFromLink = group.inviteLink.split('/').pop(); // Extract token from inviteLink
        if (tokenFromLink !== token) {
            return res.status(400).json({error: "Invalid invitation link"});
        }
    }
    group.numberofMembers += 1;
    //Add user id to group
    group.members.push(userId);
    await group.save();
    io.to(groupId).emit('userJoined', { groupId, userId });
    return res.status(200).json({message: "User added to group successfully"});

}

// Edit message by Admin
// export const editGroupMessage = async (req: Request, res: Response) => {
//     const userId = decoded(req).userId;
//     if (!userId) {
//         return res.status(404).json({error: "User not found"});
//     }
//     const groupId = req.params.groupId;
//     const messageId = req.params.messageId;

//     if (!groupId || !messageId) {
//         return res.status(404).json({error: "Group or Message not found"});
//     }

//     const group = await Group.findOne({groupId: groupId, createdBy: userId});
//     if (!group) {
//         return res.status(404).json({error: "Group not found"});
//     }

//     const messageIndex = group.messages.findIndex(m => m.id.toString() === messageId);
//     if (messageIndex === -1) {
//         return res.status(404).json({error: "Message not found"});
//     }
// }

export const searchMessagesByAdmin = async (req: Request, res: Response) => {
    try {
        const userId = decoded(req).userId;
        if (!userId) {
            return res.status(404).json({error: "User not found"});
        }
        const groupId = req.params.groupId;
        const searchText = req.query.searchText;

        if (!groupId || !searchText) {
            return res.status(404).json({error: "Group or Message not found"});
        }

        const group = await Group.findOne({groupId: groupId, createdBy: userId});
        if (!group) {
            return res.status(404).json({error: "Group not found"});
        }

        const messages = await grpMessage.find({ groupId: groupId, content: { $regex: searchText, $options: "i" } });
        if (!messages || messages.length === 0) {
            return res.status(400).json({ error: "Message not found" });
        }
        return res.status(200).json(messages);
    } catch (error) {
        return res.status(500).json({ error: "An error occured searching messages, error at " + error });
    }
}
export const removeUserByAdmin = async (req: Request, res: Response) => {
    try {
        const userId = decoded(req).userId;
        if (!userId) {
            return res.status(400).json({error: "Unauthorized user"});
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({error: "User not found"});
        }
        const { groupId, userIdToRemove } = req.params;
        if (!groupId ||!userIdToRemove) {
            return res.status(400).json({error: "Invalid group or user"});
        }

        const grp = await Group.findOne({ _id: groupId });
        if (!grp) {
            return res.status(404).json({error: "Group not found"});
        }
        if (grp.createdBy.toString() !== userId) {
            return res.status(403).json({ error: "Unauthorized to remove user from group" });
        }
        grp.members = grp.members.filter((member: any) => member.toString()!== userIdToRemove);
        grp.numberofMembers = grp.members.length;
        await grp.save();
        grp.members.forEach(memberId => {
            const memberSocketId = getRecipientId(memberId);
            if (memberSocketId) {
                io.to(memberSocketId).emit('removedByAdmin', {
                    userId: userId,
                    groupId: groupId,
                    message: `${user.firstName} was removed by the admin`
                });
            }
        });
        return res.status(200).json({ message: "User removed successfully" });

    } catch (error) {
        return res.status(500).json({ error: "An error occurred removing user, error at " + error });
    }
}
export const leaveGroup = async (req: Request, res: Response, io: any) => {
    try {
        const userId = decoded(req).userId;
        if (!userId) {
            return res.status(400).json({error: "Unauthorized user"});
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({error: "User not found"});
        }
        const { groupId } = req.params;
        if (!groupId) {
            return res.status(400).json({error: "Invalid group"});
        }

        const grp = await Group.findOne({ _id: groupId });
        if (!grp) {
            return res.status(404).json({error: "Group not found"});
        }

        const isMember = grp.members.includes(userId);
        if (!isMember) {
            return res.status(400).json({error: "User is not a member of this group"});
        }
        // Removes the user from the members array
        grp.members = grp.members.filter((member: any) => member.toString() !== userId);
        grp.numberofMembers = grp.members.length;
        await grp.save();
        grp.members.forEach(memberId => {
            const memberSocketId = getRecipientId(memberId);
            if (memberSocketId) {
                io.to(memberSocketId).emit('userLeftGroup', {
                    userId: userId,
                    groupId: groupId,
                    message: `User ${user.firstName} has left the group`
                });
            }
        });
        return res.status(200).json({message: "User left group"});
    } catch (error) {
        return res.status(500).json({error: "An error occured leaving group " + error});
    }
}
export const getGroupProfile = async ( req: Request, res: Response) => {
    try {

        const baseUrl = process.env.BASE_URL;
        const uploadDir: any = process.env.UPLOAD_DIR;
        const userId = decoded(req).userId;
        if (!userId) {
            return res.status(404).json({message: "Invalid user"});
        }
        const { groupId } = req.params;
        if (!groupId) {
            return res.status(404).json({message: "Invalid group"});
        }
        const grpInfo = await Group.findOne({ _id: groupId})
        .populate({
                path: 'createdBy',
                model: 'UserData',
                select: ' firstName lastName profilePicture'
        });
        if (!grpInfo) {
            return res.status(404).json({message: "Invalid group"});
        }
        const messages = await grpMessage.find({ groupId: groupId });
        console.log(messages);

        const media = messages
        .filter(msg => msg.mediaType && msg.mediaType.some(type => type.startsWith('video') || type.startsWith('image')))
        .map(msg => msg.mediaUrl?.map(url => `${baseUrl}${url}`))
        .flat();

        const documents = messages
        .filter(msg => msg.mediaType && msg.mediaType.some(type => type === 'application/pdf' || type === 'application/docx' || type === 'application/doc'))
        .map(msg => msg.mediaUrl?.map(url => `${baseUrl}${url}`))
        .flat();

    const links = messages
    .filter(msg => msg.content && /(http|https|www):\/\/[^\s]+/.test(msg.content))
    .map(msg => {
      const match = msg.content.match(/(http|https|www):\/\/[^\s]+/);
      return match ? match[0] : null;
    })
    .filter(url => url !== null); // Filter out any null results
  

    //     const mediaFiles = messages
    //     .filter(msg =>
    //       ['mp4', 'png', 'mkv', 'jpeg', 'jpg', 'avi'].includes(msg.mediaType!))
    //     .map(msg => msg.mediaUrl);
  
    //   const documents = messages
    //     .filter(msg => ['doc', 'pdf', 'docx'].includes(msg.mediaType!))
    //     .map(msg => msg.mediaUrl);
  
    //   const links = messages
    //     .filter(msg => msg.content && msg.content.startsWith('http'))
    //     .map(msg => msg.content);

        const medias = {
            media,
            documents,
            links
          };
      
        const totalMembers = grpInfo.members.length;
        return res.status(200).json({
            groupInfo: {
                name: grpInfo.name || null,
                description: grpInfo.description || null,
                profilePhoto: grpInfo.profilePhoto || null,

                bannerPhoto: grpInfo.bannerPhoto || null,
                createdBy: grpInfo.createdBy || null,
                inviteLink: grpInfo.inviteLink || null,
            },
            medias,
            totalMembers
        });
    } catch (err) {
        return res.status(500).json({error: err});
    }
}

export const UpdateuploadImage = async (req: Request, res: Response) => {
    try {
        const userId = decoded(req).userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized user" });
        }
        const { groupId } =req.params;
        if (!groupId) {
            return res.status(401).json({ error: "Group not found" });
        }
        const profilePhoto = req.files && !Array.isArray(req.files) && req.files['profilePhoto']
        ? (req.files['profilePhoto'] as Express.MulterS3.File[])[0]?.location || ""
        : "";
        const bannerPhoto = req.files && !Array.isArray(req.files) && req.files['bannerPhoto']
        ? (req.files['bannerPhoto'] as Express.MulterS3.File[])[0]?.location || ""
        : "";

        
        const updateImage = await Group.findById(groupId);

        console.log(updateImage); 

        if (!updateImage) {
            return res.status(404).json({ message: "Group not found" });
          }
        if (profilePhoto) {
            updateImage.profilePhoto = profilePhoto;
        }
        if (bannerPhoto) {
            updateImage.bannerPhoto = bannerPhoto;
        }
        await updateImage.save();
          return res.status(201).json({message: 'Group images uploaded successfully'});
        } catch (error) {
            return res.status(500).json({error: error});
    }
}

export const updateGroupProfile = async (req: Request, res: Response) => {
    try {
        const userId = decoded(req).userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized user" });
        }
        const { groupId } =req.params;
        if (!groupId) {
            return res.status(401).json({ error: "Group not found" });
        }
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        if (group.createdBy.toString() !== userId) {
            return res.status(403).json({ error: "Only the Admin can edit the group information" });
        }
        const { name, description } = req.body;

        const update: any = {};
        if (name) update.name = name;
        if (description) update.description = description;

        const updateGroup = await Group.findByIdAndUpdate(groupId, { $set: update }, {
            new: true
        });

        if (!updateGroup) {
            return res.status(404).json({ message: "Group not found" });
          }
      
          return res.status(201).json({message: 'Group profile is successfully updated'});
        } catch (error) {
            return res.status(500).json({error: error});
        }
    }

export const getGroupProfileNotInGroup = async (req: Request, res: Response) => {
    try {
        const userId = decoded(req).userId;
        if (!userId) {
            return res.status(404).json({error: "Unauthorized access"});
        }
        const { groupId } = req.params;
        if (!groupId) {
            return res.status(404).json({error: "Unauthorized access"});
        }
        const getGroup = await Group.find({ _id: groupId});
    } catch (error) {
        return res.status(404).json({error: error});
    }
}

export const inviteToGroup = async (req: Request, res: Response) => {
    try {
      const { groupId, userId } = req.params; // `groupId` of the group, `userId` of the invited user
      const inviterId = decoded(req).userId; // ID of the user sending the invite
  
      // Check if the user is already a member of the group
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
  
      const isMember = group.members.includes(userId);
      if (isMember) {
        return res.status(400).json({ error: 'User is already a member of the group' });
      }
     // Send an invite
     const newInvite = new Invite({
        groupId: groupId,
        userId: userId,
        inviterId: inviterId,
        status: 'pending',
    });
    await newInvite.save();
    // Create a notification for the invited user
    const newNotification = new NotificationData({
    recipientId: userId,
    senderId: inviterId,
    type: 'group_invite',
    groupId: groupId,
    message: `You have been invited to join ${group.name}`,
    });
  
    await newNotification.save();

    emitNotification(userId, {
    type: 'group_invite',
    message: `You have been invited to join ${group.name}`,
    groupId,
    senderId: inviterId,
    });
      return res.status(200).json({ message: 'User invited successfully' });
    } catch (error) {
      console.error('Error inviting user to group:', error);
      return res.status(500).json({ error: 'An error occurred while inviting the user to the group' });
    }
};

export const getTotalMembers = async (req: Request, res: Response) => {
    try {
        const baseUrl = process.env.BASE_URL;
        const uploadDir: any = process.env.UPLOAD_DIR;
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        const skip = (page - 1) * limit;
        const userId = decoded(req).userId;
        if (!userId) {
            return res.status(404).json({error: "Unauthorized access"});
        }
        const { groupId } = req.params;
        if (!groupId) {
            return res.status(404).json({error: "Unauthorized access"});
        }
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({error: "Group not found"});
        }
        const totalMembers = group.members;
        const mutualConnections = await ConnectionData.find({
            $and: [
                { status: 'accepted' },
                { $or: [{ sender: userId }, { receiver: userId }] }
            ]
        });

        const connectedUserIds = mutualConnections.map(connection => {
            return connection.sender.toString() === userId ? connection.receiver.toString() : connection.sender.toString();
        });
        const connectedMembersId = totalMembers.filter(member => connectedUserIds.includes(member));
        const unconnectedMembersId = totalMembers.filter(member => !connectedUserIds.includes(member));

        const connectMembers = await User.find({ _id: { $in: connectedMembersId } }).select('firstName lastName profilePicture').skip(skip).limit(limit);
        const unconnectedMembers = await User.find({ _id: { $in: unconnectedMembersId } }).select('firstName lastName profilePicture').skip(skip).limit(limit);
        const filterOutConnectedMembers = connectMembers.filter(member => member.id.toString() !== group.createdBy.toString());
        const filterOutUnconnectedMembers = unconnectedMembers.filter(member => member.id.toString() !== group.createdBy.toString());
        const getConnectedUsers = filterOutConnectedMembers.map(member => {
            return {
            firstName: member.firstName || null,
            lastName: member.lastName || null,
            profilePicture: member.profilePicture || null,
            }
        })

        const getUnconnectedUsers = filterOutUnconnectedMembers.map(member => {
            return {
            firstName: member.firstName || null,
            lastName: member.lastName || null,
            profilePicture: member.profilePicture || null,
            }
        })

        return res.status(200).json({
            totalMembers: totalMembers.length,
            connectedMembersCount: filterOutConnectedMembers.length,
            getConnectedUsers,
            unconnectedMembersCount: filterOutUnconnectedMembers.length,
            getUnconnectedUsers,
            currentPage: page,
            totalPages: Math.ceil(totalMembers.length / limit)
        });
    } catch (error) {
        return res.status(500).json({error: error});
    }
}

export const updateGroupInfo = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const groupId = req.params.groupId;
        decoded(req).userId; // Authenticated user
        const validatedData = await validateRequest(UpdateGroupInfoDto, req.body);
        const updatedInfo = await GroupService.updateGroupInfo(groupId, validatedData);
        return res.status(201).json({
            status: 'success',
            message: `group info updated`,
            data: {
              updatedInfo
            },
          });
    } catch (error) {
        next(error);
    }
}
