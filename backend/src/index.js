/**
 * Main Application Entry Point
 * Initializes Express server with all middleware and routes
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes.js";
import patientRoutes from "./routes/patient.routes.js";
import connectDB from "./config/db.js";
import config from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import scheduleAutoDelete from "./jobs/autoDelete.job.js";

const app = express();

// ============ REQUEST LOGGING MIDDLEWARE ============
app.use((req, res, next) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log("[Request] Headers:", req.headers);
  console.log("[Request] Body:", req.body);

  // Log response
  const originalJson = res.json;
  res.json = function (data) {
    console.log("[Response] Status:", res.statusCode);
    console.log("[Response] Data:", data);
    return originalJson.call(this, data);
  };

  next();
});

// ============ SECURITY MIDDLEWARE ============
app.use(helmet()); // Set security HTTP headers

// ============ RATE LIMITING ============
app.use(generalLimiter);

// ============ BODY PARSING ============
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ============ CORS CONFIGURATION ============
app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

// ============ API ROUTES ============
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);

// ============ HEALTH CHECK ============
app.get("/health", (req, res) => {
  console.log("[Health Check] Request received");
  res.status(200).json({
    success: true,
    message: "Hospital Management API is running",
    timestamp: new Date().toISOString(),
  });
});

// ============ 404 HANDLER ============
app.use(notFoundHandler);

// ============ GLOBAL ERROR HANDLER ============
app.use(errorHandler);

// ============ DATABASE CONNECTION & SERVER START ============
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Schedule auto-delete cron job
    scheduleAutoDelete();

    // Start Express server
    app.listen(config.PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║   Hospital Management API             ║
║   ✓ Server running on port ${config.PORT}       ║
║   ✓ Environment: ${config.NODE_ENV}          ║
║   ✓ DB: MongoDB Connected             ║
║   ✓ Auto-delete job scheduled         ║
╚════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
