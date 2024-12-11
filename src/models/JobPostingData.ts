import mongoose, { Document, Schema } from 'mongoose';


export interface IJobPosting extends Document {
  role: string;
  company: string;
  state: string;
  country: string;
  workplaceType: 'remote' | 'hybrid' | 'on-site';
  jobType: 'full-time' | 'part-time' | 'contract';
  jobDescription: string;
  skills: string[];
  degree: string[];
  yearsOfExperience: number;
  email: string;
  salaryFloorPrice: number;
  salaryCeilingPrice: number;
  responsibilities: string;
  mustHave?: string;
  perksBenefits?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const JobPostingSchema: Schema = new Schema({
  role: { type: String, required: true },
  company: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  workplaceType: { type: String, enum: ['remote', 'hybrid', 'on-site'], required: true },
  jobType: { type: String, enum: ['full-time', 'part-time', 'contract'], required: true },
  jobDescription: { type: String, required: true },
  skills: { type: [String], required: true },
  degree: { type: [String], required: true },
  yearsOfExperience: { type: Number, required: true },
  email: { type: String, required: true },
  salaryFloorPrice: { type: Number, required: true },
  salaryCeilingPrice: { type: Number, required: true },
  responsibilities: { type: String, required: true },
  mustHave: { type: String },
  perksBenefits: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserData', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const JobPosting = mongoose.model<IJobPosting>('JobPosting', JobPostingSchema);
