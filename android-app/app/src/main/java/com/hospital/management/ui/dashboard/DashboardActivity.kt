package com.hospital.management.ui.dashboard

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.hospital.management.databinding.ActivityDashboardBinding
import com.hospital.management.ui.admission.AdmissionActivity
import com.hospital.management.ui.scanner.ScannerActivity

class DashboardActivity : AppCompatActivity() {
    private lateinit var binding: ActivityDashboardBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnNewAdmission.setOnClickListener {
            startActivity(Intent(this, AdmissionActivity::class.java))
        }

        binding.btnScanDocument.setOnClickListener {
            startActivity(Intent(this, ScannerActivity::class.java))
        }
    }
}
