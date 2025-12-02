package com.hospital.management

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.hospital.management.data.repository.PatientRepository
import com.hospital.management.data.api.RetrofitClient
import com.hospital.management.data.local.TokenManager
import kotlinx.coroutines.launch

class FolderDetailsActivity : AppCompatActivity() {

    private lateinit var repository: PatientRepository
    private lateinit var rvFiles: RecyclerView
    private lateinit var fileAdapter: FileAdapter
    private lateinit var progressBar: View
    private lateinit var tvEmpty: View

    private var patientId: String = ""
    private var folderName: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_folder_details)

        val tokenManager = TokenManager(this)
        val apiService = RetrofitClient.getApiService(this)
        repository = PatientRepository(apiService, tokenManager)

        // Get folder info from intent
        patientId = intent.getStringExtra("PATIENT_ID") ?: ""
        folderName = intent.getStringExtra("FOLDER_NAME") ?: ""

        setupViews()
        loadFiles()
    }

    private fun setupViews() {
        findViewById<View>(R.id.btnBack).setOnClickListener { finish() }
        
        val displayName = folderName
            .replace("-", " ")
            .split(" ")
            .joinToString(" ") { it.capitalize() }
        findViewById<android.widget.TextView>(R.id.tvFolderName).text = displayName

        rvFiles = findViewById(R.id.rvFiles)
        progressBar = findViewById(R.id.progressBar)
        tvEmpty = findViewById(R.id.tvEmpty)

        rvFiles.layoutManager = LinearLayoutManager(this)

        // FAB for scan document
        findViewById<View>(R.id.fabScan).setOnClickListener {
            val intent = Intent(this, ScannerActivity::class.java)
            intent.putExtra("PATIENT_ID", patientId)
            intent.putExtra("FOLDER_NAME", folderName)
            startActivity(intent)
        }

        // FAB for download folder
        findViewById<View>(R.id.fabDownload).setOnClickListener {
            showDownloadOptionsDialog()
        }
    }

    private fun loadFiles() {
        progressBar.visibility = View.VISIBLE
        rvFiles.visibility = View.GONE
        tvEmpty.visibility = View.GONE

        lifecycleScope.launch {
            try {
                val response = repository.getPatientById(patientId)
                if (response.isSuccessful && response.body()?.get("success") == true) {
                    val data = response.body()?.get("data") as? Map<*, *>
                    val foldersData = data?.get("folders") as? List<*>
                    val folderData = foldersData?.find { (it as? Map<*, *>)?.get("name") == folderName } as? Map<*, *>
                    
                    val folder = if (folderData != null) {
                        val filesData = folderData["files"] as? List<*>
                        val files = mutableListOf<com.hospital.management.data.models.FileItem>()
                        filesData?.forEach { fileItem ->
                            val fileMap = fileItem as? Map<*, *>
                            if (fileMap != null) {
                                files.add(
                                    com.hospital.management.data.models.FileItem(
                                        fileName = fileMap["fileName"] as? String ?: "",
                                        url = fileMap["url"] as? String ?: "",
                                        size = (fileMap["size"] as? Number)?.toLong() ?: 0L,
                                        uploadedAt = fileMap["uploadedAt"] as? String ?: ""
                                    )
                                )
                            }
                        }
                        com.hospital.management.data.models.Folder(
                            name = folderData["name"] as? String ?: "",
                            files = files,
                            fileCount = files.size
                        )
                    } else null
                    if (folder != null && folder.files.isNotEmpty()) {
                        fileAdapter = FileAdapter(folder.files) { file ->
                            // View or download file
                            Toast.makeText(this@FolderDetailsActivity, "Opening ${file.name}", Toast.LENGTH_SHORT).show()
                        }
                        rvFiles.adapter = fileAdapter
                        rvFiles.visibility = View.VISIBLE
                    } else {
                        tvEmpty.visibility = View.VISIBLE
                    }
                    progressBar.visibility = View.GONE
                } else {
                    progressBar.visibility = View.GONE
                    Toast.makeText(this@FolderDetailsActivity, "Failed to load files", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                progressBar.visibility = View.GONE
                Toast.makeText(this@FolderDetailsActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun showDownloadOptionsDialog() {
        val options = arrayOf("Download as PDF", "Download as ZIP")
        
        AlertDialog.Builder(this)
            .setTitle("Download Folder Files")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> downloadFolderPdf()
                    1 -> downloadFolderZip()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun downloadFolderPdf() {
        lifecycleScope.launch {
            try {
                Toast.makeText(this@FolderDetailsActivity, "Preparing PDF...", Toast.LENGTH_SHORT).show()
                val response = repository.downloadFolderPdf(patientId, folderName)
                if (response.isSuccessful) {
                    Toast.makeText(this@FolderDetailsActivity, "PDF downloaded successfully", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this@FolderDetailsActivity, "Download failed", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@FolderDetailsActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun downloadFolderZip() {
        lifecycleScope.launch {
            try {
                Toast.makeText(this@FolderDetailsActivity, "Preparing ZIP...", Toast.LENGTH_SHORT).show()
                val response = repository.downloadFolderZip(patientId, folderName)
                if (response.isSuccessful) {
                    Toast.makeText(this@FolderDetailsActivity, "ZIP downloaded successfully", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this@FolderDetailsActivity, "Download failed", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@FolderDetailsActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        loadFiles() // Refresh file list when returning from scanner
    }
}
