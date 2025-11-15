/**
 * Patient Details Page
 * Displays patient information and folders
 */

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchPatientById } from "../services/patientApi";
import { Button } from "../components/Button";
import { SkeletonLoader } from "../components/SkeletonLoader";
import { Toast } from "../components/Toast";
import type { Patient, Folder } from "../services/patientApi";

export const PatientDetails: React.FC = () => {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    loadPatient();
  }, [patientId]);

  const loadPatient = async () => {
    if (!patientId) return;

    try {
      setLoading(true);
      const data = (await fetchPatientById(patientId)) as any;
      setPatient(data);
    } catch (error: any) {
      setToast({
        message: error.message || "Failed to load patient details",
        type: "error",
      });
      setTimeout(() => navigate("/patients"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (folderName: string) => {
    if (patientId) {
      navigate(`/patients/${patientId}/files/${folderName}`);
    }
  };

  const handleBack = () => {
    navigate("/patients");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Button label="← Back to Patients" onClick={handleBack} variant="secondary" size="sm" className="mb-6" />

        {loading ? (
          <div className="bg-white rounded-lg shadow p-8">
            <SkeletonLoader count={3} />
          </div>
        ) : patient ? (
          <>
            {/* Patient Info Card */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-blue-600 to-blue-400 px-6 py-8">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{patient.patientName}</h1>
                    <p className="text-blue-100">Medical Record #: {patient.medicalRecordNumber || "N/A"}</p>
                  </div>
                  <div className="w-20 h-20 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Patient Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                  <p className="text-gray-900">{patient.email || "—"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                  <p className="text-gray-900">{patient.phone || "—"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                  <p className="text-gray-900">{(patient as any).status || "Active"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Joined</label>
                  <p className="text-gray-900">{patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : "—"}</p>
                </div>
              </div>
            </div>

            {/* Folders Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Medical Folders ({patient.folders?.length || 0})</h2>

              {!patient.folders || patient.folders.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No Folders</h3>
                  <p className="text-gray-600">No medical folders available for this patient</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {patient.folders.map((folder: Folder, index: number) => (
                    <div key={index} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleFolderClick(folder.name)}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                          </svg>
                        </div>
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {folder.files?.length || 0} file{folder.files?.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{folder.name}</h3>

                      <p className="text-sm text-gray-600 mb-4">Created: {folder.createdAt ? new Date(folder.createdAt).toLocaleDateString() : "—"}</p>

                      <div className="flex gap-2">
                        <Button label="View Files →" onClick={() => handleFolderClick(folder.name)} variant="primary" size="sm" fullWidth />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">Patient not found</p>
            <Button label="Back to Patients" onClick={handleBack} variant="primary" size="sm" className="mt-4" />
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default PatientDetails;
