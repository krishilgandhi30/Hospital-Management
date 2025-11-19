/**
 * Authentication Controller
 * Handles login, OTP verification, refresh token, and logout
 */

import { body, validationResult } from "express-validator";
import Hospital from "../models/Hospital.js";
import Session from "../models/Session.js";
import AuditLog from "../models/AuditLog.js";
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

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    if (!hospital) {
      console.log("[Auth Controller] Hospital not found for email:", email);
      // Log failed attempt
      await AuditLog.create({
        action: "LOGIN_ATTEMPT",
        status: "FAILURE",
        ipAddress,
        userAgent,
        metadata: { email, failureReason: "User not found" },
      });

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check for account lockout
    if (hospital.lockUntil && hospital.lockUntil > Date.now()) {
      console.log("[Auth Controller] Account is locked for:", email);
      await AuditLog.create({
        userId: hospital._id,
        action: "LOGIN_ATTEMPT",
        status: "FAILURE",
        ipAddress,
        userAgent,
        metadata: { email, failureReason: "Account locked" },
      });

      return res.status(423).json({
        success: false,
        message: "Account is locked. Please try again later.",
        lockUntil: hospital.lockUntil,
      });
    }

    console.log("[Auth Controller] Hospital found:", hospital._id);

    if (!hospital.isActive) {
      console.log("[Auth Controller] Hospital account is inactive");
      await AuditLog.create({
        userId: hospital._id,
        action: "LOGIN_ATTEMPT",
        status: "FAILURE",
        ipAddress,
        userAgent,
        metadata: { email, failureReason: "Account inactive" },
      });
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

      // Increment failed attempts
      hospital.failedLoginAttempts += 1;

      // Lock account if too many attempts (e.g., 5 attempts)
      if (hospital.failedLoginAttempts >= 5) {
        hospital.lockUntil = Date.now() + 15 * 60 * 1000; // 15 minutes
        console.log("[Auth Controller] Locking account due to too many failed attempts");
      }

      await hospital.save();

      await AuditLog.create({
        userId: hospital._id,
        action: "LOGIN_ATTEMPT",
        status: "FAILURE",
        ipAddress,
        userAgent,
        metadata: { email, failureReason: "Invalid password", attempts: hospital.failedLoginAttempts },
      });

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Reset failed attempts on success (but don't save yet, wait for OTP verification?)
    // Actually, password success is just step 1. We can reset here or after OTP.
    // Let's reset here to prevent lockout if they know password but fail OTP.
    if (hospital.failedLoginAttempts > 0) {
      hospital.failedLoginAttempts = 0;
      hospital.lockUntil = undefined;
      await hospital.save();
    }

    console.log("[Auth Controller] Password verified successfully");

    // Get client IP and user agent
    // const ipAddress = req.ip || req.connection.remoteAddress; // Already defined above
    // const userAgent = req.headers["user-agent"]; // Already defined above
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

    await AuditLog.create({
      userId: hospital._id,
      action: "LOGIN_ATTEMPT",
      status: "SUCCESS", // Password success, waiting for OTP
      ipAddress,
      userAgent,
      details: { step: "PASSWORD_VERIFIED" },
    });

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

    await AuditLog.create({
      userId: hospitalId,
      action: "LOGIN_SUCCESS",
      status: "SUCCESS",
      ipAddress,
      userAgent,
      details: { method: "OTP" },
    });

    // Set cookies
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("accessToken", session.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", session.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      data: {
        // accessToken: session.accessToken, // Removed, sent in cookie
        // refreshToken: session.refreshToken, // Removed, sent in cookie
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
    const token = req.cookies.refreshToken || req.body.refreshToken;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const tokens = await refreshAccessToken(token);

    // Get hospital data to send back
    const session = await Session.findOne({ refreshToken: token });
    const hospital = await Hospital.findById(session.hospitalId);

    // Set new access token cookie
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        ...tokens,
        hospital: hospital ? hospital.toJSON() : null,
      },
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
    const token = req.cookies.refreshToken || req.body.refreshToken;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    await invalidateSession(token);

    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    // Log logout
    // We might not have user ID here easily unless we decode token, but session invalidation handles it.
    // Ideally we should log who logged out.

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
