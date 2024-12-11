import express, { Request, Response } from 'express';
import { JobPosting } from '../models/JobPostingData';
import { decoded } from '../utils/decodeJwt';
import User, { IUser } from '../models/UserData';
import SearchHistory from '../models/SearchHistoryData';
import JobApplication from '../models/JobApplicationData';

export const getSearchJobResults = async (req: Request, res: Response) => {
    try {
        const baseUrl = process.env.BASE_URL;
        const uploadDir: any = process.env.UPLOAD_DIR;
        const userId = decoded(req).userId;
        if (!userId) {
            return res.status(400).json({message: 'Invalid access'})
        }
        const { job, location } = req.query;

        if (!job || !location) {
            return res.status(400).json({message: 'Job and location are required'});
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({message: 'User not found'});
        }
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        const skip = (page - 1) * limit;
        
        // Save search results
        const searchResults = new SearchHistory({
            jobName: job,
            location: location,
            userId
        });
        await searchResults.save();

        const totalJobResults = await JobPosting.countDocuments({
            ...(job ? { role: { $regex: job, $options: 'i' } } : {}),
            ...(location ? { location: { $regex: location, $options: 'i' } } : {}),
            closed: false
          });

        const getResults = await JobPosting.find({ ...(job ? { role: { $regex: job, $options: 'i' } } : {}),
        ...(location ? { location: { $regex: location, $options: 'i' } } : {}), closed: false}).sort({ createdAt: -1})
        .skip(skip).limit(limit);
        
        if (!getResults) {
            return res.status(404).json({message: 'No jobs found for the specified search criteria'});
        }

        const getResult = await Promise.all(getResults.map(async (job) => {
            const logoUrl = job.logo || null;
            const applicantCount = await JobApplication.countDocuments({ jobId: job._id });
            return {
                _id: job._id,
                logo: logoUrl,
                role: job.role,
                company: job.company,
                location: job.location,
                jobType: job.jobType,
                workplaceType: job.workplaceType,
                salaryFloorPrice: job.salaryFloorPrice,
                salaryCeilingPrice: job.salaryCeilingPrice,
                applicantCount: applicantCount,
                createdBy: job.createdBy,
            }
        }));
        return res.status(200).json({
            currentPage: page,
            totalPages: Math.ceil(totalJobResults / limit),
            NumberOfJob: getResults.length,
            getResult
        })
    } catch (error) {
        return res.status(500).json({message: 'An error occured at ', error })
    }
}

export const getSearchHistory = async (req: Request, res: Response) => {
    try {
        const userId = decoded(req).userId;
        if (!userId) {
            return res.status(400).json({mesage: 'Invalid access'});
        }
        const getSearchHistory = await SearchHistory.find({ userId }).sort({ createdAt: -1 });
        if (!getSearchHistory) {
            return res.status(400).json({message: 'Search history not found'});
        }
        const getHistory = getSearchHistory.map((history) => {
            return {
                _id: history._id,
                jobName: history.jobName,
                location: history.location,
            }
        });
        return res.status(200).json(getHistory);
    } catch (error) {
        return res.status(500).json({message: error})
    }
}

export const clearSearchHistory = async (req: Request, res: Response) => {
    try {
        const userId = decoded(req).userId;
        if (!userId) {
            return res.status(400).json({message: 'Invalid access'}); 
        }
        
        const rmSearchHistory = await SearchHistory.deleteMany({ userId });
        if (!rmSearchHistory) {
            return res.status(400).json({message: 'Search history not found'});
        }
        return res.status(200).json({message: 'Search history cleared'});
    } catch (error) {
        return res.status(500).json({message: 'An error occured at ', error});
    }
}

export const getMatchingJobs = async (req: Request, res: Response) => {
    try {

        const baseUrl = process.env.BASE_URL;
        const uploadDir: any = process.env.UPLOAD_DIR;
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        const skip = (page - 1) * limit;

        const userId = decoded(req).userId;
        if (!userId) {
            return res.status(400).json({message: 'Invalid access'});
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({message: 'User not found'});
        }
        // const  jobTitle: any = user?.jobTitle;
        // const searchHistory = await SearchHistory.find({ userId });
        // const searchTerms = searchHistory?.map((search) => search.jobName);

        // const searchCriteria = [
        //     { role: { $regex: new RegExp(jobTitle, 'i') } }
        //   ];

        //   if (searchTerms.length > 0) {
        //     searchTerms.forEach((term) => {
        //       searchCriteria.push({ role: { $regex: new RegExp(term, 'i') } });
        //     });
        //   }
      
          // Count the total matching jobs
          const totalMatchingJobs = await JobPosting.countDocuments({
            // $or: searchCriteria,
            closed: false
          });
      
          // Fetch the paginated matching jobs
          const matchingJobs = await JobPosting.find({
            closed: false
          })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const getMatchingJobs = await Promise.all(matchingJobs.map(async (job) => {

            const logoUrl = job.logo || null;
            const applicantCount = await JobApplication.countDocuments({ jobId: job._id });
            return {
                _id: job._id,
                logo: logoUrl,
                role: job.role,
                company: job.company,
                location: job.location,
                jobType: job.jobType,
                workplaceType: job.workplaceType,
                salaryFloorPrice: job.salaryFloorPrice,
                salaryCeilingPrice: job.salaryCeilingPrice,
                applicantCount: applicantCount,
                createdBy: job.createdBy
            }
        }));
        return res.status(200).json({
            currentPage: page,
            totalPages: Math.ceil(totalMatchingJobs / limit),
            getMatchingJobs
        });
    } catch (error) {
        const errorMessage = (error instanceof Error) ? error.message : 'Unknown error';
        return res.status(500).json({message: 'An error occured at ' + errorMessage});
    }
}