// validators/authValidators.ts
import { body } from "express-validator";




export const registerValidationRules = [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .notEmpty()
    .withMessage("Email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .notEmpty()
    .withMessage("Password is required"),
  body("first_name").notEmpty().withMessage("First name is required"),
  body("last_name").notEmpty().withMessage("Last name is required"),
  body("age")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Age must be a positive integer"),
  body("address").optional().isString().withMessage("Address must be a string"),
];

export const loginValidationRules = [
  body("email")
    .isEmail()
    .withMessage("Please enter valid email address")
    .notEmpty()
    .withMessage("Email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const OTPValidationRules = [
  body("email").isEmail().withMessage("Enter valid email"),
  body("email").notEmpty().withMessage("Email is required"),
  body("otp").not().isEmpty().withMessage("OTP is required"),
];
export const forgotPasswordValidationRules = [
  body("email").isEmail().withMessage("Enter valid email"),
  body("email").notEmpty().withMessage("Email is required"),
];

export const resetPasswordValidationRules = [
  body("email").isEmail().withMessage("Enter valid email"),
  body("email").notEmpty().withMessage("Email is required"),
  body("otp").notEmpty().withMessage("OTP is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .notEmpty()
    .withMessage("Password is required"),
];
