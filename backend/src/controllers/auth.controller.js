/**
 * Authentication Controller
 * Handles login, OTP verification, refresh token, and logout
 */

import { body, validationResult } from "express-validator";
import Hospital from "../models/Hospital.js";
import { comparePassword, hashPassword } from "../utils/hash.js";
import { generateTempToken } from "../utils/jwt.js";
import { createOtp, verifyOtp as verifyOtpService } from "../services/otp.service.js";
import { sendOtpSms, maskPhoneNumber } from "../services/sms.service.js";
import { createSession, refreshAccessToken, invalidateSession } from "../services/token.service.js";

/**
 * Login - Step 1: Validate credentials and send OTP
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("[Auth Controller] LOGIN REQUEST received");
    console.log("[Auth Controller] Email:", email);
    console.log("[Auth Controller] Password length:", password?.length);

    // Validate inputs
    if (!email || !password) {
      console.log("[Auth Controller] Missing email or password");
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find hospital by email
    console.log("[Auth Controller] Finding hospital by email:", email);
    const hospital = await Hospital.findOne({ email: email.toLowerCase() });

    if (!hospital) {
      console.log("[Auth Controller] Hospital not found for email:", email);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
    console.log("[Auth Controller] Hospital found:", hospital._id);

    if (!hospital.isActive) {
      console.log("[Auth Controller] Hospital account is inactive");
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Compare password
    console.log("[Auth Controller] Comparing password...");
    const isPasswordValid = await comparePassword(password, hospital.passwordHash);

    if (!isPasswordValid) {
      console.log("[Auth Controller] Password mismatch for hospital:", hospital._id);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
    console.log("[Auth Controller] Password verified successfully");

    // Get client IP and user agent
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];
    console.log("[Auth Controller] Creating OTP for hospital:", hospital._id);
    console.log("[Auth Controller] IP:", ipAddress);

    // Create OTP
    const otpData = await createOtp(hospital._id, ipAddress, userAgent);
    console.log("[Auth Controller] OTP created:", otpData.plainOtp);

    // Send OTP via SMS
    try {
      console.log("[Auth Controller] Sending SMS to:", maskPhoneNumber(hospital.phone));
      await sendOtpSms(hospital.phone, otpData.plainOtp);
      console.log("[Auth Controller] SMS sent successfully");
    } catch (smsError) {
      console.error("[Auth Controller] SMS sending failed:", smsError);
      // Continue even if SMS fails (for development/testing)
    }

    // Generate temporary token for OTP verification
    console.log("[Auth Controller] Generating tempToken...");
    const tempToken = generateTempToken(hospital._id);
    console.log("[Auth Controller] TempToken generated, preparing response...");

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: {
        tempToken,
        phone: maskPhoneNumber(hospital.phone),
        expiresAt: otpData.expiresAt,
        hospitalName: hospital.hospitalName,
        logoUrl: hospital.logoUrl,
      },
    });
  } catch (error) {
    console.error("[Auth Controller] LOGIN ERROR:", error);
    console.error("[Auth Controller] Error message:", error.message);
    console.error("[Auth Controller] Error stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: `Login failed: ${error.message}`,
    });
  }
};

/**
 * Verify OTP - Step 2: Verify OTP and create session
 * POST /api/auth/verify-otp
 */
export const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const hospitalId = req.hospital?.id;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required",
      });
    }

    if (!hospitalId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login first.",
      });
    }

    // Verify OTP
    try {
      await verifyOtpService(hospitalId, otp);
    } catch (otpError) {
      return res.status(400).json({
        success: false,
        message: otpError.message,
      });
    }

    // Get client IP and user agent
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    // Generate device ID (simplified: using user agent hash)
    // In production, use fingerprint library for better device identification
    const crypto = await import("crypto");
    const deviceId = crypto.createHash("sha256").update(userAgent).digest("hex").substring(0, 16);

    // Create session
    const session = await createSession(hospitalId, deviceId, ipAddress, userAgent);

    // Get hospital data
    const hospital = await Hospital.findById(hospitalId);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      data: {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        tokenType: session.tokenType,
        expiresIn: session.expiresIn,
        hospital: hospital.toJSON(),
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({
      success: false,
      message: `OTP verification failed: ${error.message}`,
    });
  }
};

/**
 * Refresh Token
 * POST /api/auth/refresh-token
 */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const tokens = await refreshAccessToken(token);

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: tokens,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Logout - Invalidate session
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    await invalidateSession(refreshToken);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: `Logout failed: ${error.message}`,
    });
  }
};

/**
 * Resend OTP
 * POST /api/auth/resend-otp
 */
export const resendOtp = async (req, res) => {
  try {
    const hospitalId = req.hospital?.id;

    if (!hospitalId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const { resendOtp: resendOtpService } = await import("../services/otp.service.js");
    const otpData = await resendOtpService(hospitalId, ipAddress, userAgent);

    // Send OTP via SMS
    try {
      const hospital = await Hospital.findById(hospitalId);
      await sendOtpSms(hospital.phone, otpData.plainOtp);
    } catch (smsError) {
      console.error("SMS sending failed:", smsError);
    }

    const hospital = await Hospital.findById(hospitalId);

    return res.status(200).json({
      success: true,
      message: "OTP resent successfully",
      data: {
        phone: maskPhoneNumber(hospital.phone),
        expiresAt: otpData.expiresAt,
      },
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({
      success: false,
      message: `Failed to resend OTP: ${error.message}`,
    });
  }
};

export default {
  login,
  verifyOtp,
  refreshToken,
  logout,
  resendOtp,
};
