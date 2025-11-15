/**
 * Dashboard Page (Protected)
 * Placeholder for authenticated users
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { useAuth } from "../hooks/useAuth";

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome, {state.hospital?.hospitalName}!</h1>
          <p className="text-gray-600">You have successfully authenticated with 2FA.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Hospital Details</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="font-semibold text-blue-700">Email:</dt>
                <dd className="text-blue-600">{state.hospital?.email}</dd>
              </div>
              <div>
                <dt className="font-semibold text-blue-700">Phone:</dt>
                <dd className="text-blue-600">{state.hospital?.phone}</dd>
              </div>
              <div>
                <dt className="font-semibold text-blue-700">Department:</dt>
                <dd className="text-blue-600">{state.hospital?.department || "N/A"}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Session Info</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="font-semibold text-green-700">Authentication:</dt>
                <dd className="text-green-600">✓ 2FA Verified</dd>
              </div>
              <div>
                <dt className="font-semibold text-green-700">Access Token:</dt>
                <dd className="text-green-600">Active (24h validity)</dd>
              </div>
              <div>
                <dt className="font-semibold text-green-700">Device:</dt>
                <dd className="text-green-600">Single-device mode</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="text-center space-y-4">
          <p className="text-gray-600 mb-4">This is a demonstration dashboard. Implement your application features here.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button label="Manage Patients" type="button" variant="primary" size="lg" onClick={() => navigate("/patients")} />
            <Button label="Logout" type="button" variant="danger" size="lg" onClick={handleLogout} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
