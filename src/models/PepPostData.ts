// src/models/Post.ts
import mongoose, { Schema, model, Document } from "mongoose";
import { IReaction, ReactionSchema } from "./ReactionData";
import { CommentSchema, IComment } from "./CommentData";


export interface IPost extends Document {
  author: mongoose.Types.ObjectId;
  title: string;
  content: string;
  media?: string[];
  tags?: string[];
  reactions: IReaction[];
  comments: IComment[];
  createdAt: Date;
  updatedAt: Date;
}


const postSchema = new Schema<IPost>({
  author: { type: Schema.Types.ObjectId, ref: "UserData", required: true }, // Reference to User schema
  title: { type: String, required: true },
  content: { type: String, required: true },
  media: { type: [String] },
  tags: {type: [String]},
  reactions: [ReactionSchema],
    comments: [CommentSchema],
  },
  { timestamps: true }
);

const Post = model<IPost>("Post", postSchema);
export default Post;
