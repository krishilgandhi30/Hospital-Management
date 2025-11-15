/**
 * Skeleton Loader Component
 * Animated loading placeholders
 */

import React from "react";

interface SkeletonLoaderProps {
  count?: number;
  height?: string;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ count = 1, height = "h-12", className = "" }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`bg-gray-200 rounded-lg mb-4 animate-pulse ${height} ${className}`} />
      ))}
    </>
  );
};

export default SkeletonLoader;
