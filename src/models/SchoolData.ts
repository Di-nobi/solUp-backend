import mongoose, { Document, Schema } from "mongoose";


export interface ISchool extends Document {
  userId: mongoose.Types.ObjectId;
  schoolName: string;
  degree: string;
  fieldOfStudy: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
}

const SchoolSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'UserData', required: true },
    schoolName: { type: String, required: true },
    degree: { type: String, required: true },
    fieldOfStudy: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    description: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ISchool>("School", SchoolSchema);
