import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './UserData';
import { IPost } from './PepPostData';
import { IComment } from './CommentData';

interface IHiddenPost extends Document {
  userId: IUser;
  postId: IPost;
  commentId:IComment; 
  hiddenAt: Date;
}

const hiddenPostSchema = new Schema<IHiddenPost>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserData', required: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post',  },
  commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment',  },
  hiddenAt: { type: Date, default: Date.now },
});

export const HiddenPost = mongoose.model<IHiddenPost>('HiddenPost', hiddenPostSchema);
