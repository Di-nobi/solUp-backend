import mongoose, { Document, Schema } from "mongoose";

export interface ICall extends Document {
  // createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  channelName: string;
}

const CallSchema: Schema<ICall> = new Schema(
  {
    // createdBy: { type: Schema.Types.ObjectId, ref: "UserData" },
    createdAt: { type: Date, default: () => new Date() },
    channelName: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ICall>("CallData", CallSchema);
