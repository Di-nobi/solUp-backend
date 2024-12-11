import mongoose, { Schema, Document } from 'mongoose';

export interface IInvite extends Document {
  groupId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  inviterId: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'declined';
}

const InviteSchema: Schema = new Schema(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'UserData', required: true },
    inviterId: { type: Schema.Types.ObjectId, ref: 'UserData', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  },
  { timestamps: true }
);

const Invite = mongoose.model<IInvite>('Invite', InviteSchema);
export default Invite;
