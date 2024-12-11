import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "./UserData";
//Database for the storing and retrieval of messages
export interface IGroupMessage extends Document {
    userId: mongoose.Types.ObjectId;
    groupId: mongoose.Types.ObjectId;
    content: string;
    replyTo: string;
    mediaUrl?: string[];
    mediaType?: string[];
    readBy: IUser[];
    edited?: boolean;
    createdAt: Date;
}


const MessageSchema: Schema = new Schema<IGroupMessage>({
    userId: { type: Schema.Types.ObjectId, ref:'UserData', required: true },
    groupId: { type: Schema.Types.ObjectId, ref:'Group', required: true },
    content: { type: String, required: false },
    mediaUrl: { type: [String], required: false },
    mediaType: { type: [String], required: false },
    replyTo: { type: String, required: false },
    readBy: [{ type: Schema.Types.ObjectId, ref:'UserData'}],
    edited: { type: Boolean, default: false},
    createdAt: { type: Date, required: true },
}, { timestamps: true} );

const grpMessage = mongoose.model<IGroupMessage>("grpMessage", MessageSchema);
export default grpMessage;