import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "./UserData";
import { IPost } from "./PepPostData";

export interface INotificationPreference extends Document {
  userId: IUser;
  targetUserId?: IUser;
  postId?: IPost;
}

const NotificationPreferenceSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "UserData", required: true },
    targetUserId: { type: Schema.Types.ObjectId, ref: "UserData", required: true },
    postId: { type: Schema.Types.ObjectId, ref: "PostData" },
  },
  { timestamps: true }
);

const NotificationPreference = mongoose.model<INotificationPreference>(
  "NotificationPreference",
  NotificationPreferenceSchema
);

export default NotificationPreference;
