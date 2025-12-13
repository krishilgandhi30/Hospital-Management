/**
 * Hospital Model
 * Stores hospital credentials and profile information
 */

import mongoose from "mongoose";

const hospitalSchema = new mongoose.Schema(
  {
    hospitalName: {
      type: String,
      required: [true, "Hospital name is required"],
      trim: true,
      minlength: [3, "Hospital name must be at least 3 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Invalid email format"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      match: [/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    logoUrl: {
      type: String,
      default: "https://via.placeholder.com/150?text=Hospital",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    department: {
      type: String,
      default: "General",
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    zipCode: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
hospitalSchema.index({ email: 1 });
hospitalSchema.index({ phone: 1 });

// Virtual for full address
hospitalSchema.virtual("fullAddress").get(function () {
  return `${this.address}, ${this.city}, ${this.state} ${this.zipCode}`;
});

// Remove password from JSON responses
hospitalSchema.methods.toJSON = function () {
  const { passwordHash, ...rest } = this.toObject();
  return rest;
};

const Hospital = mongoose.model("Hospital", hospitalSchema);

export default Hospital;
