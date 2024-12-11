import { body } from "express-validator";

// Validation middleware
export const validateCreateJobPosting = [
    body('role')
      .notEmpty()
      .withMessage('Role is required.')
      .isString()
      .withMessage('Role must be a string.'),
  
    body('company')
      .notEmpty()
      .withMessage('Company name is required.')
      .isString()
      .withMessage('Company name must be a string.'),
  
    body('state')
      .notEmpty()
      .withMessage('State is required.')
      .isString()
      .withMessage('State must be a string.'),
  
    body('country')
      .notEmpty()
      .withMessage('Country is required.')
      .isString()
      .withMessage('Country must be a string.'),
  
    body('workplaceType')
      .notEmpty()
      .withMessage('Workplace type is required.')
      .isIn(['remote', 'hybrid', 'on-site'])
      .withMessage('Workplace type must be one of: remote, hybrid, on-site.'),
  
    body('jobType')
      .notEmpty()
      .withMessage('Job type is required.')
      .isIn(['full-time', 'part-time', 'contract'])
      .withMessage('Job type must be one of: full-time, part-time, contract.'),
  
    body('jobDescription')
      .notEmpty()
      .withMessage('Job description is required.')
      .isString()
      .withMessage('Job description must be a string.'),
  
    body('skills')
      .isArray({ min: 1 })
      .withMessage('Skills must be a non-empty array of strings.')
      .custom((skills) => skills.every((skill: any) => typeof skill === 'string'))
      .withMessage('Each skill must be a string.'),
  
    body('degree')
      .isArray({ min: 1 })
      .withMessage('Degree must be a non-empty array of strings.')
      .custom((degrees) => degrees.every((degree: any) => typeof degree === 'string'))
      .withMessage('Each degree must be a string.'),
  
    body('yearsOfExperience')
      .notEmpty()
      .withMessage('Years of experience is required.')
      .isInt({ min: 0 })
      .withMessage('Years of experience must be a non-negative integer.'),
  
    body('email')
      .notEmpty()
      .withMessage('Email is required.')
      .isEmail()
      .withMessage('Email must be valid.'),
  
    body('salaryFloorPrice')
      .notEmpty()
      .withMessage('Salary floor price is required.')
      .isFloat({ min: 0 })
      .withMessage('Salary floor price must be a non-negative number.'),
  
    body('salaryCeilingPrice')
      .notEmpty()
      .withMessage('Salary ceiling price is required.')
      .isFloat({ min: 0 })
      .withMessage('Salary ceiling price must be a non-negative number.'),
  
    body('responsibilities')
      .notEmpty()
      .withMessage('Responsibilities are required.')
      .isString()
      .withMessage('Responsibilities must be a string.'),
  
    body('mustHave')
      .optional()
      .isString()
      .withMessage('Must-have must be a string.'),
  
    body('perksBenefits')
      .optional()
      .isString()
      .withMessage('Perks & benefits must be a string.'),
  ];


// Validator middleware to check the status field
export const validateUpdateStatus = [
    body('status')
      .isIn(['Accepted', 'Rejected', 'Under Review'])
      .withMessage('Status must be one of the following: Accepted, Rejected, Under Review')]