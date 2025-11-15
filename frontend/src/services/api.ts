/**
 * Axios API Service
 * Centralized API communication with interceptors
 */

import axios, { AxiosInstance, AxiosError } from "axios";
import { API_URL } from "../config/constants";
import { persistentLogger } from "../utils/persistentLogger";

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        persistentLogger.log("Axios", "REQUEST START", `${config.baseURL || ""}${config.url || ""}`);
        console.log("[Axios] ===== REQUEST START =====");
        console.log("[Axios] URL:", `${config.baseURL || ""}${config.url || ""}`);
        console.log("[Axios] Method:", config.method);
        console.log("[Axios] Payload:", config.data);
        const token = localStorage.getItem("accessToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          persistentLogger.log("Axios", "Added Authorization header");
          console.log("[Axios] Added Authorization header");
        }
        return config;
      },
      (error) => {
        persistentLogger.error("Axios", "Request interceptor error:", error);
        console.error("[Axios] Request interceptor error:", error);
        return Promise.reject(error);
      },
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        persistentLogger.log("Axios", "RESPONSE SUCCESS", `${response.status} from ${response.config.url}`);
        console.log("[Axios] ===== RESPONSE SUCCESS =====");
        console.log("[Axios] Status:", response.status);
        console.log("[Axios] URL:", response.config.url);
        console.log("[Axios] Response data:", response.data);
        return response;
      },
      async (error: AxiosError) => {
        persistentLogger.error("Axios", "RESPONSE ERROR", `${error.response?.status} from ${error.config?.url}`);
        console.error("[Axios] ===== RESPONSE ERROR =====");
        console.error("[Axios] Status:", error.response?.status);
        console.error("[Axios] URL:", error.config?.url);
        console.error("[Axios] Error message:", error.message);
        console.error("[Axios] Response data:", error.response?.data);
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && originalRequest) {
          const refreshToken = localStorage.getItem("refreshToken");

          if (refreshToken) {
            try {
              persistentLogger.log("Axios", "Attempting token refresh");
              const response = await this.post("/auth/refresh-token", {
                refreshToken,
              });

              const data = response as any;
              localStorage.setItem("accessToken", data.data.accessToken);
              localStorage.setItem("refreshToken", data.data.refreshToken);

              // Retry original request
              originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
              persistentLogger.log("Axios", "Retrying original request after token refresh");
              return this.api(originalRequest);
            } catch (refreshError) {
              persistentLogger.error("Axios", "Token refresh failed:", refreshError);
              localStorage.removeItem("accessToken");
              localStorage.removeItem("refreshToken");
              localStorage.removeItem("tempToken");
              window.location.href = "/login";
              return Promise.reject(refreshError);
            }
          } else {
            persistentLogger.log("Axios", "No refresh token, redirecting to login");
            window.location.href = "/login";
          }
        }

        return Promise.reject(error);
      },
    );
  }

  async get<T>(url: string, config = {}) {
    return this.api.get<T>(url, config);
  }

  async post<T>(url: string, data = {}, config = {}) {
    return this.api.post<T>(url, data, config);
  }

  async put<T>(url: string, data = {}, config = {}) {
    return this.api.put<T>(url, data, config);
  }

  async patch<T>(url: string, data = {}, config = {}) {
    return this.api.patch<T>(url, data, config);
  }

  async delete<T>(url: string, config = {}) {
    return this.api.delete<T>(url, config);
  }

  setAuthToken(token: string) {
    this.api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("accessToken", token);
  }

  removeAuthToken() {
    delete this.api.defaults.headers.common["Authorization"];
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("tempToken");
  }
}

export default new ApiService();
