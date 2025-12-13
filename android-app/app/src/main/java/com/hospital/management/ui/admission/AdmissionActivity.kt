package com.hospital.management.ui.admission

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.hospital.management.data.api.RetrofitClient
import com.hospital.management.databinding.ActivityAdmissionBinding
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class AdmissionActivity : AppCompatActivity() {
    private lateinit var binding: ActivityAdmissionBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAdmissionBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnSubmit.setOnClickListener {
            createPatient()
        }
    }

    private fun createPatient() {
        val name = binding.etPatientName.text.toString()
        val dob = binding.etDob.text.toString()
        val phone = binding.etPhone.text.toString()
        val email = binding.etEmail.text.toString()
        val mrn = binding.etMrn.text.toString()

        if (name.isEmpty() || dob.isEmpty() || phone.isEmpty() || mrn.isEmpty()) {
            Toast.makeText(this, "Please fill all required fields", Toast.LENGTH_SHORT).show()
            return
        }

        binding.progressBar.visibility = android.view.View.VISIBLE
        binding.btnSubmit.isEnabled = false

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val apiService = RetrofitClient.getApiService(this@AdmissionActivity)
                val patientRequest = com.hospital.management.data.models.PatientRequest(
                    patientName = name,
                    dateOfBirth = dob,
                    phone = phone,
                    email = if (email.isNotEmpty()) email else null,
                    medicalRecordNumber = mrn
                )
                
                // Cookies with auth tokens are automatically sent by OkHttp CookieJar
                val response = apiService.createPatient(patientRequest)

                withContext(Dispatchers.Main) {
                    binding.progressBar.visibility = android.view.View.GONE
                    binding.btnSubmit.isEnabled = true

                    if (response.isSuccessful && response.body()?.get("success") == true) {
                        Toast.makeText(this@AdmissionActivity, "Patient created successfully", Toast.LENGTH_SHORT).show()
                        finish()
                    } else {
                        Toast.makeText(this@AdmissionActivity, "Failed: ${response.message()}", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    binding.progressBar.visibility = android.view.View.GONE
                    binding.btnSubmit.isEnabled = true
                    Toast.makeText(this@AdmissionActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}
