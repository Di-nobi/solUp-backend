import { sendFCMNotification } from "../middlewares/fcm";
import User from "../models/UserData";
import { decoded } from "../utils/decodeJwt";
import { reportThresholds } from "../utils/reportConfig";
import Report from "../models/ReportData";
import { Request, Response } from "express";

type ReportReason = keyof typeof reportThresholds;


export const reportUser = async (req: Request, res: Response) => {
  try {
    const { reason, description } = req.body;
    const { reportedUserId } = req.params;
    console.log(reportedUserId)
    const user = decoded(req);
    const reportingUserId = user.userId; 

    const user1 = await User.findById(reportedUserId);
    if (!user1) return res.status(404).json({ message: "User not found" });
   
    const existingReport = await Report.findOne({
        reportedUserId,
        reportedBy: reportingUserId,
        reason
      });
    if (existingReport) {
      return res.status(400).json({ message: "You have already reported this post for this reason" });
    }
    const report = new Report({
        reportedBy: reportingUserId,       
      reportedUserId,                    
      reason,
      description,
      reportDate: new Date(),
      status: "pending"
    });

    await report.save();

    await checkAndTakeActionOnUser(reportedUserId, reason);

    res.status(200).json({ message: "User report submitted successfully." });
  } catch (error) {
    console.error("Error reporting user:", error);
    res.status(500).json({ message: "An error occurred while reporting the user." });
  }
};

export  const checkAndTakeActionOnUser = async (userId: any, reason: ReportReason) => {
   
    const reports = await Report.aggregate([
      { $match: { reportedUserId: userId, reason } },
      { $group: { _id: "$reason", count: { $sum: 1 } } }
    ]);

    if (reports.length > 0 && reports[0].count >= reportThresholds[reason]) {
      await takeActionOnReportedUser(userId, reason); 
    }
  };

  const takeActionOnReportedUser = async (userId: string, reason: string) => {
    const user = await User.findById(userId);
    if (!user) return;
  
    switch (reason) {
      case "Harassment":
      case "Hate Speech":
      case "Bullying":
      case "Offensive Language":
        await sendWarningMessage(userId, "Your account has been reported for inappropriate behavior. Further actions may follow if this continues.");
        console.log(`Warning sent to user ${userId} for ${reason}`);
        break;
      
      case "Fraud":
      case "Scam":
      case "Promoting Hate or Violence":
        user.isSuspended = true;
        await user.save();
        await sendFCMNotification(userId, "Account Suspended", "Your account has been suspended for violating platform policies.");
        console.log(`User ${userId} suspended due to ${reason}`);
        break;
  
      case "Spam":
      case "Misinformation":
      case "Toxic Behavior":
        await sendClarificationRequest(userId);
        console.log(`Clarification requested from user ${userId} for ${reason}`);
        break;
  
      case "Threat":
      case "Violence":
      case "Dangerous Challenges":
      case "Adult Content":
        user.isSuspended = true;
        await user.save();
        await notifyAuthorities(userId, reason);
        console.log(`User ${userId} suspended and authorities notified due to ${reason}`);
        break;
  
      case "Child Exploitation":
      case "Illegal Goods and Services":
      case "Terrorism/Extremism":
      case "Malware/Phishing Link":
        await reportToAuthorities(userId, reason);
        console.log(`User ${userId} reported to authorities for ${reason}`);
        break;
  
      case "Fake Account":
      case "Impersonation":
      case "Copyright Violation":
        await notifyUser(userId, "Your account has been flagged for review. Please contact support.");
        console.log(`User ${userId} notified for potential account issues due to ${reason}`);
        break;
  
      case "Self-Harm":
        await sendFCMNotification(userId, "Support Available", "If you need help, please contact support or reach out to someone you trust.");
        console.log(`Support message sent to user ${userId} for ${reason}`);
        break;
  
      case "Graphic Content":
      case "Infringement":
      case "Discrimination":
        await sendWarningMessage(userId, "Your content has been reported for violating platform standards.");
        console.log(`Warning sent to user ${userId} for ${reason}`);
        break;
  
      default:
        console.log(`No automated action defined for this report reason: ${reason}`);
    }
  };
  
  
  const sendWarningMessage = async (userId: string, message: string) => {
    await sendFCMNotification(userId, "Warning", message);
  };
  
  const reportToAuthorities = async (userId: string, reason: string) => {
    const message = `User ${userId} reported for serious offense: ${reason}. Immediate review required.`;
    await sendFCMNotification(userId, "Authorities Notification", message);
  };

  const notifyAuthorities = async (userId: string, reason: string) => {
    const message = `User ${userId} reported for serious offense: ${reason}. Immediate review required.`;

    await sendFCMNotification(userId, "Authorities Notification", message);
    console.log(`Authorities notified about user ${userId} for reason: ${reason}`);
  };
  
  const notifyUser = async (userId: string, message: string) => {
    const user = await User.findById(userId);
    if (user) {
      await sendFCMNotification(userId, "Notification", message);
      console.log(`Notified user ${userId}: ${message}`);
    } else {
      console.log(`User ${userId} not found for notification`);
    }
  };

  const sendClarificationRequest = async (userId: string) => {
    const message = `We require further clarification regarding your reported behavior. Please provide additional information to avoid further actions.`;
    await sendFCMNotification(userId, "Clarification Request", message);
    console.log(`Clarification request sent to user ${userId}`);
  };