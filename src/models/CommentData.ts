import mongoose, { Schema, Document, model } from "mongoose";



export interface IComment extends Document {
  user: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
}

export const CommentSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'UserData', required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

const Comment = model<IComment>("Comment", CommentSchema);
export default Comment;