package com.hospital.management.ui.patients

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.hospital.management.data.api.RetrofitClient
import com.hospital.management.data.models.Patient
import com.hospital.management.databinding.ActivityPatientListBinding
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class PatientListActivity : AppCompatActivity() {
    private lateinit var binding: ActivityPatientListBinding
    private lateinit var adapter: PatientAdapter
    private val patients = mutableListOf<Patient>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPatientListBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupRecyclerView()
        setupClickListeners()
        loadPatients()
    }

    private fun setupRecyclerView() {
        adapter = PatientAdapter(patients) { patient ->
            // Navigate to patient details/folders
            val intent = Intent(this, com.hospital.management.FolderViewActivity::class.java)
            intent.putExtra("PATIENT_ID", patient._id)
            intent.putExtra("PATIENT_NAME", patient.patientName)
            startActivity(intent)
        }

        binding.rvPatients.layoutManager = LinearLayoutManager(this)
        binding.rvPatients.adapter = adapter
    }

    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener {
            finish()
        }

        binding.swipeRefresh.setOnRefreshListener {
            loadPatients()
        }
    }

    private fun loadPatients() {
        binding.progressBar.visibility = View.VISIBLE
        binding.swipeRefresh.isRefreshing = true

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val apiService = RetrofitClient.getApiService(this@PatientListActivity)
                val response = apiService.getPatients(limit = 100, skip = 0)

                withContext(Dispatchers.Main) {
                    binding.progressBar.visibility = View.GONE
                    binding.swipeRefresh.isRefreshing = false

                    if (response.isSuccessful && response.body()?.get("success") == true) {
                        val data = response.body()?.get("data") as? Map<*, *>
                        val patientsList = data?.get("patients") as? List<*>

                        patients.clear()
                        patientsList?.forEach { item ->
                            val patientMap = item as? Map<*, *>
                            if (patientMap != null) {
                                patients.add(
                                    Patient(
                                        _id = patientMap["_id"] as? String ?: "",
                                        patientName = patientMap["patientName"] as? String ?: "",
                                        email = patientMap["email"] as? String,
                                        phone = patientMap["phone"] as? String ?: "",
                                        dateOfBirth = patientMap["dateOfBirth"] as? String ?: "",
                                        medicalRecordNumber = patientMap["medicalRecordNumber"] as? String ?: "",
                                        hospitalId = patientMap["hospitalId"] as? String ?: "",
                                        folders = emptyList(),
                                        status = patientMap["status"] as? String ?: "active",
                                        createdAt = patientMap["createdAt"] as? String ?: ""
                                    )
                                )
                            }
                        }

                        adapter.notifyDataSetChanged()

                        if (patients.isEmpty()) {
                            binding.tvEmpty.visibility = View.VISIBLE
                            binding.rvPatients.visibility = View.GONE
                        } else {
                            binding.tvEmpty.visibility = View.GONE
                            binding.rvPatients.visibility = View.VISIBLE
                        }
                    } else {
                        Toast.makeText(
                            this@PatientListActivity,
                            "Failed to load patients",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    binding.progressBar.visibility = View.GONE
                    binding.swipeRefresh.isRefreshing = false
                    Toast.makeText(
                        this@PatientListActivity,
                        "Error: ${e.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    }
}
