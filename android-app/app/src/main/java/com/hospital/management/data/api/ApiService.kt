package com.hospital.management.data.api

import okhttp3.MultipartBody
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    @POST("/api/auth/login")
    suspend fun login(@Body body: Map<String, String>): Response<Map<String, Any>>

    @POST("/api/auth/verify-otp")
    suspend fun verifyOtp(@Body body: Map<String, String>): Response<Map<String, Any>>

    @POST("/api/patients")
    suspend fun createPatient(@Body body: Map<String, Any>): Response<Map<String, Any>>

    @Multipart
    @POST("/api/patients/{patientId}/files/{folderName}")
    suspend fun uploadFile(
        @Path("patientId") patientId: String,
        @Path("folderName") folderName: String,
        @Part file: MultipartBody.Part
    ): Response<Map<String, Any>>
}
