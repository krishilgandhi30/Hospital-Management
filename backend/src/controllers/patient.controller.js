/**
 * Patient Controller
 * Handles all patient-related operations
 */

import * as patientService from "../services/patient.service.js";
import * as r2Service from "../services/r2.service.js";
import * as pdfService from "../services/pdf.service.js";
import * as zipService from "../services/zip.service.js";

/**
 * POST /api/patients
 * Create new patient with auto-generated folders
 */
export const createPatient = async (req, res) => {
  try {
    const hospitalId = req.hospital?._id;
    const { patientName, email, phone, dateOfBirth, medicalRecordNumber, notes } = req.body;

    console.log("[Patient Controller] Creating patient:", patientName);

    const patient = await patientService.createPatient({
      hospitalId,
      patientName,
      email,
      phone,
      dateOfBirth,
      medicalRecordNumber,
      notes,
    });

    return res.status(201).json({
      success: true,
      data: patient,
      message: "Patient created successfully",
    });
  } catch (error) {
    console.error("[Patient Controller] Create error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/patients
 * Get all patients for logged-in hospital with pagination and search
 */
export const getPatients = async (req, res) => {
  try {
    const hospitalId = req.hospital?._id;
    const { limit = 20, skip = 0, search } = req.query;

    console.log("[Patient Controller] Fetching patients for hospital:", hospitalId, "Search:", search);

    const { patients, total } = await patientService.getPatients(hospitalId, {
      limit: parseInt(limit),
      skip: parseInt(skip),
      search,
    });

    return res.status(200).json({
      success: true,
      data: {
        patients,
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
      },
    });
  } catch (error) {
    console.error("[Patient Controller] Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/patients/:patientId
 * Get patient details with folder structure
 */
export const getPatientById = async (req, res) => {
  try {
    const { patientId } = req.params;
    const hospitalId = req.hospital?._id;

    console.log("[Patient Controller] Fetching patient:", patientId);

    const patient = await patientService.getPatientById(hospitalId, patientId);

    return res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error("[Patient Controller] Error:", error);
    return res.status(error.message === "Patient not found" ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/patients/:patientId/files/:folderName
 * Get files in specific folder
 */
export const getFolderFiles = async (req, res) => {
  try {
    const { patientId, folderName } = req.params;
    const hospitalId = req.hospital?._id;

    console.log("[Patient Controller] Fetching files for folder:", folderName);

    const folder = await patientService.getFolderFiles(hospitalId, patientId, folderName);

    return res.status(200).json({
      success: true,
      data: folder,
    });
  } catch (error) {
    console.error("[Patient Controller] Error:", error);
    return res.status(error.message.includes("not found") ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/patients/:patientId/files/:folderName
 * Upload file to patient folder
 */
export const uploadFile = async (req, res) => {
  try {
    const { patientId, folderName } = req.params;
    const hospitalId = req.hospital?._id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    console.log("[Patient Controller] Uploading file to folder:", folderName);

    // Generate R2 key: hospitalId/patientId/folderName/filename
    const key = `${hospitalId}/${patientId}/${folderName}/${Date.now()}_${file.originalname}`;

    // Upload to R2
    const uploadResult = await r2Service.uploadFile(file.buffer, key, file.mimetype);

    // Update patient record
    const patient = await patientService.addFileToFolder(hospitalId, patientId, folderName, {
      fileName: file.originalname,
      fileUrl: uploadResult.key,
      size: file.size,
      mimeType: file.mimetype,
    });

    return res.status(200).json({
      success: true,
      data: patient,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("[Patient Controller] Upload error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/patients/:patientId/download/pdf
 * Download all files as PDF
 */
export const downloadAllPdf = async (req, res) => {
  try {
    const { patientId } = req.params;
    const hospitalId = req.hospital?._id;

    console.log("[Patient Controller] Generating PDF for patient:", patientId);

    const patient = await patientService.getPatientById(hospitalId, patientId);
    await pdfService.generatePatientPdf(patient, res);
  } catch (error) {
    console.error("[Patient Controller] PDF error:", error);
    if (!res.headersSent) {
      return res.status(error.message === "Patient not found" ? 404 : 500).json({
        success: false,
        message: error.message,
      });
    }
  }
};

/**
 * GET /api/patients/:patientId/folders/:folderName/pdf
 * Download folder-wise PDF
 */
export const downloadFolderPdf = async (req, res) => {
  try {
    const { patientId, folderName } = req.params;
    const hospitalId = req.hospital?._id;

    console.log("[Patient Controller] Generating folder PDF:", folderName);

    const patient = await patientService.getPatientById(hospitalId, patientId);
    await pdfService.generateFolderPdf(patient, folderName, res);
  } catch (error) {
    console.error("[Patient Controller] Folder PDF error:", error);
    if (!res.headersSent) {
      return res.status(error.message.includes("not found") ? 404 : 500).json({
        success: false,
        message: error.message,
      });
    }
  }
};

/**
 * GET /api/patients/:patientId/download/zip
 * Download all files as ZIP
 */
export const downloadAllZip = async (req, res) => {
  try {
    const { patientId } = req.params;
    const hospitalId = req.hospital?._id;

    console.log("[Patient Controller] Generating ZIP for patient:", patientId);

    const patient = await patientService.getPatientById(hospitalId, patientId);
    await zipService.generatePatientZip(patient, res);
  } catch (error) {
    console.error("[Patient Controller] ZIP error:", error);
    if (!res.headersSent) {
      return res.status(error.message === "Patient not found" ? 404 : 500).json({
        success: false,
        message: error.message,
      });
    }
  }
};

/**
 * GET /api/patients/:patientId/folders/:folderName/zip
 * Download folder-wise ZIP
 */
export const downloadFolderZip = async (req, res) => {
  try {
    const { patientId, folderName } = req.params;
    const hospitalId = req.hospital?._id;

    console.log("[Patient Controller] Generating folder ZIP:", folderName);

    const patient = await patientService.getPatientById(hospitalId, patientId);
    await zipService.generateFolderZip(patient, folderName, res);
  } catch (error) {
    console.error("[Patient Controller] Folder ZIP error:", error);
    if (!res.headersSent) {
      return res.status(error.message.includes("not found") ? 404 : 500).json({
        success: false,
        message: error.message,
      });
    }
  }
};

/**
 * DELETE /api/patients/autodelete
 * Auto-delete patients older than 90 days (cron job)
 */
export const autoDelete = async (req, res) => {
  try {
    console.log("[Patient Controller] Running auto-delete job");

    const result = await patientService.deleteOldPatients(90);

    return res.status(200).json({
      success: true,
      data: result,
      message: `Deleted ${result.deletedCount} patients and ${result.filesDeleted} files`,
    });
  } catch (error) {
    console.error("[Patient Controller] Auto-delete error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Helper function to format file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export default {
  createPatient,
  getPatients,
  getPatientById,
  getFolderFiles,
  uploadFile,
  downloadAllPdf,
  downloadFolderPdf,
  downloadAllZip,
  downloadFolderZip,
  autoDelete,
};
