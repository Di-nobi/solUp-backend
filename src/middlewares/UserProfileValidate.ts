import { body } from "express-validator";


export const schoolValidationRules = [
  body("schoolName").notEmpty().withMessage("School name is required"),
  body("degree")
    .isIn(["Bachelors", "Masters", "Doctorate", "Diploma", "Other"])
    .withMessage(
      "Degree must be one of Bachelors, Masters, Doctorate, Diploma, or Other"
    )
    .notEmpty()
    .withMessage("Degree is required"),
  body("fieldOfStudy").notEmpty().withMessage("Field of study is required"),
  body("startDate").isDate().withMessage("Start date is required"),
  // Optional fields
  body("endDate").optional().isDate().withMessage("End date must be a date"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),
];

export const workExperienceValidationRules = [
  body("companyName").notEmpty().withMessage("Company name is required"),
  body("jobTitle").notEmpty().withMessage("Job title is required"),
  body("startDate").isDate().withMessage("Start date is required"),
  // Optional fields
  body("endDate").optional().isDate().withMessage("End date must be a date"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),
];


export const updateUserValidationRules = [
  body('firstName').optional().isString().withMessage('First name must be a string'),
  body('lastName').optional().isString().withMessage('Last name must be a string'),
  body('city').optional().isString().withMessage('City must be a string'),
  body('state').optional().isString().withMessage('State must be a string'),
  body('country').optional().isString().withMessage('Country must be a string'),
  body('showLocationInProfile').optional().isBoolean().withMessage('Show location in profile must be a boolean'),
  body('contactNumber').optional().isString().withMessage('Contact number must be a string'),
  body('dateOfBirth').optional().isDate().withMessage('Date of birth must be a valid date'),
  body('onlyYouCanSeeDOB').optional().isBoolean().withMessage('Only you can see DOB must be a boolean'),
  body('customLink').optional().isString().withMessage('Custom link must be a string'),
  body('showLinkInProfile').optional().isBoolean().withMessage('Show link in profile must be a boolean'),
  body('bio').optional().isString().withMessage('Bio must be a string'),
  body('jobTitle').optional().isString().withMessage('Job title must be a string'),
  body('industry').optional().isString().withMessage('Industry must be a string'),
  body('interests').optional().isArray().withMessage('Interests must be an array of strings'),
];

