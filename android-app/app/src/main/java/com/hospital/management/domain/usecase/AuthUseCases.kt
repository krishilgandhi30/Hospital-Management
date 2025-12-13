package com.hospital.management.domain.usecase

import com.hospital.management.data.repository.AuthRepository

class LoginUseCase(private val repository: AuthRepository) {
    suspend operator fun invoke(email: String, password: String) = repository.login(email, password)
}

class VerifyOtpUseCase(private val repository: AuthRepository) {
    suspend operator fun invoke(tempToken: String, otp: String) = repository.verifyOtp(tempToken, otp)
}

class ResendOtpUseCase(private val repository: AuthRepository) {
    suspend operator fun invoke(tempToken: String) = repository.resendOtp(tempToken)
}
