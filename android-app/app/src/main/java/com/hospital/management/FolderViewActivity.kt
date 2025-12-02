package com.hospital.management

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.hospital.management.data.repository.PatientRepository
import com.hospital.management.data.api.RetrofitClient
import com.hospital.management.data.local.TokenManager
import kotlinx.coroutines.launch

class FolderViewActivity : AppCompatActivity() {

    private lateinit var repository: PatientRepository
    private lateinit var rvFolders: RecyclerView
    private lateinit var folderAdapter: FolderAdapter
    private lateinit var progressBar: View
    private lateinit var tvEmpty: View

    private var patientId: String = ""
    private var patientName: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_folder_view)

        val tokenManager = TokenManager(this)
        val apiService = RetrofitClient.getApiService(this)
        repository = PatientRepository(apiService, tokenManager)

        // Get patient info from intent
        patientId = intent.getStringExtra("PATIENT_ID") ?: ""
        patientName = intent.getStringExtra("PATIENT_NAME") ?: "Patient"

        setupViews()
        loadFolders()
    }

    private fun setupViews() {
        findViewById<View>(R.id.btnBack).setOnClickListener { finish() }
        findViewById<android.widget.TextView>(R.id.tvPatientName).text = patientName

        rvFolders = findViewById(R.id.rvFolders)
        progressBar = findViewById(R.id.progressBar)
        tvEmpty = findViewById(R.id.tvEmpty)

        rvFolders.layoutManager = GridLayoutManager(this, 2)

        // FAB for scan document
        findViewById<View>(R.id.fabScan).setOnClickListener {
            showFolderSelectionDialog()
        }

        // FAB for download all
        findViewById<View>(R.id.fabDownloadAll).setOnClickListener {
            showDownloadOptionsDialog()
        }
    }

    private fun loadFolders() {
        progressBar.visibility = View.VISIBLE
        rvFolders.visibility = View.GONE
        tvEmpty.visibility = View.GONE

        lifecycleScope.launch {
            try {
                val response = repository.getPatientById(patientId)
                if (response.isSuccessful && response.body()?.get("success") == true) {
                    val data = response.body()?.get("data") as? Map<*, *>
                    val foldersData = data?.get("folders") as? List<*>
                    val folders = mutableListOf<com.hospital.management.data.models.Folder>()
                    
                    foldersData?.forEach { folderItem ->
                        val folderMap = folderItem as? Map<*, *>
                        if (folderMap != null) {
                            folders.add(
                                com.hospital.management.data.models.Folder(
                                    name = folderMap["name"] as? String ?: "",
                                    files = emptyList(),
                                    fileCount = (folderMap["fileCount"] as? Number)?.toInt() ?: 0
                                )
                            )
                        }
                    }
                    
                    if (folders.isNotEmpty()) {
                        folderAdapter = FolderAdapter(folders) { folder ->
                            // Navigate to folder details
                            val intent = Intent(this@FolderViewActivity, FolderDetailsActivity::class.java)
                            intent.putExtra("PATIENT_ID", patientId)
                            intent.putExtra("FOLDER_NAME", folder.name)
                            intent.putExtra("FILE_COUNT", folder.fileCount)
                            startActivity(intent)
                        }
                        rvFolders.adapter = folderAdapter
                        rvFolders.visibility = View.VISIBLE
                    } else {
                        tvEmpty.visibility = View.VISIBLE
                    }
                    progressBar.visibility = View.GONE
                } else {
                    progressBar.visibility = View.GONE
                    Toast.makeText(this@FolderViewActivity, "Failed to load folders", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                progressBar.visibility = View.GONE
                Toast.makeText(this@FolderViewActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun showFolderSelectionDialog() {
        val folders = arrayOf(
            "id", "claim-paper", "hospital-bills", "discharge-summary",
            "hospital-documents", "reports", "medical-prescription-bills", "consent"
        )
        
        AlertDialog.Builder(this)
            .setTitle("Select Folder")
            .setItems(folders) { _, which ->
                // Navigate to scanner
                val intent = Intent(this, ScannerActivity::class.java)
                intent.putExtra("PATIENT_ID", patientId)
                intent.putExtra("FOLDER_NAME", folders[which])
                startActivity(intent)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showDownloadOptionsDialog() {
        val options = arrayOf("Download as PDF", "Download as ZIP")
        
        AlertDialog.Builder(this)
            .setTitle("Download All Files")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> downloadAllPdf()
                    1 -> downloadAllZip()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun downloadAllPdf() {
        lifecycleScope.launch {
            try {
                Toast.makeText(this@FolderViewActivity, "Preparing PDF...", Toast.LENGTH_SHORT).show()
                val response = repository.downloadAllPdf(patientId)
                if (response.isSuccessful) {
                    // Handle PDF download
                    Toast.makeText(this@FolderViewActivity, "PDF downloaded successfully", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this@FolderViewActivity, "Download failed", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@FolderViewActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun downloadAllZip() {
        lifecycleScope.launch {
            try {
                Toast.makeText(this@FolderViewActivity, "Preparing ZIP...", Toast.LENGTH_SHORT).show()
                val response = repository.downloadAllZip(patientId)
                if (response.isSuccessful) {
                    // Handle ZIP download
                    Toast.makeText(this@FolderViewActivity, "ZIP downloaded successfully", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this@FolderViewActivity, "Download failed", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@FolderViewActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        loadFolders() // Refresh folder list when returning from scanner
    }
}
