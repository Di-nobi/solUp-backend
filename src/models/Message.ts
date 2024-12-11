import mongoose, { Document, Schema } from "mongoose";


//Database for the storing and retrieval of messages
export interface IMessage extends Document {
    senderId: string;
    recipientId: string;
    content: string;
    iv: string;
    delivered: boolean;
    timestamp: Date;
}


const MessageSchema: Schema = new Schema<IMessage>({
    senderId: { type: String, required: true },
    recipientId: { type: String, required: true },
    content: { type: String, required: true },
    iv: { type: String, required: true },
    delivered: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
});

export const Message = mongoose.model<IMessage>("Message", MessageSchema);