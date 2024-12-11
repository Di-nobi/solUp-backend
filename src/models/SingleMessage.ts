import mongoose, { Document, Schema } from "mongoose";
//Database for the storing and retrieval of messages
export interface IMessage extends Document {
    senderId: mongoose.Types.ObjectId | string;
    recipientId: mongoose.Types.ObjectId | string;
    content: string;
    mediaUrl?: string[];
    mediaType?: string[];
    createdAt: Date;
    read: boolean;
    archive?: boolean;
    edited?: boolean;
    // isRead: boolean;
    replyTo: string;
    statusId: mongoose.Types.ObjectId | string;
}


const MessageSchema: Schema = new Schema<IMessage>({
    senderId: { type: Schema.Types.ObjectId, ref:'UserData', required: true },
    recipientId: { type: Schema.Types.ObjectId, ref:'UserData', required: true },
    content: { type: String, required: false },
    // iv: { type: String, required: true },
    mediaUrl: { type: [String], required: false },
    mediaType: { type: [String], required: false },
    read: { type: Boolean, default: false },
    // isRead: { type: Boolean, default: false },
    archive: { type: Boolean, default: false },
    edited: {type: Boolean, default: false},
    replyTo: { type: String, required: false },
    createdAt: { type: Date, required: true },
    statusId: { type: Schema.Types.ObjectId, ref:'Status' },
}, { timestamps: true} );

const Message = mongoose.model<IMessage>("Message", MessageSchema);
export default Message;