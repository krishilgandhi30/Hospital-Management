/**
 * Auth Context & Hook
 * Manages authentication state globally
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { Hospital, AuthState } from "../types/auth";
import authService from "../services/authService";

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    hospital: null,
    accessToken: null,
    refreshToken: null,
    tempToken: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  });

  // Load stored data on mount
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    const hospitalData = localStorage.getItem("hospital");

    if (accessToken && hospitalData) {
      setState((prev) => ({
        ...prev,
        accessToken,
        refreshToken,
        hospital: JSON.parse(hospitalData),
        isAuthenticated: true,
      }));
    }
  }, []);

  const login = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await authService.login(email, password);
      authService.storeTempToken(response.data.tempToken);

      setState((prev) => ({
        ...prev,
        tempToken: response.data.tempToken,
        loading: false,
        error: null,
      }));
    } catch (error: any) {
      const errorMessage = error.message || error.response?.message || "Login failed";
      console.error("[useAuth] Login failed:", errorMessage);
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      throw error;
    }
  };

  const verifyOtp = async (otp: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await authService.verifyOtp(otp);
      authService.storeTokens(response.data.accessToken, response.data.refreshToken);
      localStorage.setItem("hospital", JSON.stringify(response.data.hospital));

      setState((prev) => ({
        ...prev,
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        hospital: response.data.hospital,
        isAuthenticated: true,
        tempToken: null,
        loading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.message || error.response?.message || "OTP verification failed";
      console.error("[useAuth] OTP verification failed:", errorMessage);
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (state.refreshToken) {
        await authService.logout(state.refreshToken);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      authService.clearTokens();
      setState({
        hospital: null,
        accessToken: null,
        refreshToken: null,
        tempToken: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        state,
        login,
        verifyOtp,
        logout,
        isAuthenticated: state.isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
