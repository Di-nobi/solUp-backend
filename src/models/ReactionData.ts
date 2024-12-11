import mongoose, { Schema, Document, model } from "mongoose";


export interface IReaction extends Document {

    userId: mongoose.Types.ObjectId;
    type: string; // e.g., love, like, sad, mad
  }

  export const ReactionSchema: Schema = new Schema(
    {
      userId: { type: Schema.Types.ObjectId, ref: 'UserData', required: true },
      type: { type: String, required: true },
    },
    { timestamps: true }
  );

  const Reaction = model<IReaction>("Reaction", ReactionSchema);
export default Reaction;