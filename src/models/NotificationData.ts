import mongoose, { Schema, Document } from "mongoose";
import { IPost } from "./PepPostData";
import { IGroup } from "./Group";

interface INotificationData extends Document {
    recipientId: string;
    senderId: string;
    type: string;
    postId?: IPost;
    message: string;
    groupId?: IGroup;
    originalPostId?: IPost;
    isRead: boolean;

}

const NotificationDataSchema = new Schema({
    recipientId: { type: Schema.Types.ObjectId, ref: "UserData", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "UserData", required: true },
    message: { type: String, required: false },
    type: { type: String, required: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: false },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: false },
    originalPostId: { type: Schema.Types.ObjectId, ref: "Post", required: false },
    isRead: { type: Boolean, default: false },
}, { timestamps: true });

const NotificationData = mongoose.model<INotificationData>("NotificationData", NotificationDataSchema);
export default NotificationData;