import { Socket, Server } from 'socket.io';
import http from 'http';
import express, { Application } from "express";
import grpMessage from '../models/GroupMessages';

const app: Application = express();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

const socketmap: { [key: string]: string } = {};

// Function to get a recipient's socket ID from socketmap 
export const getRecipientId = (recipientId: string) => {
    return socketmap[recipientId];
};

// ----------------------- SOCKETS FOR HANDLING PRIVATE MESSAGES ----------------------------------------
io.on('connection', (socket: Socket) => {
    console.log('a user connected with socket ID:', socket.id);
    
    // Store the userId and socket ID mapping
    const userId = socket.handshake.query.userId as string | undefined;
    if (userId) {
        socketmap[userId] = socket.id;
    }

    // Emit the connected users to all clients
    io.emit('displayConnectedUsers', Object.keys(socketmap));

    

    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log('user disconnected:', socket.id);
        if (userId) {
            delete socketmap[userId];
        }
        io.emit('displayConnectedUsers', Object.keys(socketmap));
    });

    // ------------------- HANDLING GROUP MESSAGES --------------------------------
    socket.on('sendMessage', async (data: { groupId: string, senderId: string, content: string }) => {
        const { groupId, senderId, content } = data;

        // Save the group message to the database
        const newMessage = new grpMessage({
            senderId,
            groupId,
            content,
            createdAt: new Date(),
        });

        await newMessage.save();

        // Emit the message to all users in the group room
        io.to(groupId).emit('newGroupMessage', {
            senderId,
            content,
            createdAt: newMessage.createdAt,
        });

        console.log(`Message sent to group ${groupId} by ${senderId}`);
    });

    // Join a group room
    socket.on('userJoined', ({ groupId }) => {
        socket.join(groupId);
        console.log(`User with socket ID ${socket.id} joined group: ${groupId}`);
    });

    // Leave a group room
    socket.on('userLeftGroup', ({ groupId }) => {
        socket.leave(groupId);
        console.log(`User with socket ID ${socket.id} left group: ${groupId}`);
    });

    // ------------------- HANDLING VIDEO AND VOICE CALLS --------------------------------
    socket.on('callUser', ({ recipientId, signalData, from }) => {
        const recipientSocketId = getRecipientId(recipientId);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('incomingCall', { signal: signalData, from });
        }
    });

    socket.on('answerCall', ({ signal, to }) => {
        const callerSocketId = getRecipientId(to);
        if (callerSocketId) {
            io.to(callerSocketId).emit('callAccepted', { signal });
        }
    });

    // Handles the ICE candidate exchange for webRTC
    socket.on('icecandidate', ({ candidate, to }) => {
        const recipientSocketId = getRecipientId(to);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('newIceCandidate', candidate);
        }
    });

    // End the call
    socket.on('endCall', ({ to }) => {
        const recipientSocketId = getRecipientId(to);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('callEnded');
        }
    });
});

// ------- FUNCTION TO EMIT NOTIFICATIONS --------------------------------
export const emitNotification = (recipientId: string, notificationData: any) => {
    const socketId = getRecipientId(recipientId);
    if (socketId) {
        io.to(socketId).emit('notification', notificationData);
        console.log(`Notification sent to user ${recipientId}`);
    }
};

export const emitUnreadMessageCount = (recipientId: string, unreadCount: number) => {
    const socketId = getRecipientId(recipientId);
    if (socketId) {
        io.to(socketId).emit('unreadMessageCount', unreadCount);
        console.log(`Unread message count sent to user ${recipientId}`);
    }
}

// ------- EXPORT THE SERVER AND IO FOR USE IN OTHER FILES --------------------------------
export { app, io, server };
