/**
 * OTP Verification Page
 * 6-digit OTP input with resend functionality and auto-verification
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OtpInput } from "../components/OtpInput";
import { Button } from "../components/Button";
import { LogoHeader } from "../components/LogoHeader";
import { ErrorMessage } from "../components/ErrorMessage";
import { CountdownTimer } from "../components/CountdownTimer";
import { useAuth } from "../hooks/useAuth";
import authService from "../services/authService";
import { getOtpError } from "../utils/validator";
import { OTP_LENGTH } from "../config/constants";

export const OtpVerification: React.FC = () => {
  const navigate = useNavigate();
  const { state, verifyOtp } = useAuth();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Redirect if no tempToken (not coming from login)
  useEffect(() => {
    const tempToken = localStorage.getItem("tempToken");
    if (!tempToken) {
      navigate("/login");
    }
  }, [navigate]);

  // Auto-verify when OTP is complete
  useEffect(() => {
    if (otp.length === OTP_LENGTH && !state.loading) {
      handleVerify();
    }
  }, [otp, state.loading]);

  const handleVerify = async () => {
    const otpError = getOtpError(otp, OTP_LENGTH);
    if (otpError) {
      setError(otpError);
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      await verifyOtp(otp);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "OTP verification failed. Please try again.");
      setOtp("");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      // Call resend OTP API
      await authService.resendOtp();
      setOtp("");
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setIsResending(false);
    }
  };

  const hospitalName = state.hospital?.hospitalName || "Hospital";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8 animate-fadeIn">
        <LogoHeader hospitalName={hospitalName} subtitle="Verify Your Identity" />

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-800">
          <p className="font-semibold mb-1">OTP Sent Successfully</p>
          <p>
            We've sent a 6-digit code to <strong>+91 XXXXX1234</strong>
          </p>
        </div>

        {error && <ErrorMessage message={error} type="error" onClose={() => setError("")} />}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="space-y-6 mt-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">Enter 6-Digit OTP</label>
            <OtpInput length={OTP_LENGTH} value={otp} onChange={setOtp} disabled={isVerifying || state.loading} error={error && otp.length === OTP_LENGTH ? error : ""} />
          </div>

          <Button
            label={isVerifying ? "Verifying..." : "Verify OTP"}
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={otp.length !== OTP_LENGTH || isVerifying || state.loading}
            loading={isVerifying || state.loading}
          />
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Didn't receive code?</span>
          </div>
          <div className="mt-3">
            <CountdownTimer initialSeconds={30} onResendClick={handleResend} isResending={isResending} />
          </div>
        </div>

        <div className="mt-4 text-center">
          <Button
            label="Back to Login"
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              localStorage.removeItem("tempToken");
              navigate("/login");
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default OtpVerification;
