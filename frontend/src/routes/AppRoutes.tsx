/**
 * Application Routes
 * Defines all application routes and redirects
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../hooks/useAuth";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { ErrorBoundary } from "../components/ErrorBoundary";
import Login from "../pages/Login";
import OtpVerification from "../pages/OtpVerification";
import Dashboard from "../pages/Dashboard";
import PatientDetails from "../pages/PatientDetails";
import FolderView from "../pages/FolderView";

export const AppRoutes: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/verify-otp" element={<OtpVerification />} />

            {/* Patient Management Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="/patients/:patientId"
              element={
                <ProtectedRoute>
                  <PatientDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients/:patientId/folders/:folderName"
              element={
                <ProtectedRoute>
                  <FolderView />
                </ProtectedRoute>
              }
            />

            {/* Catch All - Redirect to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default AppRoutes;
