package com.hospital.management

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions
import com.google.mlkit.vision.documentscanner.GmsDocumentScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult
import com.hospital.management.data.repository.PatientRepository
import com.hospital.management.data.api.RetrofitClient
import com.hospital.management.data.local.TokenManager
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File

class ScannerActivity : AppCompatActivity() {

    private lateinit var repository: PatientRepository
    private var patientId: String = ""
    private var folderName: String = ""

    private val scannerLauncher = registerForActivityResult(
        ActivityResultContracts.StartIntentSenderForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            val scanResult = GmsDocumentScanningResult.fromActivityResultIntent(result.data)
            scanResult?.pages?.let { pages ->
                // Get the PDF file
                scanResult.pdf?.let { pdf ->
                    uploadScannedDocument(pdf.uri)
                }
            }
        } else {
            Toast.makeText(this, "Scanning cancelled", Toast.LENGTH_SHORT).show()
            finish()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val tokenManager = TokenManager(this)
        val apiService = RetrofitClient.getApiService(this)
        repository = PatientRepository(apiService, tokenManager)
        
        // Get patient and folder info from intent
        patientId = intent.getStringExtra("PATIENT_ID") ?: ""
        folderName = intent.getStringExtra("FOLDER_NAME") ?: ""

        if (patientId.isEmpty() || folderName.isEmpty()) {
            Toast.makeText(this, "Invalid parameters", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        startDocumentScanner()
    }

    private fun startDocumentScanner() {
        val options = GmsDocumentScannerOptions.Builder()
            .setGalleryImportAllowed(true)
            .setPageLimit(20)
            .setResultFormats(
                GmsDocumentScannerOptions.RESULT_FORMAT_PDF,
                GmsDocumentScannerOptions.RESULT_FORMAT_JPEG
            )
            .setScannerMode(GmsDocumentScannerOptions.SCANNER_MODE_FULL)
            .build()

        val scanner = GmsDocumentScanning.getClient(options)

        scanner.getStartScanIntent(this)
            .addOnSuccessListener { intentSender ->
                scannerLauncher.launch(
                    IntentSenderRequest.Builder(intentSender).build()
                )
            }
            .addOnFailureListener { e ->
                Toast.makeText(this, "Failed to start scanner: ${e.message}", Toast.LENGTH_SHORT).show()
                finish()
            }
    }

    private fun uploadScannedDocument(uri: Uri) {
        Toast.makeText(this, "Uploading document...", Toast.LENGTH_SHORT).show()

        lifecycleScope.launch {
            try {
                // Copy URI to temporary file
                val inputStream = contentResolver.openInputStream(uri)
                val tempFile = File(cacheDir, "scanned_${System.currentTimeMillis()}.pdf")
                
                inputStream?.use { input ->
                    tempFile.outputStream().use { output ->
                        input.copyTo(output)
                    }
                }

                // Create multipart request
                val requestFile = tempFile.asRequestBody("application/pdf".toMediaTypeOrNull())
                val body = MultipartBody.Part.createFormData("file", tempFile.name, requestFile)

                // Upload to backend
                val response = repository.uploadFile(patientId, folderName, body)
                
                if (response.isSuccessful) {
                    Toast.makeText(this@ScannerActivity, "Document uploaded successfully", Toast.LENGTH_SHORT).show()
                    
                    // Clean up temp file
                    tempFile.delete()
                    
                    // Return to folder view
                    finish()
                } else {
                    Toast.makeText(this@ScannerActivity, "Upload failed", Toast.LENGTH_SHORT).show()
                    tempFile.delete()
                    finish()
                }
            } catch (e: Exception) {
                Toast.makeText(this@ScannerActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                finish()
            }
        }
    }
}
