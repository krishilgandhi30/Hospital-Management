package com.hospital.management.ui.auth

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.hospital.management.data.api.RetrofitClient
import com.hospital.management.databinding.ActivityOtpBinding
import com.hospital.management.ui.dashboard.DashboardActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class OtpActivity : AppCompatActivity() {
    private lateinit var binding: ActivityOtpBinding
    private lateinit var hospitalId: String

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityOtpBinding.inflate(layoutInflater)
        setContentView(binding.root)

        hospitalId = intent.getStringExtra("hospitalId") ?: ""

        binding.btnVerify.setOnClickListener {
            val otp = binding.etOtp.text.toString()

            if (otp.length == 6) {
                verifyOtp(otp)
            } else {
                Toast.makeText(this, "Please enter a valid 6-digit OTP", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun verifyOtp(otp: String) {
        binding.progressBar.visibility = android.view.View.VISIBLE
        binding.btnVerify.isEnabled = false

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val apiService = RetrofitClient.getApiService(this@OtpActivity)
                val response = apiService.verifyOtp(mapOf("hospitalId" to hospitalId, "otp" to otp))

                withContext(Dispatchers.Main) {
                    binding.progressBar.visibility = android.view.View.GONE
                    binding.btnVerify.isEnabled = true

                    if (response.isSuccessful && response.body()?.get("success") == true) {
                        val intent = Intent(this@OtpActivity, DashboardActivity::class.java)
                        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                        startActivity(intent)
                        finish()
                    } else {
                        Toast.makeText(this@OtpActivity, "Verification failed: ${response.message()}", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    binding.progressBar.visibility = android.view.View.GONE
                    binding.btnVerify.isEnabled = true
                    Toast.makeText(this@OtpActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}
