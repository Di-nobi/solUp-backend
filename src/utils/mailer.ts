import { otpHtmlContent, resetPasswordHtmlContent, resetPasswordOtpHtmlContent } from "./emailContents";

const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USERNAME, // generated ethereal user
    pass: process.env.EMAIL_PASSWORD, // generated ethereal password
  },
});

export const sendOTPEmail = async (to: string, otp: string, email: string) => {
  const mailOptions = await transporter.sendMail({
    from: `${process.env.EMAIL_NAME} <${process.env.EMAIL_ADDRESS}>`,
    to: email,
    subject: "Your OTP Code",
    //text: `Your OTP code is ${otp}`,
    html: otpHtmlContent(otp),
  });
  console.log("Message sent: %s", mailOptions.messageId);

  return mailOptions;
}

export const sendPasswordResetOTPEmail = async (to: string, otp: string, email: string) => {
  const mailOptions = await transporter.sendMail({
    from: `${process.env.EMAIL_NAME} <${process.env.EMAIL_ADDRESS}>`,
    to: email,
    subject: "Your OTP Code",
    //text: `Your OTP code is ${otp}`,
    html: resetPasswordOtpHtmlContent(otp),
  });
  console.log("Message sent: %s", mailOptions.messageId);

  return mailOptions;
};

export const sendResetPasswordEmail = async (to: string, resetLink: string, email: string) => {
  const mailOptions = await transporter.sendMail({
    from: `${process.env.EMAIL_NAME} <${process.env.EMAIL_ADDRESS}>`,
    to: email,
    subject: "Reset Password Request",
    //text: `Your OTP code is ${otp}`,
    html: resetPasswordHtmlContent(resetLink),
  });
  console.log("Message sent: %s", mailOptions.messageId);

  // return transporter.sendMail(mailOptions);
  return mailOptions;
};
