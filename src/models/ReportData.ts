import mongoose, { Schema, Document } from "mongoose";
import { IPost } from "./PepPostData";
import { IUser } from "./UserData";

export interface IReport extends Document {
    postId?: IPost; 
    reportedUserId?: IUser; 
    reportedBy: IUser;
    reason: string;
    description: string;
    status?: string;
    isHidden: boolean;
    reportDate: Date;
    resolvedDate?: Date;
}

const reportReasons = [
  "Harassment", "Fraud", "Scam", "Spam", "Misinformation", "Hate Speech", 
  "Threat", "Violence", "Child Exploitation", "Sexual Content", "Fake Account", 
  "Self-Harm", "Graphic Content", "Infringement", "Illegal Goods and Services",
  "Impersonation", "Bullying", "Terrorism/Extremism", "Toxic Behavior", 
  "Malware/Phishing Link", "Copyright Violation", "Promoting Hate or Violence", 
  "Offensive Language", "Dangerous Challenges", "Adult Content", "Discrimination"
];

const status = ["pending", "reviewed", "resolved"];

const ReportSchema: Schema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post" }, 
    reportedUserId: { type: Schema.Types.ObjectId, ref: "User" },
    reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, enum: reportReasons, required: true },
    description: { type: String, maxlength: 500 },
    status: { type: String, enum: status, default: "pending" },
    isHidden: { type: Boolean, default: false },
    reportDate: { type: Date, default: Date.now },
    resolvedDate: { type: Date }
  },
  { timestamps: true }
);

const Report = mongoose.model<IReport>("Report", ReportSchema);
export default Report;
