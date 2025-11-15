/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches hospital data to request
 */

import { verifyToken, extractTokenFromHeader } from "../utils/jwt.js";
import Hospital from "../models/Hospital.js";

/**
 * Verify JWT token middleware
 */
export const verifyAccessToken = (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = verifyToken(token);

    if (decoded.type !== "access") {
      return res.status(401).json({
        success: false,
        message: "Invalid token type",
      });
    }

    req.hospital = { id: decoded.id };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Verify temporary token (for OTP verification)
 */
export const verifyTempToken = (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = verifyToken(token);

    if (decoded.type !== "temp") {
      return res.status(401).json({
        success: false,
        message: "Invalid token type. Use temporary token for OTP verification.",
      });
    }

    req.hospital = { id: decoded.id };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Middleware to attach hospital data to request
 */
export const attachHospitalData = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.hospital.id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    if (!hospital.isActive) {
      return res.status(403).json({
        success: false,
        message: "Hospital account is inactive",
      });
    }

    req.hospital = hospital;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to fetch hospital data: ${error.message}`,
    });
  }
};

export default {
  verifyAccessToken,
  verifyTempToken,
  attachHospitalData,
};
