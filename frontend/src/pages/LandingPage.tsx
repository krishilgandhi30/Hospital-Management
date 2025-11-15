/**
 * Landing Page
 * Shows hospital info and navigation to patients
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/Button";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAuth();

  const handleShowPatients = () => {
    navigate("/patients");
  };

  const hospital = state.hospital;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center px-4">
      <div className="max-w-2xl text-center">
        {hospital?.logoUrl && <img src={hospital.logoUrl} alt={hospital.hospitalName} className="w-24 h-24 mx-auto mb-6 rounded-lg shadow-lg" />}

        <h1 className="text-5xl font-bold text-gray-800 mb-4">{hospital?.hospitalName || "Hospital"}</h1>
        <p className="text-xl text-gray-600 mb-8">Patient Records Management System</p>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <p className="text-gray-700 mb-6">Access and manage patient medical records, folders, and documents securely in one place.</p>

          <div className="grid grid-cols-3 gap-4 mb-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">📁</div>
              <p className="text-sm text-gray-600 mt-2">Organized Folders</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">📥</div>
              <p className="text-sm text-gray-600 mt-2">Easy Download</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">🔒</div>
              <p className="text-sm text-gray-600 mt-2">Secure Access</p>
            </div>
          </div>

          <Button
            label="View Patients"
            onClick={handleShowPatients}
            variant="primary"
            size="lg"
            fullWidth
            icon={
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
              </svg>
            }
          />
        </div>

        <div className="text-gray-600 text-sm">
          <p>
            Logged in as: <strong>{hospital?.hospitalName}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
