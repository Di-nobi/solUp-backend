import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/UserData";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import {
  sendOTPEmail,
  sendPasswordResetOTPEmail,
  sendResetPasswordEmail,
} from "../utils/mailer";
import { generateReferralCode } from "../utils/referralCode";
import { log } from "console";

let tempUsers: {
  [key: string]: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    otp: string;
  };
} = {};
// const otp = crypto.randomBytes(3).toString("hex"); // Generate a 6-digit OTP

  // // Generate a 6-digit alphanumeric referral code
  // const generateReferralCode = (email: string, userId: string, timestamp: number): string => {
  //   const seed = `${email}-${userId}-${timestamp}`;
  //   const hash = crypto.createHash('sha256').update(seed).digest('hex');
    
  //   // Take the first 6 characters from the hash and ensure it's uppercase
  //   return hash.slice(0, 6).toUpperCase();
  // };

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, first_name, last_name } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const buffer = crypto.randomBytes(3) // Generate a 6-digit OTP
    const motp = buffer.readUIntBE(0, 3) % 1000000;
    const otp = motp.toString().padStart(6, '0');
    console.log("otp", otp);
    tempUsers[email] = { email, password, first_name, last_name, otp };
    await sendOTPEmail(email, otp, email);
    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.log("otp error", error);

    res.status(500).json({ message: "Something went wrong" });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {

    console.log(req.body);
    console.log(tempUsers);
    
    const { email, otp } = req.body;
    const tempUser = tempUsers[email];
    

    if (!tempUser || tempUser.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // console.log(tempUser);

    const user = new User({
      email: tempUser.email,
      password: tempUser.password,
      firstName: tempUser.first_name,
      lastName: tempUser.last_name,
    });
    

     // Generate referral code and update referralLink
     const referralCode = generateReferralCode(user.id.toString(), user.email, Date.now());
     user.referralLink = referralCode;
    //  console.log(referralCode);
  
    await user.save();

    delete tempUsers[email]; // Remove temporary user after successful registration

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "1d",
    });
    
    res.status(201).json({ token });
  } catch (error) {
    console.log("verify otp error:", error);

    res.status(500).json({ message: "Something went wrong" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credientials" });
    }
    // if (!fcmToken) {
    //   return res.status(400).json({ message: "FCM token is required" });
    // }
    // user.fcmToken = fcmToken;
    // await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "1d",
    });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    // Check if user with that email exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const buffer = crypto.randomBytes(3); // Generate 3 random bytes
    const motp = buffer.readUIntBE(0, 3) % 1000000;
    const otp = motp.toString().padStart(6, "0");
    // Generate password reset token
    // const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = otp;
    user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour

    // Save user with reset token
    await user.save();

    // Send email with reset link
    //const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    // Code to send email containing resetUrl to user's email address
    await sendPasswordResetOTPEmail(email, otp, email);

    //await sendResetPasswordEmail(email, resetUrl, email);
    res
      .status(200)
      .json({ message: "Password reset instructions sent to your email" });
  } catch (error) {
    console.error("Error sending password reset email:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const verifyResetOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP matches and is not expired
    if (
      user.resetPasswordToken !== otp ||
      !user.resetPasswordExpires
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    res.status(200).json({ message: "otp verified" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
}

export const resetPassword = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }
    
    // Check if OTP matches and is not expired
    if (
      user.resetPasswordToken !== otp ||
      !user.resetPasswordExpires
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Hash the new password
    // const hashedPassword = await bcrypt.hash(newPassword, 10);
    // console.log(hashedPassword);
    // Update user's password and clear the reset token and expiration
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const googleSignIn = async (req: Request, res: Response) => {
  return res.status(200).json({ message: " Coming soon..." });
};
