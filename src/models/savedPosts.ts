import mongoose, { Schema, Document } from "mongoose";
import { IReaction, ReactionSchema } from "./ReactionData";
import { IComment } from "./CommentData";
import { IPost } from "./PepPostData";
import { IUser } from "./UserData";
export interface IsavedPost extends Document {
    postId: IPost;
    userId: IUser;
}

const IsavedPostSchema: Schema = new Schema({
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'UserData', required: true },
    
}, { timestamps: true });
const savedPosts =  mongoose.model<IsavedPost>("SavedPost", IsavedPostSchema);
export default savedPosts;