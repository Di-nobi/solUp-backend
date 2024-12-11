import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './UserData';

interface IBlockedUser extends Document {
  userId: IUser;
  blockedUserId: IUser;
  blockedAt: Date;
}

const BlockedUserSchema = new Schema<IBlockedUser>({
  userId: { type: Schema.Types.ObjectId, ref: 'UserData', required: true },
  blockedUserId: { type: Schema.Types.ObjectId, ref: 'UserData', required: true },
  blockedAt: { type: Date, default: Date.now }
});

BlockedUserSchema.index({ userId: 1, blockedUserId: 1 }, { unique: true });

export const BlockedUser = mongoose.model<IBlockedUser>('BlockedUser', BlockedUserSchema);
