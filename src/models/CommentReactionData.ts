import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "./UserData";
import { IComment } from "./CommentData";

export interface ICommentReaction extends Document {
  userId: IUser; 
  commentId: IComment;
  reactionType: string;
  createdAt: Date;
}

const commentReactionSchema = new Schema<ICommentReaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "UserData", required: true },
    commentId: { type: Schema.Types.ObjectId, ref: "Comment", required: true },
    reactionType: {
      type: String,
      enum: ["like", "love", "haha", "wow", "sad", "angry"],
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const CommentReaction = mongoose.model<ICommentReaction>("CommentReaction", commentReactionSchema);
export default CommentReaction;
