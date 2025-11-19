package com.hospital.management.data.api

import android.content.Context
import okhttp3.JavaNetCookieJar
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.net.CookieManager
import java.net.CookiePolicy
import java.util.concurrent.TimeUnit

object RetrofitClient {
    private const val BASE_URL = "http://10.0.2.2:5000" // Emulator localhost

    private var retrofit: Retrofit? = null

    fun getClient(context: Context): Retrofit {
        if (retrofit == null) {
            val cookieManager = CookieManager()
            cookieManager.setCookiePolicy(CookiePolicy.ACCEPT_ALL)

            val client = OkHttpClient.Builder()
                .cookieJar(JavaNetCookieJar(cookieManager))
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build()

            retrofit = Retrofit.Builder()
                .baseUrl(BASE_URL)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
        }
        return retrofit!!
    }
    
    fun getApiService(context: Context): ApiService {
        return getClient(context).create(ApiService::class.java)
    }
}
