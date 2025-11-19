package com.hospital.management.ui.auth

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.hospital.management.data.api.RetrofitClient
import com.hospital.management.databinding.ActivityLoginBinding
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class LoginActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLoginBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnLogin.setOnClickListener {
            val hospitalId = binding.etHospitalId.text.toString()
            val password = binding.etPassword.text.toString()

            if (hospitalId.isNotEmpty() && password.isNotEmpty()) {
                login(hospitalId, password)
            } else {
                Toast.makeText(this, "Please enter Hospital ID and Password", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun login(hospitalId: String, password: String) {
        binding.progressBar.visibility = android.view.View.VISIBLE
        binding.btnLogin.isEnabled = false

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val apiService = RetrofitClient.getApiService(this@LoginActivity)
                val response = apiService.login(mapOf("hospitalId" to hospitalId, "password" to password))

                withContext(Dispatchers.Main) {
                    binding.progressBar.visibility = android.view.View.GONE
                    binding.btnLogin.isEnabled = true

                    if (response.isSuccessful && response.body()?.get("success") == true) {
                        val intent = Intent(this@LoginActivity, OtpActivity::class.java)
                        intent.putExtra("hospitalId", hospitalId)
                        startActivity(intent)
                        finish()
                    } else {
                        Toast.makeText(this@LoginActivity, "Login failed: ${response.message()}", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    binding.progressBar.visibility = android.view.View.GONE
                    binding.btnLogin.isEnabled = true
                    Toast.makeText(this@LoginActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}
