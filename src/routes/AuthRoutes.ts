import { Router } from "express";
import {
  register,
  login,
  forgotPassword,
  googleSignIn,
  verifyOTP,
  resetPassword,
  verifyResetOtp
} from "../controllers/AuthControllers";
import {
  OTPValidationRules,
  forgotPasswordValidationRules,
  loginValidationRules,
  registerValidationRules,
  resetPasswordValidationRules,
} from "../middlewares/authValidators";
import passport from "passport";
import { validate } from "../middlewares/Validate";

const router = Router();

router.get(
  "/google-signin",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    if (req.user) {
      const { user, token } = req.user as any;
      res.json({ user, token });
    } else {
      res.status(401).json({ message: "Authentication failed" });
    }
  }
);
router.post("/register", registerValidationRules, validate, register);
router.post("/verify-otp", OTPValidationRules, validate, verifyOTP);
router.post("/login", loginValidationRules, validate, login);
router.post(
  "/forgot-password",
  forgotPasswordValidationRules,
  validate,
  forgotPassword
);
router.post("/reset-otp", OTPValidationRules, validate, verifyResetOtp);
router.post(
  "/reset-password",
  resetPasswordValidationRules,
  validate,
  resetPassword
);
router.post("/google_signin", googleSignIn);

export default router;
