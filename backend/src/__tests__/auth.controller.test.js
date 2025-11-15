/**
 * Authentication Controller Tests
 * Jest test suite for auth.controller.js
 */

import request from "supertest";
import app from "../index.js";
import Hospital from "../models/Hospital.js";
import { hashPassword } from "../utils/hash.js";

describe("Authentication Controller", () => {
  let testHospitalId;
  const testHospital = {
    hospitalName: "Test Hospital",
    email: "test@hospital.com",
    phone: "+919876543210",
    password: "Password123",
    logoUrl: "https://via.placeholder.com/150?text=Test",
  };

  beforeAll(async () => {
    // Create test hospital
    const passwordHash = await hashPassword(testHospital.password);
    const hospital = await Hospital.create({
      hospitalName: testHospital.hospitalName,
      email: testHospital.email,
      phone: testHospital.phone,
      passwordHash,
      logoUrl: testHospital.logoUrl,
    });
    testHospitalId = hospital._id;
  });

  afterAll(async () => {
    // Cleanup
    await Hospital.deleteOne({ _id: testHospitalId });
  });

  describe("POST /api/auth/login", () => {
    it("should login successfully and send OTP", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: testHospital.email,
        password: testHospital.password,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("tempToken");
      expect(response.body.data).toHaveProperty("phone");
      expect(response.body.data).toHaveProperty("expiresAt");
    });

    it("should fail with invalid email", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "invalid-email",
        password: testHospital.password,
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should fail with wrong password", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: testHospital.email,
        password: "WrongPassword",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/verify-otp", () => {
    it("should fail without temp token", async () => {
      const response = await request(app).post("/api/auth/verify-otp").send({
        otp: "123456",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should validate OTP format", async () => {
      // First login to get temp token
      const loginResponse = await request(app).post("/api/auth/login").send({
        email: testHospital.email,
        password: testHospital.password,
      });

      const tempToken = loginResponse.body.data.tempToken;

      // Try to verify with invalid OTP format
      const response = await request(app).post("/api/auth/verify-otp").set("Authorization", `Bearer ${tempToken}`).send({
        otp: "invalid",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/refresh-token", () => {
    it("should fail without refresh token", async () => {
      const response = await request(app).post("/api/auth/refresh-token").send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should fail with invalid refresh token", async () => {
      const response = await request(app).post("/api/auth/refresh-token").send({
        refreshToken: "invalid-token",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
