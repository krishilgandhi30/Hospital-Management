/**
 * Logo Header Component
 * Displays hospital logo and name
 */

import React from "react";

interface LogoHeaderProps {
  logoUrl?: string;
  hospitalName?: string;
  subtitle?: string;
}

export const LogoHeader: React.FC<LogoHeaderProps> = ({ logoUrl = "https://via.placeholder.com/60?text=Hospital", hospitalName = "Hospital Management", subtitle }) => {
  return (
    <div className="text-center mb-8 animate-slideIn">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
          <img
            src={logoUrl}
            alt="Hospital Logo"
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              const fallback = "https://via.placeholder.com/60?text=Hospital";
              // Prevent infinite onError loop: only replace src once
              if (img.dataset.fallbackApplied !== "true") {
                img.dataset.fallbackApplied = "true";
                img.src = fallback;
              } else {
                // If fallback also fails, stop further attempts
                img.style.display = "none";
              }
            }}
          />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-gray-900">{hospitalName}</h1>
      {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
    </div>
  );
};

export default LogoHeader;
