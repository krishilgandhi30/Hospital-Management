/**
 * Audit Log Model
 * Tracks all security-related events for HIPAA compliance
 */

import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: false, // Can be null if login fails and user is unknown/not found
    },
    action: {
      type: String,
      required: true,
      enum: ["LOGIN_ATTEMPT", "LOGIN_SUCCESS", "LOGIN_FAILED", "OTP_SENT", "OTP_VERIFIED", "LOGOUT", "PASSWORD_CHANGE", "PROFILE_UPDATE", "HOSPITAL_REGISTRATION"],
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILURE"],
      required: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    details: {
      type: mongoose.Schema.Types.Mixed, // Flexible field for extra info
    },
    metadata: {
      email: String, // Store email even if user not found
      failureReason: String,
    },
  },
  {
    timestamps: true, // createdAt serves as the timestamp of the event
  },
);

// Index for querying logs by user or time
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
