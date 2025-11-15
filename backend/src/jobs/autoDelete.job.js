/**
 * Auto-Delete Cron Job
 * Runs every 24 hours to delete patients older than 90 days
 */

import cron from "node-cron";
import * as patientService from "../services/patient.service.js";

/**
 * Schedule auto-delete job
 * Runs at 2 AM UTC every day
 */
export const scheduleAutoDelete = () => {
  // Cron expression: 0 2 * * * (2 AM UTC every day)
  cron.schedule("0 2 * * *", async () => {
    try {
      console.log("[Cron Job] Starting auto-delete job at", new Date().toISOString());

      const result = await patientService.deleteOldPatients(90);

      console.log("[Cron Job] Auto-delete completed");
      console.log(`[Cron Job] Deleted ${result.deletedCount} patients`);
      console.log(`[Cron Job] Deleted ${result.filesDeleted} files from R2`);
    } catch (error) {
      console.error("[Cron Job] Error during auto-delete:", error);
    }
  });

  console.log("[Cron Job] Auto-delete job scheduled for 2 AM UTC every day");
};

export default scheduleAutoDelete;
