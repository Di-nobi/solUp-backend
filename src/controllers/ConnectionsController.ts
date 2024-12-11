import { Request, Response } from "express";
import User, { IUser } from "../models/UserData";
import School, { ISchool } from "../models/SchoolData";
// import UserConnection from '../models/UserConnection'; // Assuming you have a UserConnection model
import { decoded } from "../utils/decodeJwt";
// import mongoose, { ObjectId } from "mongoose";
import { sendFCMNotification } from "../middlewares/fcm";
import ConnectionData from '../models/ConnectionData';
import { emitNotification } from "../websocket/HandleSocket";
import NotificationData from "../models/NotificationData";
import { log } from "console";
import ConnectionRequest, { IConnectionRequest } from '../models/ConnectionData';
import { AnyARecord } from "dns";


export const suggestConnections = async (req: Request, res: Response) => {
  try {
    const baseUrl = process.env.BASE_URL;
    const uploadDir: any = process.env.UPLOAD_DIR;
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = decoded(req);
    const userId = user.userId;

    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const skip = (page - 1) * limit;
    // Fetch current user's details
    const currentUser = await User.findById(userId);

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }
    const findConnections = await ConnectionData.find({
      $or: [
        { sender: userId },
        { receiver: userId },
      ],
      status: { $in: ['accepted', 'pending'] } 
    }).exec();
    let allUsers, totalUsers;
    if (!findConnections || findConnections.length === 0) {
      totalUsers = await User.countDocuments({ _id: { $ne: userId } });
       allUsers = await User.find({_id: {$ne: userId}})
       .select('firstName lastName profilePicture jobTitle').skip(skip).limit(limit).exec();
       return res.status(200).json({
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        suggestedUsers: allUsers.map((user) => ({
          profilePicture: user.profilePicture || null,
          _id: user.id,
          firstName: user.firstName || null,
          lastName: user.lastName || null,
          jobTitle: user.jobTitle || null,
          connectionType: "Suggested Connection",
        })),
      });
    } else {
      const getId = findConnections.flatMap(conn => 
        conn.sender.toString() === userId ? conn.receiver.toString() : conn.sender.toString()
      );

    const pendingConnections = await ConnectionData.find({
      $or: [
        { sender: userId },
        { receiver: userId },
      ],
      status: 'pending',
    }).exec();
    const  pendIds = pendingConnections.map(conn => 
      conn.sender.toString() === userId ? conn.receiver.toString() : conn.sender.toString()
    );
    const notIds = [ ...new Set([...getId, ...pendIds])];
    totalUsers = await User.countDocuments({ _id: { $nin: [userId, ...notIds] } });
    allUsers = await User.find({
      _id: { $nin: [userId, ...notIds] }, // Exclude current user and connected users
    }).select('firstName lastName profilePicture jobTitle ').sort({ createdAt: -1})
    .skip(skip).limit(limit).exec();

    if (allUsers.length === 0) {
      return res.status(200).json({
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        suggestedUsers: [],
      });
    }
    return res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      suggestedUsers: allUsers.map((user) => ({
        profilePicture: user.profilePicture || null,
        _id: user.id,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        jobTitle: user.jobTitle || null,
        connectionType: "Suggested Connection"
      })),
    });
  }
  } catch (error) {
    console.error("Error suggesting connections:", error);
    res.status(500).json({ error: "Unable to suggest connections" });
  }
};


export const addConnectionRequest = async (req: Request, res: Response) => {
  const  userToAdd = req.params.userId; // User to be added as a connection
  const userId = decoded(req).userId; // Current user performing the action

  try {
    // Find the current user and update connections
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user is already in connections list
    // if (user.connections.includes(userToAdd)) {
    //   return res.status(400).json({ message: "User is already a connection" });
    // }

     // Check if a connection request already exists
     const existingRequest = await ConnectionRequest.findOne({
      sender: userId,
      receiver: userToAdd,
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Connection request already exists' });
    }


    // Create a new connection request
    const connectionRequest = new ConnectionRequest({
      sender: userId,
      receiver: userToAdd,
      status: 'pending',
    });

    await connectionRequest.save();

    // Adds the status request to the receiver profile as pendingAccept
    const receiver = await User.findById(userToAdd);
    if (receiver) {
      receiver.pendingAccept.push(userId);
      await receiver.save();
    }
    // Create a notification record for the recipient
    const notification = new NotificationData({
      senderId: userId,
      recipientId: connectionRequest?.receiver,
      type: 'connectionRequest',
      read: false,
    });
    await notification.save();
    // Emit a notification event to the recipient
    // emitNotification(connectionRequest.receiver.toString(), { // Convert ObjectId to string
    //   type: 'connectionRequest',
    //   message: `${user.firstName} ${user.lastName} sent you a connection request`,
    //   senderId: user,
    // });
    const recipient = await User.findById(connectionRequest.receiver.toString());
        if (recipient && recipient.fcmToken) {
          // Send notification
          await sendFCMNotification(recipient.fcmToken, 'New request Alert!', `${user.firstName} just sent you a connection request`);
        }
    res.status(201).json({ message: 'Connection request sent', connectionRequest });
  } catch (error) {
    console.error('Error sending connection request:', error);
    res.status(500).json({ message: 'Failed to send connection request' });
  }
};

export const removeConnectionRequest = async (req: Request, res: Response) => {
  const userId = req.params.userId; // User to be removed from connections
  const currentUser = decoded(req).userId; // Current user performing the action

  try {
   // Find and remove the connection request
   const connectionRequest = await ConnectionRequest.findOne({
    sender: currentUser,
    receiver: userId,
    status: { $in: ['pending', 'accepted', 'rejected'] }
  });

  if (!connectionRequest) {
    return res.status(404).json({ message: 'Connection request not found' });
  }

  connectionRequest.status = 'potential_connection';
  await connectionRequest.save();
  const receiver = await User.findById(currentUser);
  if (receiver) {
    receiver.pendingAccept = receiver.pendingAccept.filter(id => id.toString()!== userId);
    await receiver.save();
  }

  return res.status(200).json({ message: 'Connection request removed', connectionRequest });
} catch (error) {
    console.error('Error removing connection request:', error);
    res.status(500).json({ message: 'Failed to remove connection request' });
  }
};

export const fetchConnectionRequests = async (req: Request, res: Response) => {
  const baseUrl = process.env.BASE_URL;
  const uploadDir: any = process.env.UPLOAD_DIR;
  const userId = decoded(req).userId;
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const skip = (page - 1) * limit;
  try {
    // Fetch pending connection requests where the current user is either the sender or receiver
    const connector = await ConnectionRequest.find({
        receiver: userId,
        status: 'pending',
    })
      .populate({path: "sender", select: "firstName lastName profilePicture jobTitle"}) // Populate sender details
      // .populate({path: "receiver", select: "firstName lastName profilePicture jobTitle"}) // Populate receiver details
      .skip(skip).limit(limit)
      .exec();
      
        const connectionRequests = connector.map((conn) => {
          return {
          requestId: conn.id,
          sender: {
            _id: conn.sender._id,
            firstName: conn.sender.firstName || null,
            lastName: conn.sender.lastName || null,
            profilePicture: conn.sender.profilePicture || null,
            jobTitle: conn.sender.jobTitle || null,
          },
          // receiver: {
          //   _id: conn.receiver._id,
          //   firstName: conn.receiver.firstName || null,
          //   lastName: conn.receiver.lastName || null,
          //   profilePicture: conn.receiver.profilePicture?  `${baseUrl}/uploads${conn.receiver.profilePicture?.replace(uploadDir, '')}`: null,
          //   jobTitle: conn.receiver.jobTitle || null,
          // },
        }
        });
    const totalRequests = await ConnectionRequest.countDocuments({
      receiver: userId,
      status: 'pending',
    });
    res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(totalRequests / limit),
      connectionRequests
    });
  } catch (error) {
    console.error('Error fetching connection requests:', error);
    res.status(500).json({ message: 'Failed to fetch connection requests' });
  }
};
// Accept a connection request
export const acceptConnectionRequest = async (req: Request, res: Response) => {
  const requestId  = req.params.requestId;
  const currentUser  = decoded(req).userId;

  try {
    // Find the connection request
    const connectionRequest = await ConnectionRequest.findById(requestId);

    if (!connectionRequest) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    if (connectionRequest.receiver.toString() !== currentUser) {
      return res.status(403).json({ message: 'Not authorized to accept this request' });
    }

    // Update the status of the connection request
    connectionRequest.status = 'accepted';
    await connectionRequest.save();
    // Add each user to the other's connections list
    await User.findByIdAndUpdate(connectionRequest.sender, {
      $addToSet: { connections: connectionRequest.receiver },
    });

    await User.findByIdAndUpdate(connectionRequest.receiver, {
      $addToSet: { connections: connectionRequest.sender },
    });

    const receiver: any = await User.findById(currentUser);
  if (receiver) {
    receiver.pendingAccept = receiver.pendingAccept.filter((id: any) => id.toString()!== connectionRequest.sender.toString());
    await receiver.save();
  }
  const notification = new NotificationData({
    senderId: connectionRequest?.sender,
    recipientId: currentUser,
    type: 'connectionRequest',
    read: false,
  });
  await notification.save();
  // Emit a notification event to the recipient
  // emitNotification(connectionRequest.receiver.toString(), { // Convert ObjectId to string
  //   type: 'connectionRequest',
  //   message: `${user.firstName} ${user.lastName} sent you a connection request`,
  //   senderId: user,
  // });
  const recipient = await User.findById(connectionRequest.sender.toString());
      if (recipient && recipient.fcmToken) {
        // Send notification
        await sendFCMNotification(recipient.fcmToken, 'New request Alert!', `${receiver.firstName} just accepted your connection request`);
      }
    res.status(200).json({ message: 'Connection request accepted' });
  } catch (error) {
    console.error('Error accepting connection request:', error);
    res.status(500).json({ message: 'Failed to accept connection request' });
  }
};

// Decline a connection request
export const declineConnectionRequest = async (req: Request, res: Response) => {
  const requestId  = req.params.requestId;
  const currentUser  = decoded(req).userId;

  try {
    // Find the connection request
    const connectionRequest = await ConnectionRequest.findById(requestId);

    if (!connectionRequest) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    if (connectionRequest.receiver.toString() !== currentUser) {
      return res.status(403).json({ message: 'Not authorized to decline this request' });
    }

    // Update the status of the connection request
    connectionRequest.status = 'rejected';
    await connectionRequest.save();

    const receiver = await User.findById(currentUser);
    if (receiver) {
    receiver.pendingAccept = receiver.pendingAccept.filter(id => id.toString()!== connectionRequest.sender.toString());
    await receiver.save();
  }
    res.status(200).json({ message: 'Connection request declined' });
  } catch (error) {
    console.error('Error declining connection request:', error);
    res.status(500).json({ message: 'Failed to decline connection request' });
  }
};

export const getMyConnections = async (req: Request, res: Response) => {
  const baseUrl = process.env.BASE_URL;
  const uploadDir: any = process.env.UPLOAD_DIR;
  const userId = decoded(req).userId;
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const skip = (page - 1) * limit;
  try {
    // Fetch pending connection requests where the current user is either the sender or receiver
    const connector = await ConnectionRequest.find({
      $or: [
        { sender: userId, },
        { receiver: userId, },
      ],
      status: 'accepted',
    })
    .populate([
      { path: 'sender', select: 'firstName lastName profilePicture jobTitle' },
      { path: 'receiver', select: 'firstName lastName profilePicture jobTitle' }
    ])
    .skip(skip).limit(limit)
    .exec();

      const getConnections = connector.map((conn) => {
        const isSender = conn.sender.id.toString() === userId.toString();
        const connectionUser = isSender ? conn.receiver : conn.sender;
  
        return {
          myConnection: {
            _id: connectionUser?._id,
            firstName: connectionUser?.firstName || null,
            lastName: connectionUser?.lastName || null,
            profilePicture: connectionUser.profilePicture || null,
            jobTitle: connectionUser?.jobTitle || null,
          },
        };
      });

    const totalRequests = await ConnectionRequest.countDocuments({
      $or: [
        { sender: userId },
        { receiver: userId },
      ],
      status: 'accepted',
    });
    res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(totalRequests / limit),
      totalConnections: totalRequests,
      getConnections
      
    });
  } catch (error) {
    console.error('Error fetching connection requests:', error);
    res.status(500).json({ message: 'Failed to fetch connection requests' });
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const baseUrl = process.env.BASE_URL;
    const uploadDir: any = process.env.UPLOAD_DIR;
    const { name } = req.query;

    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const skip = (page - 1) * limit;

    if (!name) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const signedInUser = decoded(req).userId;
    if (!signedInUser) {
      return res.status(401).json({ error: "Unauthorized access" });
    }

    // Search for users by first name, last name, or email, excluding the signed-in user
    const users = await User.find({
      $or: [
        { firstName: { $regex: name, $options: 'i' } },
        { lastName: { $regex: name, $options: 'i' } },
        { email: { $regex: name, $options: 'i' } },
      ],
      _id: { $ne: signedInUser }
    })
     .select("firstName lastName profilePicture jobTitle")
     .skip(skip).limit(limit)
     .exec();

    // if (!users || users.length === 0) {
    //   return res.status(200).json([]);
    // }

    const totalCount = await User.countDocuments({
      $or: [
        { firstName: { $regex: name, $options: 'i' } },
        { lastName: { $regex: name, $options: 'i' } },
        { email: { $regex: name, $options: 'i' } },
      ],
      _id: { $ne: signedInUser }
    });
    // Map over the found users and include the connection status
    const getUser = await Promise.all(users.map(async user => {
      // Find connection status between the signed-in user and each found user
      const connectionStatus = await ConnectionData.findOne({
        $or: [
          { sender: signedInUser, receiver: user._id },
          { sender: user._id, receiver: signedInUser },
        ],
      }).select('status');

      // Return the user object with status
      return {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture || null,
        jobTitle: user.jobTitle,
        status: connectionStatus ? connectionStatus.status : "potential connection" 
      } || [];
    }));

    // Return the user data with the embedded status
    return res.status(200).json({ getUser, page: page, totalPages:  Math.ceil(totalCount / limit) });

  } catch (error) {
    console.error("Error searching users:", error);
    return res.status(500).json({ error: "Unable to search users" });
  }
};

export const newestConnections = async ( req: Request, res: Response) => {

  const baseUrl = process.env.BASE_URL;
  const uploadDir: any = process.env.UPLOAD_DIR;
  const userId = decoded(req).userId;
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const skip = (page - 1) * limit;
  try {
    // Fetch pending connection requests where the current user is either the sender or receiver
    const connector = await ConnectionRequest.find({
      $or: [
        { sender: userId, },
        { receiver: userId, },
      ],
      status: 'accepted',
    })
    .populate([
      { path: 'sender', select: 'firstName lastName profilePicture jobTitle' },
      { path: 'receiver', select: 'firstName lastName profilePicture jobTitle' }
    ])
    .sort({ createdAt: -1 })
    .skip(skip).limit(limit)
    .exec();

      const getConnections = connector.map((conn) => {
        const isSender = conn.sender.id.toString() === userId.toString();
        const connectionUser = isSender ? conn.receiver : conn.sender;
  
        return {
          myConnection: {
            _id: connectionUser?._id,
            firstName: connectionUser?.firstName || null,
            lastName: connectionUser?.lastName || null,
            profilePicture: connectionUser.profilePicture || null,
            jobTitle: connectionUser?.jobTitle || null,
          },
        };
      });

    const totalRequests = await ConnectionRequest.countDocuments({
      $or: [
        { sender: userId },
        { receiver: userId },
      ],
      status: 'accepted',
    });
    res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(totalRequests / limit),
      totalConnections: totalRequests,
      getConnections
      
    });
  } catch (error) {
    return res.status(500).json({error: error});
  }
}

export const oldestConnections = async ( req: Request, res: Response) => {

  const baseUrl = process.env.BASE_URL;
  const uploadDir: any = process.env.UPLOAD_DIR;
  const userId = decoded(req).userId;
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const skip = (page - 1) * limit;
  try {
    // Fetch pending connection requests where the current user is either the sender or receiver
    const connector = await ConnectionRequest.find({
      $or: [
        { sender: userId, },
        { receiver: userId, },
      ],
      status: 'accepted',
    })
    .populate([
      { path: 'sender', select: 'firstName lastName profilePicture jobTitle' },
      { path: 'receiver', select: 'firstName lastName profilePicture jobTitle' }
    ])
    .skip(skip).limit(limit)
    .exec();

      const getConnections = connector.map((conn) => {
        const isSender = conn.sender.id.toString() === userId.toString();
        const connectionUser = isSender ? conn.receiver : conn.sender;
  
        return {
          myConnection: {
            _id: connectionUser?._id,
            firstName: connectionUser?.firstName || null,
            lastName: connectionUser?.lastName || null,
            profilePicture: connectionUser.profilePicture || null,
            jobTitle: connectionUser?.jobTitle || null,
          },
        };
      });

    const totalRequests = await ConnectionRequest.countDocuments({
      $or: [
        { sender: userId },
        { receiver: userId },
      ],
      status: 'accepted',
    });
    res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(totalRequests / limit),
      totalConnections: totalRequests,
      getConnections
      
    });
  } catch (error) {
    return res.status(500).json({error: error});
  }
}