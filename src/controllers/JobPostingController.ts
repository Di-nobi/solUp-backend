import express, { Request, Response } from 'express';
import { JobPosting } from '../models/JobPostingData';
import { decoded } from '../utils/decodeJwt';
import mongoose from 'mongoose';
import User from '../models/UserData';
import { sendFCMNotification } from '../middlewares/fcm';
import NotificationData from '../models/NotificationData';
import JobApplication from '../models/JobApplicationData';
import { populate } from 'dotenv';

// Controller for creating a job posting
export const createJobPosting = async (req: Request, res: Response) => {
    const {
      role, company, location, workplaceType, jobType, jobDescription, skills,
      degree, yearsOfExperience, email, salaryFloorPrice, salaryCeilingPrice,
      responsibilities, mustHave, perksBenefits
    } = req.body;
    const logo = (req.files as { [fieldname: string]: Express.MulterS3.File[] })?.['logo']?.[0]?.location || "";
  
    // Validate request data here if needed
    const userId = decoded(req).userId; // Assuming the user ID is available in req.user

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
    try {
      const jobPosting = new JobPosting({
        logo,
        role,
        company,
        location,
        workplaceType,
        jobType,
        jobDescription,
        skills,
        degree,
        yearsOfExperience,
        email,
        salaryFloorPrice,
        salaryCeilingPrice,
        responsibilities,
        mustHave,
        perksBenefits,
        createdBy: new mongoose.Types.ObjectId(userId) // Add the poster's ID

      });
      jobPosting.shareLink = `${process.env.BASE_URL}/job/${jobPosting._id}`;
      await jobPosting.save();
      res.status(201).json(jobPosting);
    } catch (error) {
      res.status(500).json({ message: 'Something went wrong', error });
    }
  };

  export const editJobPosting = async (req: Request, res: Response) => {
    try {
      const userId = decoded(req).userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const { jobId } = req.params;
      if (!jobId) {
        return res.status(400).json({ message: 'Invalid job ID' });
      }
      const verifyJob = await JobPosting.findById(jobId);
      if (!verifyJob) {
        return res.status(404).json({ message: 'Job posting not found' });
      }
      if (verifyJob.createdBy.toString()!== userId) {
        return res.status(403).json({ message: 'Unauthorized to edit this job posting' });
      }
      const jobPosting = await JobPosting.findByIdAndUpdate(
        jobId,
        req.body,
        { new: true }
      );
      if (!jobPosting) {
        return res.status(404).json({ message: 'Job posting not found' });
      }
      res.status(200).json(jobPosting);
    } catch (err) {
      return res.status(500).json({ message: 'Something went wrong', err });
    }
  }

  export const getFilteredJobPostings = async (req: Request, res: Response) => {

    try {
        // Extract query parameters
        const {
          role,
          company,
          state,
          country,
          workplaceType,
          jobType,
          skills,
          degree,
          minYearsOfExperience,
          maxYearsOfExperience,
          minSalary,
          maxSalary,
        } = req.query;
    
        // Construct filter object
        const filters: any = {};
    
        if (role) {
          filters.role = { $regex: new RegExp(role as string, 'i') }; // case-insensitive
        }
        if (company) {
          filters.company = { $regex: new RegExp(company as string, 'i') };
        }
        if (state) {
          filters.state = { $regex: new RegExp(state as string, 'i') };
        }
        if (country) {
          filters.country = { $regex: new RegExp(country as string, 'i') };
        }
        if (workplaceType) {
          filters.workplaceType = workplaceType;
        }
        if (jobType) {
          filters.jobType = jobType;
        }
        if (skills) {
          filters.skills = { $in: (skills as string).split(',') }; // skills as an array
        }
        if (degree) {
          filters.degree = { $in: (degree as string).split(',') };
        }
        if (minYearsOfExperience) {
          filters.yearsOfExperience = { $gte: parseInt(minYearsOfExperience as string, 10) };
        }
        if (maxYearsOfExperience) {
          filters.yearsOfExperience = filters.yearsOfExperience || {};
          filters.yearsOfExperience.$lte = parseInt(maxYearsOfExperience as string, 10);
        }
        if (minSalary) {
          filters.salaryFloorPrice = { $gte: parseInt(minSalary as string, 10) };
        }
        if (maxSalary) {
          filters.salaryCeilingPrice = { $lte: parseInt(maxSalary as string, 10) };
        }
    
        // Fetch job postings based on filters
        const jobPostings = await JobPosting.find(filters).sort({ createdAt: -1 });
    
        res.status(200).json(jobPostings);
      } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
      }
  };

  export const deleteJobPosting = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = decoded(req).userId; // Assume req.user is populated by your authentication middleware
  
      // Check if ID is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid Job ID' });
      }
  
      // Find the job posting by ID
      const jobPosting = await JobPosting.findById(id);
  
      if (!jobPosting) {
        return res.status(404).json({ message: 'Job posting not found' });
      }
      
      // Check if the user is authorized to delete the job posting
      if (jobPosting.createdBy.toString() !== userId) {
        return res.status(403).json({ message: 'You do not have permission to delete this job posting' });
      }
      
  
      // Delete the job posting
      await JobPosting.findByIdAndDelete(id);
  
      res.status(200).json({ message: 'Job posting deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Something went wrong', error });
    }
  };

  export const applyForJob = async (req: Request, res: Response) => {
    const resume = req.file ? req.file.path : null;
    const { linkedin, portfolio, email, countryCode, phoneNumber } = req.body;
    const jobId  = req.params.jobId;
    const applicantId = decoded(req).userId; // Assuming the user ID is available in req.user

    if (!email || !countryCode || !phoneNumber) {
      return res.status(400).json({ message: 'Email, country code, and phone number are required' });
    }

    if (!applicantId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  
    try {
      // Check if the job exists
      const jobPosting = await JobPosting.findById(jobId);
      if (!jobPosting) {
        return res.status(404).json({ message: 'Job posting not found' });
      }
  
      // Ensure the user isn't applying to their own job posting
      if (jobPosting.createdBy.toString() === applicantId) {
        return res.status(400).json({ message: 'You cannot apply to your own job posting' });
      }
       // Check if the user has already applied for the same job
    const existingApplication = await JobApplication.findOne({
        jobId,
        applicantId
      });
  
      if (existingApplication) {
        return res.status(400).json({ message: 'You have already applied for this job' });
      }
  
      // Create a new job application
      const jobApplication = new JobApplication({
        jobId,
        applicantId,
        email,
        countryCode,
        phoneNumber,
        resume,
        linkedin,
        portfolio
      });
      jobApplication.applied = true;
      await jobApplication.save();

      const newNotification = new NotificationData({
        recipientId: jobPosting.createdBy,
        senderId: applicantId,
        type: 'job_application',
        message: `${applicantId} applied for your job posting`,
      });
      await newNotification.save();

      // emitNotification(jobPosting.createdBy.toString(), { // Convert ObjectId to string
      //   type: 'job_application',
      //   message: `${applicantId} applied for your job posting`,
      //   senderId: applicantId,
      // });
      const recipient = await User.findById(jobPosting.createdBy.toString());
        if (recipient && recipient.fcmToken) {
          // Send notification
          await sendFCMNotification(recipient.fcmToken, 'Pepoz', `You just got a new application`);
        }
      res.status(201).json({ message: 'Application submitted successfully', jobApplication });
    } catch (error) {
      res.status(500).json({ message: 'Something went wrong', error });
    }
  };

  export const getUserPostedJobs = async (req: Request, res: Response) => {
    try {
      // Assuming the user ID is available in req.user (populated by your authentication middleware)
      const baseUrl = process.env.BASE_URL;
      const uploadDir: any = process.env.UPLOAD_DIR;
      const userId = decoded(req).userId;
  
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const skip = (page - 1) * limit;

      const totaljobPosts = await JobPosting.countDocuments({ createdBy: userId });
      // Find all job postings created by the logged-in user
      const jobPostings = await JobPosting.find({ createdBy: userId }).populate({
        path: 'createdBy',
        select: 'firstName lastName email', // Adjust fields as needed
      }).sort({ createdAt: -1 }).skip(skip).limit(limit); // Sort by creation date if needed

      const getJobPostings = await Promise.all(jobPostings.map(async (path) => {
        const logoUrl = path.logo
                ? `${baseUrl}/uploads${path.logo.replace(uploadDir, '')}`
                : null;
        const applicantCount = await JobApplication.countDocuments({ jobId: path._id });
        return {
          _id: path._id,
          firstName: path.createdBy.firstName,
          lastName: path.createdBy.lastName,
          email: path.createdBy.email,
          role: path.role,
          company: path.company,
          location: path.location,
          jobType: path.jobType,
          salaryFloorPrice: path.salaryFloorPrice,
          salaryCeilingPrice: path.salaryCeilingPrice,
          skills: path.skills,
          jobDescription: path.jobDescription,
          responsibilities: path.responsibilities,
          mustHave: path.mustHave,
          perksBenefits: path.perksBenefits,
          // applied: path.applied,
          logo: logoUrl,
          applicantCount: applicantCount
        }
      }));
      res.status(200).json({
        currentPage: page,
        totalPages: Math.ceil(totaljobPosts / limit),
        getJobPostings
      });
    } catch (error) {
      const errorMessage = (error instanceof Error) ? error.message : 'Unknown error';
      return res.status(500).json({message: 'An error occured at ' + errorMessage});
    }
  };

  export const closeJobPosting = async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const userId = decoded(req).userId;

      console.log(jobId);
      if (!jobId) {
        return res.status(404).json({message: 'Job not found'});
      }

      const jobPosting = await JobPosting.findById(jobId);
      if (!jobPosting) {
        return res.status(404).json({ message: 'Job posting not found' });
      }
  
      // Check if the user is authorized to close the job posting
      if (jobPosting.createdBy.toString() !== userId) {
        return res.status(403).json({ message: 'You do not have permission to close this job posting' });
      }
  
      // Close the job posting
      jobPosting.closed = true;
      await jobPosting.save();
  
      res.status(200).json({ message: 'Job posting closed successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Something went wrong', error });
    }
  }

  export const searchJobById = async (req: Request, res: Response) => {
    const baseUrl = process.env.BASE_URL;
    const uploadDir: any = process.env.UPLOAD_DIR;
    const jobId = req.params.jobId;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const skip = (page - 1) * limit;
    try {
      // Find the job posting by ID
      const jobPosting = await JobPosting.findById(jobId).populate({
        path: 'createdBy', // Assuming you have a reference to the user who created the job posting
        model: 'UserData',
        select: 'firstName lastName profilePicture jobTitle', // Adjust fields as needed
      }).skip(skip).limit(limit).lean();
  
      if (!jobPosting) {
        return res.status(404).json({ message: 'Job posting not found' });
      }

      const getJobPosts = {
        firstName: jobPosting.createdBy.firstName,
        lastName: jobPosting.createdBy.lastName,
        profilePicture: jobPosting.createdBy.profilePicture || null,
        jobTitle: jobPosting.createdBy.jobTitle

      }
      return res.status(200).json(getJobPosts);
    } catch (error) {
      res.status(500).json({ message: 'Something went wrong', error });
    }
  };

  export const getApplicantsForJob = async (req: Request, res: Response) => {

    const baseUrl = process.env.BASE_URL;
    const uploadDir: any = process.env.UPLOAD_DIR;
    const jobId = req.params.jobId;
    const userId = decoded(req).userId; // Assuming you have a function to decode user info
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const skip = (page - 1) * limit;

    try {
      // Find the job posting by ID
      const jobPosting = await JobPosting.findById(jobId);
  
      if (!jobPosting) {
        return res.status(404).json({ message: 'Job posting not found' });
      }
  
      // Check if the user making the request is the job creator
      if (jobPosting.createdBy.toString() !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const totalApplications = await JobApplication.countDocuments({ jobId }).exec();
      // Find all applications for the job posting
      const myapplications = await JobApplication.find({ jobId }).populate({
        path: 'applicantId', // Assuming you have a reference to the applicant user
        select: 'firstName lastName profilePicture jobTitle ', // Adjust fields as needed
      }).skip(skip).limit(limit);

      if (!myapplications || myapplications.length === 0) {
        return res.status(404).json({ message: 'No applicants found' });
      }

      const applications = myapplications.map(path => {
        return {
          _id: path.applicantId._id,
          firstName: path.applicantId.firstName,
          lastName: path.applicantId.lastName,
          jobTitle: path.applicantId.jobTitle,
          profilePicture: path.applicantId.profilePicture || null,
        resume: path.resume || null,
        }

      });

      return res.status(200).json({
        currentPage: page,
        totalPages: Math.ceil(totalApplications / limit),
        totalApplications,
        applications
      });
    } catch (error) {
      res.status(500).json({ message: 'Something went wrong', error });
    }
  };

  export const updateApplicationStatus = async (req: Request, res: Response) => {
    const { jobId, applicantId } = req.params;
    const { status } = req.body; // e.g., "Accepted", "Rejected", "Under Review"
    const userId = decoded(req).userId; // Assuming you have a function to decode user info
  
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
  
    try {
      // Find the job posting by ID
      const jobPosting = await JobPosting.findById(jobId);
  
      if (!jobPosting) {
        return res.status(404).json({ message: 'Job posting not found' });
      }
  
      // Check if the user making the request is the job creator
      if (jobPosting.createdBy.toString() !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
  
      // Find the job application
      const jobApplication = await JobApplication.findOne({ jobId, applicantId });
  
      if (!jobApplication) {
        return res.status(404).json({ message: 'Job application not found' });
      }
  
      // Update the application status
      jobApplication.status = status;
      await jobApplication.save();
  
    //   // Create a notification for the applicant
    //   const notification = new Notification({
    //     userId: applicantId,
    //     message: `Your application for the job "${jobPosting.role}" has been updated to "${status}".`,
    //     createdAt: new Date()
    //   });
  
    //   await notification.save();
  
    //   // Send notification (e.g., via email or other means)
    //   await sendNotification(applicantId, notification.message);
  
      res.status(200).json({ message: 'Application status updated and notification sent', jobApplication });
    } catch (error) {
      res.status(500).json({ message: 'Something went wrong', error });
    }
  };

  export const viewMyApplications = async (req: Request, res: Response) => {
    try {        
      const userId = decoded(req).userId; // Assuming the user ID is available in req.userId after authentication
  
      // Find job applications for the logged-in user
      const applications = await JobApplication.find({ applicantId: userId }).populate({
        path: 'jobId', // Assuming jobId is a reference to the JobPosting model
        select: 'role company jobDescription', // Select fields from the JobPosting model to include
      });
  
      res.status(200).json(applications);
    } catch (error) {
      res.status(500).json({ message: 'Something went wrong', error });
    }
  };

  export const getJobByLink = async (req: Request, res: Response) => {
    try {
      const baseUrl = process.env.BASE_URL;
      const uploadDir: any = process.env.UPLOAD_DIR;
      const userId = decoded(req).userId;
      if (!userId) {
        res.status(400).json({message: 'Unauthorized access'});
      }
      const { jobId } = req.params;
      if (!jobId) {
        return res.status(400).json({message: 'Invalid job id'});
      }

      const totalApplications = await JobApplication.countDocuments({ jobId }).exec();
      const jobPosting: any = await JobPosting.findById(jobId);
      if (jobPosting.closed == true) {
        return res.status(404).json({ message: 'Job is currently closed'});
      }
      const isCreator = userId.toString() === jobPosting.createdBy.toString();
      const getJobDetails = {
        _id: jobPosting._id,
        logo: jobPosting.logo || null,
        role: jobPosting.role,
        company: jobPosting.company,
        location: jobPosting.location,
        createdAt: jobPosting.createdAt,
        workplaceType: jobPosting.workplaceType,
        jobType: jobPosting.jobType,
        salaryFloorPrice: jobPosting.salaryFloorPrice,
        salaryCeilingPrice: jobPosting.salaryCeilingPrice,
        skills: jobPosting.skills,
        jobDescription: jobPosting.jobDescription,
        responsibilities: jobPosting.responsibilities,
        mustHave: jobPosting.mustHave,
        perksBenefits: jobPosting.perksBenefits,
        applicantCount: totalApplications,
        shareLink: jobPosting.shareLink,
        isPoster: isCreator ? true : false
      }
      return res.status(200).json(getJobDetails);
    } catch (err) {
      return res.status(500).json({ message: 'Something went wrong', err});
    }
  }
  
  export const getJobDescription = async (req: Request, res: Response) => {
    try {

      const baseUrl = process.env.BASE_URL;
      const uploadDir: any = process.env.UPLOAD_DIR;
      const userId = decoded(req).userId;
      if (!userId) {
        return res.status(400).json({message: 'Invalid access'});
      }
      const { jobId } = req.params;
      if (!jobId) {
        return res.status(400).json({message: 'Invalid job id'});
      }

      const totalApplications = await JobApplication.countDocuments({ jobId }).exec();
      const jobPosting = await JobPosting.findById(jobId);
      if (!jobPosting) {
        return res.status(404).json({ message: 'Job not found'});
      }
      const isCreator = userId.toString() === jobPosting.createdBy.toString();
      const getJobDetails = {
        _id: jobPosting._id,
        logo: jobPosting.logo  || null,
        role: jobPosting.role,
        company: jobPosting.company,
        location: jobPosting.location,
        createdAt: jobPosting.createdAt,
        workplaceType: jobPosting.workplaceType,
        jobType: jobPosting.jobType,
        salaryFloorPrice: jobPosting.salaryFloorPrice,
        salaryCeilingPrice: jobPosting.salaryCeilingPrice,
        skills: jobPosting.skills,
        jobDescription: jobPosting.jobDescription,
        responsibilities: jobPosting.responsibilities,
        mustHave: jobPosting.mustHave,
        perksBenefits: jobPosting.perksBenefits,
        applicantCount: totalApplications,
        shareLink: jobPosting.shareLink,
        isPoster: isCreator ? true : false
      }
      return res.status(200).json(getJobDetails);
    } catch(error) {
      return res.status(500).json({ message: 'Something went wrong', error});
    }
  }

  export const getAppliedJobs = async (req: Request, res: Response) => {
    try {
      const baseUrl = process.env.BASE_URL;
      const uploadDir: any = process.env.UPLOAD_DIR;
      const userId = decoded(req).userId;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const skip = (page - 1) * limit;
      if (!userId) {
        return res.status(400).json({message: 'Invalid access'});
      }
      const totalJobs = await JobApplication.countDocuments({ applicantId: userId, applied: true }).exec();
      const getJobs = await JobApplication.find({ applicantId: userId, applied: true, }).skip(skip).limit(limit)
      .populate({
        path: 'jobId',
        select: 'logo role company'
      });
      if (!getJobs) {
        return res.status(400).json({message: 'Application not found'});
      }
      const jobs = getJobs.map(path => {
        const jobPosting = path.jobId;
        return {
          _id: jobPosting._id,
          logo: jobPosting.logo || null,
          role: jobPosting.role,
          company: jobPosting.company,
          status: 'Applied',
        }
      });
      return res.status(200).json({
        currentPage: page,
        totalJobs: Math.ceil(totalJobs / limit),
        jobs
      });
    } catch (err) {
      return res.status(500).json({error: 'An error occured at ', err});
    }
  }