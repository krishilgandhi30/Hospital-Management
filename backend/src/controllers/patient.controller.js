/**
 * Patient Controller
 * Handles patient-related API requests
 */

import * as patientService from "../services/patient.service.js";
import * as r2Service from "../services/r2.service.js";
import archiver from "archiver";
import PDFDocument from "pdfkit";

/**
 * GET /api/patients
 * Get all patients for logged-in hospital
 */
export const getPatients = async (req, res) => {
  try {
    const hospitalId = req.hospital?._id;
    const { limit = 20, skip = 0 } = req.query;

    console.log("[Patient Controller] Fetching patients for hospital:", hospitalId);

    const { patients, total } = await patientService.getPatients(hospitalId, {
      limit: parseInt(limit),
      skip: parseInt(skip),
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
 * GET /api/patients/:patientId/download/pdf
 * Download all files as PDF
 */
export const downloadAllPdf = async (req, res) => {
  try {
    const { patientId } = req.params;
    const hospitalId = req.hospital?._id;

    console.log("[Patient Controller] Generating PDF for patient:", patientId);

    const patient = await patientService.getPatientById(hospitalId, patientId);

    // Create PDF document
    const doc = new PDFDocument();
    const filename = `${patient.patientName}_records.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Add title
    doc.fontSize(20).text(`Patient Records: ${patient.patientName}`, { align: "center" });
    doc.moveDown();

    // Add patient info
    doc.fontSize(12).text(`Name: ${patient.patientName}`);
    if (patient.email) doc.text(`Email: ${patient.email}`);
    if (patient.phone) doc.text(`Phone: ${patient.phone}`);
    doc.moveDown();

    // Add folders and files
    for (const folder of patient.folders) {
      doc.fontSize(14).text(folder.name, { underline: true });
      doc.moveDown(0.5);

      for (const file of folder.files) {
        doc.fontSize(11).text(`• ${file.fileName} (${formatFileSize(file.size)})`);
        doc.text(`  Uploaded: ${new Date(file.uploadedAt).toLocaleDateString()}`);
      }
      doc.moveDown();
    }

    doc.end();
  } catch (error) {
    console.error("[Patient Controller] PDF error:", error);
    return res.status(error.message === "Patient not found" ? 404 : 500).json({
      success: false,
      message: error.message,
    });
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
    const folder = patient.folders.find((f) => f.name === folderName);

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found",
      });
    }

    // Create PDF document
    const doc = new PDFDocument();
    const filename = `${patient.patientName}_${folderName}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Add title
    doc.fontSize(18).text(`${folderName} - ${patient.patientName}`, { align: "center" });
    doc.moveDown();

    // Add files
    for (const file of folder.files) {
      doc.fontSize(12).text(`${file.fileName}`);
      doc.text(`Size: ${formatFileSize(file.size)}`);
      doc.text(`Uploaded: ${new Date(file.uploadedAt).toLocaleDateString()}`);
      doc.moveDown();
    }

    doc.end();
  } catch (error) {
    console.error("[Patient Controller] Folder PDF error:", error);
    return res.status(error.message.includes("not found") ? 404 : 500).json({
      success: false,
      message: error.message,
    });
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

    const archive = archiver("zip", { zlib: { level: 9 } });
    const filename = `${patient.patientName}_records.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    archive.pipe(res);

    // Add files from all folders
    for (const folder of patient.folders) {
      for (const file of folder.files) {
        try {
          const stream = await r2Service.getFileStream(file.fileUrl);
          archive.append(stream, { name: `${folder.name}/${file.fileName}` });
        } catch (error) {
          console.error("[Patient Controller] Error streaming file:", file.fileUrl, error);
        }
      }
    }

    await archive.finalize();
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
 * Download folder as ZIP
 */
export const downloadFolderZip = async (req, res) => {
  try {
    const { patientId, folderName } = req.params;
    const hospitalId = req.hospital?._id;

    console.log("[Patient Controller] Generating folder ZIP:", folderName);

    const patient = await patientService.getPatientById(hospitalId, patientId);
    const folder = patient.folders.find((f) => f.name === folderName);

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found",
      });
    }

    const archive = archiver("zip", { zlib: { level: 9 } });
    const filename = `${patient.patientName}_${folderName}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    archive.pipe(res);

    // Add files from folder
    for (const file of folder.files) {
      try {
        const stream = await r2Service.getFileStream(file.fileUrl);
        archive.append(stream, { name: file.fileName });
      } catch (error) {
        console.error("[Patient Controller] Error streaming file:", file.fileUrl, error);
      }
    }

    await archive.finalize();
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
  getPatients,
  getPatientById,
  getFolderFiles,
  downloadAllPdf,
  downloadFolderPdf,
  downloadAllZip,
  downloadFolderZip,
  autoDelete,
};
