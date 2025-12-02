/**
 * Authentication Routes
 * Defines all authentication endpoints
 */

import express from "express";
import { body } from "express-validator";
import { registerHospital, login, verifyOtp, refreshToken, logout, resendOtp } from "../controllers/auth.controller.js";
import { verifyTempToken } from "../middleware/auth.js";
import { handleValidationErrors, sanitizeRequest } from "../middleware/validateRequest.js";
import { authLimiter, otpLimiter } from "../middleware/rateLimiter.js";
import { uploadSingle } from "../middleware/upload.js";

const router = express.Router();

// Apply sanitization to all auth routes
router.use(sanitizeRequest);

/**
 * POST /api/auth/register-hospital
 * Register a new hospital
 */
router.post(
  "/register-hospital",
  authLimiter,
  (req, res, next) => {
    uploadSingle("logo")(req, res, (err) => {
      if (err) {
        if (err.message.includes("Only image files")) {
          return res.status(400).json({
            success: false,
            message: "Only image files are allowed (JPEG, PNG, GIF, WebP)",
          });
        }
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "Logo file size must be less than 2MB",
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || "File upload failed",
        });
      }
      next();
    });
  },
  [
    body("hospitalName").notEmpty().trim().withMessage("Hospital name is required"),
    body("email").isEmail().normalizeEmail().withMessage("Invalid email format"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("phoneNumber")
      .matches(/^\d{10}$/)
      .withMessage("Phone number must be 10 digits"),
    body("address").notEmpty().trim().withMessage("Address is required"),
  ],
  handleValidationErrors,
  registerHospital,
);

/**
 * POST /api/auth/login
 * Login with email and password, receive OTP
 */
router.post(
  "/login",
  authLimiter,
  [body("email").isEmail().normalizeEmail().withMessage("Invalid email format"), body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters")],
  handleValidationErrors,
  login,
);

/**
 * POST /api/auth/verify-otp
 * Verify OTP and create session
 */
router.post(
  "/verify-otp",
  otpLimiter,
  verifyTempToken,
  [
    body("otp")
      .matches(/^\d{6}$/)
      .withMessage("OTP must be 6 digits"),
  ],
  handleValidationErrors,
  verifyOtp,
);

/**
 * POST /api/auth/refresh-token
 * Refresh access token using refresh token (from cookie)
 */
router.post("/refresh-token", refreshToken);

/**
 * POST /api/auth/logout
 * Invalidate session (uses refresh token from cookie)
 */
router.post("/logout", logout);

/**
 * POST /api/auth/resend-otp
 * Resend OTP to phone
 */
router.post("/resend-otp", otpLimiter, verifyTempToken, resendOtp);

export default router;
