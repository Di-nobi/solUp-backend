// models/JobApplication.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IJobApplication extends Document {
  jobId: mongoose.Types.ObjectId; // Reference to the JobPosting
  applicantId: mongoose.Types.ObjectId; // Reference to the User applying
  resume: string; // Assuming the resume is stored as a URL or base64 string
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: Date;
}


const JobApplicationSchema: Schema = new Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPosting', required: true },
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserData', required: true },
  resume: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  appliedAt: { type: Date, default: Date.now },
});

const JobApplication = mongoose.model<IJobApplication>('JobApplication', JobApplicationSchema);

export default JobApplication;
