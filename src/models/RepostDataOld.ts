// import mongoose, { Schema, model, Document } from "mongoose";
// import { IReaction, ReactionSchema } from "./ReactionData";
// import { IUser } from "./UserData";
// import { IPost } from "./PepPostData";
// import { IComment } from "./CommentData";

// export interface IRepost extends Document {
//     author: IUser;
//     title: string;
//     content: string;
//     media: string[];
//     tags: string[];
//     originalPostId: IPost;
//     isLiked: boolean;
//     isRepost: boolean;
//     comments: IComment[];
//     totalComments: number;
//     reactions: IReaction[];
//     createdAt: Date;
//     repostCount: number;
//     isLikedCount: number;
// }

// const RepostSchema = new Schema<IRepost>({
//     author: { type: Schema.Types.ObjectId, ref: 'UserData', required: true },
//     title: { type: String, required: true },
//     content: { type: String, required: true },
//     media: { type: [String] },
//     tags: {type: [String]},
//     reactions:  [ReactionSchema],
//     originalPostId: { type: Schema.Types.ObjectId, ref: 'Post', required: true},
//     isLiked: { type: Boolean},
//     isLikedCount: { type: Number, default: 0 },
//     isRepost: { type: Boolean},
//     repostCount: { type: Number, default: 0 },
//     comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
//     totalComments: { type: Number, default:0},
//     createdAt: { type: Date, default: Date.now },
// }, { timestamps: true})

// const Repost = model<IRepost>('Repost', RepostSchema);
// export default Repost;