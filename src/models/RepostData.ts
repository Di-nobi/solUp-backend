
import mongoose, { Schema, Document } from "mongoose";
import { IPost } from "./PepPostData";
import { IUser } from "./UserData";

export interface IRepost extends Document {
    postId: IPost;
    userId: IUser;            
    createdAt: Date;                           
}

const RepostSchema: Schema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'UserData', required: true },
    createdAt: { type: Date, default: Date.now },     
  },
  { timestamps: true }
);

const Repost = mongoose.model<IRepost>("Repost", RepostSchema);
export default Repost;