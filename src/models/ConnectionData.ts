// models/ConnectionRequest.ts

import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './UserData';

export interface IConnectionRequest extends Document {
  sender: IUser;
  receiver: IUser;

  status: 'pending' | 'accepted' | 'rejected' | 'potential_connection';
}

const ConnectionRequestSchema: Schema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'UserData', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'UserData', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'potential_connection'], default: 'potential_connection' },
  },
  { timestamps: true }
);

const ConnectionData =  mongoose.model<IConnectionRequest>('ConnectionRequest', ConnectionRequestSchema);
export default ConnectionData;