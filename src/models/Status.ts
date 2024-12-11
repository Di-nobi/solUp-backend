import mongoose, { Schema, Document } from "mongoose";
import { StatusTypeEnum } from "../dtos/status.dto";

// TODO: change the schema design for version two to have user and statuses in one document

// Define the interface for the reaction sub document
export interface IArchives {
  user: mongoose.Types.ObjectId | string;
  archived: string;
}

// Define the interface for the reaction sub document
export interface IReaction {
  user: mongoose.Types.ObjectId | string;
  emoji: string;
}

// Define the schema for the status document
export interface IStatus extends Document {
  user: mongoose.Types.ObjectId | string;
  type: StatusTypeEnum;
  content: string;
  backgroundColor: string;
  caption: string
  expiresAt: Date;
  archives: IArchives[];
  reactions: IReaction[];
  createdAt: Date;
}

// Define the schema for the Status document
const StatusSchema = new Schema<IStatus>(
  {
    user: { type: Schema.Types.ObjectId, ref: "UserData", required: true, index: true },
    type: { type: String, enum: Object.values(StatusTypeEnum), required: true },
    content: { type: String, required: true },
    backgroundColor: { type: String, trim: true },
    caption: { type: String, trim: true },
    expiresAt: { type: Date, required: true },
    archives: [
      {
        user: { type: Schema.Types.ObjectId, ref: "UserData" },
        archived: { type: Boolean, default: false },
      },
    ],
    reactions: [
      {
        user: { type: Schema.Types.ObjectId, ref: "UserData" },
        emoji: { type: String },
      },
    ],
  },
  { timestamps: true }
);

StatusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired statuses

export const Status = mongoose.model<IStatus>("Status", StatusSchema);
