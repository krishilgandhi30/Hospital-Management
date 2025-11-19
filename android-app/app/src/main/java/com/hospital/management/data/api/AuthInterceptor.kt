package com.hospital.management.data.api

import android.content.Context
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor(private val context: Context) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val builder = chain.request().newBuilder()
        
        // Add cookies if available
        // In a real app, we would use a CookieJar or DataStore to manage cookies
        // For this implementation, we'll assume cookies are handled automatically by OkHttp's CookieJar if configured
        // or we manually add headers if we stored them.
        
        // Since we are using httpOnly cookies, the browser/webview handles them. 
        // For native Android, we need a CookieJar.
        
        return chain.proceed(builder.build())
    }
}
