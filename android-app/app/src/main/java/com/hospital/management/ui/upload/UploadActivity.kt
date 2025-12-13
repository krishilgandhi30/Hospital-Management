package com.hospital.management.ui.upload

import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.hospital.management.data.api.RetrofitClient
import com.hospital.management.databinding.ActivityUploadBinding
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File

class UploadActivity : AppCompatActivity() {
    private lateinit var binding: ActivityUploadBinding
    private var imageUri: Uri? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityUploadBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val uriString = intent.getStringExtra("imageUri")
        if (uriString != null) {
            imageUri = Uri.parse(uriString)
            binding.ivPreview.setImageURI(imageUri)
        }

        binding.btnUpload.setOnClickListener {
            uploadFile()
        }
    }

    private fun uploadFile() {
        val patientId = binding.etPatientId.text.toString()
        val folderName = binding.etFolderName.text.toString()

        if (patientId.isEmpty() || folderName.isEmpty() || imageUri == null) {
            Toast.makeText(this, "Please fill all fields and capture image", Toast.LENGTH_SHORT).show()
            return
        }

        binding.progressBar.visibility = android.view.View.VISIBLE
        binding.btnUpload.isEnabled = false

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val file = File(imageUri!!.path!!)
                val mediaType = "image/jpeg".toMediaTypeOrNull()
                val requestFile = file.asRequestBody(mediaType)
                val body = MultipartBody.Part.createFormData("file", file.name, requestFile)

                val apiService = RetrofitClient.getApiService(this@UploadActivity)
                val response = apiService.uploadFile(patientId, folderName, body)

                withContext(Dispatchers.Main) {
                    binding.progressBar.visibility = android.view.View.GONE
                    binding.btnUpload.isEnabled = true

                    if (response.isSuccessful && response.body()?.get("success") == true) {
                        Toast.makeText(this@UploadActivity, "Upload successful", Toast.LENGTH_SHORT).show()
                        finish()
                    } else {
                        Toast.makeText(this@UploadActivity, "Upload failed: ${response.message()}", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    binding.progressBar.visibility = android.view.View.GONE
                    binding.btnUpload.isEnabled = true
                    Toast.makeText(this@UploadActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}
