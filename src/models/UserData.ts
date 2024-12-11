import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";


export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  city?: string;
  state?: string;
  country?: string;
  showLocationInProfile: boolean;
  contactNumber?: string;
  dateOfBirth?: string;
  onlyYouCanSeeDOB: boolean;
  customLink?: string;
  showLinkInProfile: boolean;
  bio?: string;
  profilePicture?: string;
  bannerImage?: string;
  googleId?: string;
  referrer?: mongoose.Types.ObjectId;
  referralLink: string;
  isVerified: boolean;
  jobTitle?: string;
  industry?: string;
  interests?: string[];
  savedPosts: string[];
  connections: string[];
  resetPasswordToken?: string;
  resetPasswordExpires?: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    showLocationInProfile: { type: Boolean, default: false },
    contactNumber: { type: String },
    dateOfBirth: { type: Date },
    onlyYouCanSeeDOB: { type: Boolean, default: false },
    customLink: { type: String },
    showLinkInProfile: { type: Boolean, default: false },
    bio: { type: String },
    profilePicture: { type: String },
    bannerImage: {type: String},
    googleId: { type: String },
    referrer: { type: Schema.Types.ObjectId, ref: "UserData", default: null },
    referralLink: { type: String, unique: true },
    isVerified: { type: Boolean, default: false },
    jobTitle: { type: String, default: "" },
    industry: { type: String, default: "" },
    interests: { type: [String] },
    savedPosts: {type: [String], ref: "Post"},
    connections: [{ type: [String], ref: "UserData" }],
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Number },
  },
  { timestamps: true }
);

UserSchema.pre<IUser>("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password!, 10);
  }
  if (this.isNew) {
    this.referralLink = `${this._id}-${this.firstName}-${this.email}`;
  }
  next();
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>("UserData", UserSchema);
