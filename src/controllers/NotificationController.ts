import { Request, Response } from "express";
import NotificationData from "../models/NotificationData";
import { decoded } from "../utils/decodeJwt";

export const getNotifications = async (req: Request, res: Response) => {
    try {

        const currentUser = decoded(req).userId;
        if (!currentUser) {
            return res.status(401).json({ error: "Unauthorized user" });
        }

        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        const skip = (page - 1) * limit;

        const notifications = await NotificationData.find({ recipientId: currentUser, isRead: false }).select('message').sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
        const totalNotifications = await NotificationData.countDocuments({ recipientId: currentUser });
        return res.status(200).json({
            currentPage: page,
            totalPages: Math.ceil(totalNotifications / limit),
            notifications
        });
    } catch (error) {
        return res.status(500).json({ error: "An error occurred fetching notifications " + error });
    }
}

export const markNotificationAsRead = async (req: Request, res: Response) => {
    try {

        const currentUser = decoded(req).userId;
        if (!currentUser) {
            return res.status(401).json({ error: "Unauthorized user" });
        }

        const notification = await NotificationData.updateOne({ isRead: true });
        return res.status(200).json(notification);
    } catch (error) {
        return res.status(500).json({ error: "An error occurred marking notification as read " + error });
    }
}