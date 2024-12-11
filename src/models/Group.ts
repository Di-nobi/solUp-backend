import mongoose, { Schema, Document } from "mongoose";
import grpMessage, { IGroupMessage } from "./GroupMessages";

export enum GroupSetting {
    AdminOnly = 'Only Admin',
    GroupMembersOnly = 'Group members only',
    EveryoneInPepoz = 'Everyone in pepoz'
}
export interface IGroup extends Document {
    name: string;
    description: string;
    bannerPhoto?: string;
    profilePhoto?: string;
    settings: GroupSetting;
    createdBy: mongoose.Types.ObjectId;
    inviteLink: string;
    messages: string[];
    numberofMembers: number;
    members: string[];
    // createdAt: Date;
}

const GroupSchema: Schema = new Schema({
    // _id: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    bannerPhoto: { type: String },
    profilePhoto: { type: String },
    settings: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'UserData', required: true },
    inviteLink: { type: String, required: false },
    messages: [{ type: Schema.Types.ObjectId, ref: 'grpMessage', default: [] }],
    members: { type: [String]},
    numberofMembers: { type: Number, default: 0 },
    // media: [{ type: String }],
    // documents: [{ type: String }],
    // links: [{ type: String }]
}, { timestamps: true });

const Group = mongoose.model<IGroup>("Group", GroupSchema);
export default Group;