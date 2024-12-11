import { Request, Response } from "express";
import Report from "../models/ReportData"; 
import Post from "../models/PepPostData";
import User, { IUser } from "../models/UserData";
import mongoose from "mongoose";
import { reportThresholds } from "../utils/reportConfig";
import { sendFCMNotification } from "../middlewares/fcm";
import { decoded } from "../utils/decodeJwt";


type ReportReason = keyof typeof reportThresholds;

export const reportPost = async (req: Request, res: Response) => {
    try {
      const { reason, description } = req.body;
      const { postId } = req.params;
      const user = decoded(req);
      const reportedBy = user.userId; 
  
      const post = await Post.findById(postId);
      if (!post) return res.status(404).json({ message: "Post not found" });
  
      const reportReasons = Report.schema.path("reason").options.enum;
      if (!reportReasons.includes(reason)) {
        return res.status(400).json({ message: "Invalid report reason" });
      }
      const existingReport = await Report.findOne({ postId, reportedBy, reason });
      if (existingReport) {
        return res.status(400).json({ message: "You have already reported this post for this reason" });
      }
  
      const report = new Report({
        reportedBy,
        postId,
        reason,
        description,
        isHidden: false
      });
  
      await report.save();
      await checkAndTakeAction(postId, reason);
  
      res.status(201).json({ message: "Report submitted successfully", report });
    } catch (error) {
      console.error("Report Error:", error);
      res.status(500).json({ message: "An error occurred while reporting the post" });
    }
  };

  const checkAndTakeAction = async (postId: string, reason: ReportReason) => {
    const reports = await Report.aggregate([
      { $match: { postId: postId, reason } },
      { $group: { _id: "$reason", count: { $sum: 1 } } }
    ]);
  
    if (reports.length > 0 && reports[0].count >= reportThresholds[reason]) {
      await takeActionOnReportedPost(postId, reason);
    }
  };

const takeActionOnReportedPost = async (postId: string, reason: string) => {
    const post = await Post.findById(postId);
    if (!post) return;
    switch (reason) {
      case "Harassment":
        post.isHidden = true;
        await post.save();
        console.log(`Post ${postId} has been hidden due to Harassment`);
        break;
  
      case "Fraud":
        post.isDeleted = true;
        await post.save();
        const user = await User.findById(post.author);
        if (user) {
          user.isBanned = true;
          await user.save();
          console.log(`User ${user._id} has been banned for posting fraudulent content`);
        }
        console.log(`Post ${postId} has been deleted due to Fraud`);
        break;
  
      case "Scam":
        post.isDeleted = true;
        await post.save();
        const scamUser = await User.findById(post.author);
        if (scamUser) {
          scamUser.isFlagged = true;
          await scamUser.save();
          console.log(`User ${scamUser._id} has been flagged for scam activity`);
        }
        console.log(`Post ${postId} has been deleted due to Scam`);
        break;
  
      case "Spam":
        post.isHidden = true;
        await post.save();
        const spamUser = await User.findById(post.author);
        if (spamUser) {
          sendWarningMessage(spamUser, "Your post has been flagged as spam. Please refrain from posting spam content.");
          console.log(`User ${spamUser._id} has been warned for posting spam`);
        }
        console.log(`Post ${postId} has been hidden due to Spam`);
        break;
  
      case "Misinformation":
        post.isHidden = true;
        await post.save();
        sendClarificationRequest (post.author as any);
        console.log(`Post ${postId} has been hidden due to Misinformation`);
        break;
  
      case "Hate Speech":
        post.isDeleted = true;
        await post.save();
        const hateUser = await User.findById(post.author);
        if (hateUser) {
          hateUser.isBanned = true;
          await hateUser.save();
          console.log(`User ${hateUser._id} has been banned for posting hate speech`);
        }
        console.log(`Post ${postId} has been deleted due to Hate Speech`);
        break;
  
      case "Threat":
        post.isDeleted = true;
        await post.save();
        reportToAuthorities(post.author as any, reason);
        console.log(`Post ${postId} has been deleted due to Threat`);
        break;
  
      case "Violence":
        post.isDeleted = true;
        await post.save();
        const violenceUser = await User.findById(post.author);
        if (violenceUser) {
          violenceUser.isBanned = true;
          await violenceUser.save();
          console.log(`User ${violenceUser._id} has been banned for posting violent content`);
        }
        console.log(`Post ${postId} has been deleted due to Violence`);
        break;
  
      case "Child Exploitation":
        post.isDeleted = true;
        await post.save();
        reportToAuthorities(post.author as any, reason);
        console.log(`Post ${postId} has been deleted due to Child Exploitation`);
        break;
  
      case "Sexual Content":
        post.isDeleted = true;
        await post.save();
        reportToAuthorities(post.author as any, reason);
        console.log(`Post ${postId} has been deleted due to Sexual Content`);
        break;
  
      case "Fake Account":
        post.isDeleted = true;
        await post.save();
        const fakeUser = await User.findById(post.author);
        if (fakeUser) {
          fakeUser.isSuspended = true;
          await fakeUser.save();
          console.log(`User ${fakeUser._id} has been suspended for creating a fake account`);
        }
        console.log(`Post ${postId} has been deleted due to Fake Account`);
        break;
  
      case "Self-Harm":
        post.isHidden = true;
        await post.save();
        notifyAuthorities(post.author as any, reason);
        console.log(`Post ${postId} has been hidden due to Self-Harm`);
        break;
  
      case "Graphic Content":
        post.isHidden = true;
        await post.save();
        sendWarningMessage(post.author, "Your post contains graphic content. It has been hidden.");
        console.log(`Post ${postId} has been hidden due to Graphic Content`);
        break;
  
      case "Infringement":
        post.isDeleted = true;
        await post.save();
        notifyUser(post.author as any, "Your post has been removed due to infringement of copyright.");
        console.log(`Post ${postId} has been deleted due to Infringement`);
        break;
  
      case "Illegal Goods and Services":
        post.isDeleted = true;
        await post.save();
        reportToAuthorities(post.author as any, reason);
        console.log(`Post ${postId} has been deleted due to Illegal Goods and Services`);
        break;
  
      default:
        console.log(`No specific action defined for reason: ${reason}`);
        break;
    }
  };
  
  const sendWarningMessage = async (user:any, message:string) => {
    console.log(`Sending warning to user ${user._id}: ${message}`);
    await sendFCMNotification(user._id, "Warning", message);
  };
  
  const sendClarificationRequest  = async (userId:string) => {
    const message = `Please provide clarification regarding your post.`;
    console.log(`Requesting clarification from user ${userId}`);
    await sendFCMNotification(userId, "Clarification Request", message);  
  };
  
  const notifyAuthorities = async (userId:string, reason:string) => {
    const message = `User ${userId} is reported for reason: ${reason}. Please review.`;
    console.log(`Notifying authorities about user ${userId} for reason: ${reason}`);
    await sendFCMNotification(userId, "Authorities Notification", message);
  };
  
  const reportToAuthorities = async (userId:string, reason:string) => {
    const message = `User ${userId} has been reported to authorities for ${reason}.`;
    console.log(`Reporting user ${userId} to authorities for ${reason}`);
    await sendFCMNotification(userId, "Legal Notification", message); 
  };
  
  const notifyUser = async (userId:string, message:string) => {
    console.log(`Notifying user ${userId}: ${message}`);
    await sendFCMNotification(userId, "Notification", message); 
  };

  
  export const getAllReports = async (_req: Request, res: Response) => {
    try {
      const reports = await Report.find().populate("userId", "firstName lastName").populate("postId", "content");
      res.status(200).json(reports);
    } catch (error) {
      console.error("Get All Reports Error:", error);
      res.status(500).json({ message: "An error occurred while fetching reports" });
    }
  };
  
  export const getReportById = async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params;
      const report = await Report.findById(reportId)
        .populate("postId", "title content author")
        .populate("userId", "firstName lastName");
  
      if (!report) return res.status(404).json({ message: "Report not found" });
  
      res.status(200).json(report);
    } catch (error) {
      console.error("Get Report By ID Error:", error);
      res.status(500).json({ message: "An error occurred while fetching the report" });
    }
  };
  
  export const getReportsByPostId = async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      const reports = await Report.find({ postId })
        .populate("userId", "firstName lastName");
  
      if (reports.length === 0) return res.status(404).json({ message: "No reports found for this post" });
  
      res.status(200).json(reports);
    } catch (error) {
      console.error("Get Reports By Post ID Error:", error);
      res.status(500).json({ message: "An error occurred while fetching reports for this post" });
    }
  };
  
  // Delete Report
  export const deleteReport = async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params;
      const report = await Report.findByIdAndDelete(reportId);
  
      if (!report) return res.status(404).json({ message: "Report not found" });
  
      res.status(200).json({ message: "Report deleted successfully" });
    } catch (error) {
      console.error("Delete Report Error:", error);
      res.status(500).json({ message: "An error occurred while deleting the report" });
    }
  };
  
  // Delete All Reports for a Post
  export const deleteReportsByPostId = async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      const result = await Report.deleteMany({ postId });
  
      if (result.deletedCount === 0) return res.status(404).json({ message: "No reports found for this post" });
  
      res.status(200).json({ message: "All reports for the post deleted successfully" });
    } catch (error) {
      console.error("Delete Reports By Post ID Error:", error);
      res.status(500).json({ message: "An error occurred while deleting reports for this post" });
    }
  };

export const reviewReport = async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params;
      const report = await Report.findById(reportId);
      
      if (!report) return res.status(404).json({ message: "Report not found" });
      
      report.status = "reviewed";
      await report.save();
      
      res.status(200).json({ message: "Report reviewed successfully", report });
    } catch (error) {
      console.error("Review Report Error:", error);
      res.status(500).json({ message: "An error occurred while reviewing the report" });
    }
  };
  
  export const resolveReport = async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params;
      const report = await Report.findById(reportId);
  
      if (!report) return res.status(404).json({ message: "Report not found" });
  
      report.status = "resolved";
      await report.save();
  
      res.status(200).json({ message: "Report resolved successfully", report });
    } catch (error) {
      console.error("Resolve Report Error:", error);
      res.status(500).json({ message: "An error occurred while resolving the report" });
    }
  };
  
  export const takeActionOnReportedPostManually = async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params;
      const { action } = req.body;
      
      const report = await Report.findById(reportId).populate("postId");
      if (!report) return res.status(404).json({ message: "Report not found" });
      
      const post = report.postId;
      if (!post) return res.status(404).json({ message: "Post not found" });
      const { reason } = report;
  
      if (action === "hide") {
        
        post.isHidden = true;
        await post.save();
        report.status = "resolved";
        await report.save();
        res.status(200).json({ message: "Post hidden successfully" });
      } else if (action === "delete") {
        await Post.findByIdAndDelete(post._id);
        report.status = "resolved";
        await report.save();
        res.status(200).json({ message: "Post deleted successfully" });
      } else if (action === "banUser" && ["Harassment", "Fraud", "Scam"].includes(reason)) {
        const user = post.author;  
        if (user) {
          user.isBanned = true; 
          await user.save();
          res.status(200).json({ message: "User banned due to report" });
        } else {
          res.status(404).json({ message: "User not found" });
        }
      } else if (action === "escalate" && reason === "Sexual Content") {
        // post.status = "escalated"; 
        await post.save();
        report.status = "escalated";
        await report.save();
        res.status(200).json({ message: "Post escalated for further review" });
      } else if (action === "escalate" && reason === "Child Exploitation") {
        // Special escalation for child exploitation
        // post.status = "escalated";
        await post.save();
        report.status = "escalated";
        await report.save();
        res.status(200).json({ message: "Post escalated for child exploitation review" });
      } else {
        res.status(400).json({ message: "Invalid action specified" });
      }
    } catch (error) {
      console.error("Take Action on Reported Post Error:", error);
      res.status(500).json({ message: "An error occurred while taking action on the reported post" });
    }
  };
  

  export const getVisiblePostsForUser = async (req: Request, res: Response) => {
    try {
      const userId = req.user;
  
      const hiddenPostIds = (await Report.find({ userId, isHidden: true })).map(report => report.postId);
  
      const visiblePosts = await Post.find({ _id: { $nin: hiddenPostIds } });
  
      res.status(200).json(visiblePosts);
    } catch (error) {
      console.error("Error fetching visible posts for user:", error);
      res.status(500).json({ message: "An error occurred while fetching posts" });
    }}
  
