package com.hospital.management.data.models

data class Patient(
    val _id: String,
    val patientName: String,
    val email: String?,
    val phone: String,
    val dateOfBirth: String,
    val medicalRecordNumber: String,
    val hospitalId: String,
    val folders: List<Folder>,
    val status: String,
    val createdAt: String
)

data class Folder(
    val name: String,
    val files: List<FileItem>,
    val fileCount: Int
)

data class FileItem(
    val fileName: String,
    val url: String,
    val size: Long,
    val uploadedAt: String
) {
    val name: String get() = fileName
}

data class PatientsResponse(
    val success: Boolean,
    val data: PatientsData,
    val message: String?
)

data class PatientsData(
    val patients: List<Patient>,
    val total: Int,
    val limit: Int,
    val skip: Int
)
