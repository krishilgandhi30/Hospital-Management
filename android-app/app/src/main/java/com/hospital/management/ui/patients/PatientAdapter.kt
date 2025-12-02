package com.hospital.management.ui.patients

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.hospital.management.data.models.Patient
import com.hospital.management.databinding.ItemPatientBinding

class PatientAdapter(
    private val patients: List<Patient>,
    private val onPatientClick: (Patient) -> Unit
) : RecyclerView.Adapter<PatientAdapter.PatientViewHolder>() {

    inner class PatientViewHolder(private val binding: ItemPatientBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(patient: Patient) {
            binding.tvPatientName.text = patient.patientName
            binding.tvMrn.text = "MRN: ${patient.medicalRecordNumber}"
            binding.tvPhone.text = patient.phone
            binding.tvDob.text = "DOB: ${patient.dateOfBirth}"

            binding.root.setOnClickListener {
                onPatientClick(patient)
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PatientViewHolder {
        val binding = ItemPatientBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return PatientViewHolder(binding)
    }

    override fun onBindViewHolder(holder: PatientViewHolder, position: Int) {
        holder.bind(patients[position])
    }

    override fun getItemCount() = patients.size
}
