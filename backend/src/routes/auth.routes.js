/**
 * Authentication Routes
 * Defines all authentication endpoints
 */

import express from "express";
import { body } from "express-validator";
import { login, verifyOtp, refreshToken, logout, resendOtp } from "../controllers/auth.controller.js";
import { verifyTempToken } from "../middleware/auth.js";
import { handleValidationErrors, sanitizeRequest } from "../middleware/validateRequest.js";
import { authLimiter, otpLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Apply sanitization to all auth routes
router.use(sanitizeRequest);

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
 * Refresh access token using refresh token
 */
router.post("/refresh-token", [body("refreshToken").notEmpty().withMessage("Refresh token is required")], handleValidationErrors, refreshToken);

/**
 * POST /api/auth/logout
 * Invalidate session
 */
router.post("/logout", [body("refreshToken").notEmpty().withMessage("Refresh token is required")], handleValidationErrors, logout);

/**
 * POST /api/auth/resend-otp
 * Resend OTP to phone
 */
router.post("/resend-otp", otpLimiter, verifyTempToken, resendOtp);

export default router;
