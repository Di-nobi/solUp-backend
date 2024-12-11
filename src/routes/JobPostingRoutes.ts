import { Router } from "express";
import { applyForJob, createJobPosting, deleteJobPosting, getApplicantsForJob, getJobDescription, closeJobPosting, getAppliedJobs,
     getUserPostedJobs, searchJobById, updateApplicationStatus, viewMyApplications } from "../controllers/JobPostingController";
import { validateCreateJobPosting } from "../middlewares/JobPostingValidators";
import { isAuthenticated } from "../middlewares/AuthValidate";
import { fileUpload } from "../middlewares/FileUploads";
import { logoUpload } from "../middlewares/CompanyLogoUpload";
import { fileUploadErrorHandler } from "../middlewares/FileUploadValidator";
import { getMatchingJobs, clearSearchHistory, getSearchJobResults, getSearchHistory } from "../controllers/SearchHistoryController";

const router = Router();

router.post('/create-job', isAuthenticated, validateCreateJobPosting, logoUpload, createJobPosting);
router.get('/', getMatchingJobs);
router.delete('/clear-search-history', isAuthenticated, clearSearchHistory);
router.get('/get-searched-jobs', isAuthenticated, getSearchJobResults);
router.get('/search-history', isAuthenticated, getSearchHistory);
// Route to view all job applications for the logged-in user
router.get('/my-applications', isAuthenticated, getAppliedJobs);
router.patch('/close-job/:jobId', isAuthenticated, closeJobPosting);
router.get('/job-description/:jobId', isAuthenticated, getJobDescription);
router.delete('/delete-job/:id', isAuthenticated, deleteJobPosting);
router.post('/apply/:jobId', isAuthenticated,
    fileUpload,
    fileUploadErrorHandler,
    applyForJob);
    router.get('/my-postings', isAuthenticated, getUserPostedJobs);
    // Route to search for a job by ID
router.get('/search/:jobId', searchJobById);
router.get('/:jobId/applicants', isAuthenticated, getApplicantsForJob);
// Route to update the status of a job application
router.patch('/:jobId/applicants/:applicantId/status', isAuthenticated, updateApplicationStatus);






export default router;
