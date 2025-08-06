import React from "react";

const SkeletonBox = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-800/60 rounded-lg ${className}`}></div>
);

const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen px-6 bg-gradient-to-br from-gray-950 to-gray-900 text-white">
      <div className="max-w-8xl py-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-10 border-b border-gray-800 pb-6">
          <div className="flex items-center gap-4">
            <SkeletonBox className="h-12 w-12" />
            <div>
              <SkeletonBox className="h-6 w-40 mb-2" />
              <SkeletonBox className="h-4 w-52" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBox className="h-10 w-10" />
            <SkeletonBox className="h-10 w-10" />
          </div>
        </div>

        {/* Top Row Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {[1, 2, 3].map((i) => (
            <SkeletonBox key={i} className="h-40 w-full" />
          ))}
        </div>

        {/* Questionnaire Overview Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <SkeletonBox className="h-8 w-60" />
          <SkeletonBox className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBox key={i} className="h-32 w-full" />
          ))}
        </div>

        {/* Middle Row Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <SkeletonBox className="h-56 w-full" />
          <SkeletonBox className="h-56 w-full" />
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
