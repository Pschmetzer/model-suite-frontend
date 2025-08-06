import React from "react";

// Simple skeleton box for re-use
const SkeletonBox = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-800/60 rounded-lg ${className}`}></div>
);

const AgencyLayoutSkeleton = () => {
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-950 to-gray-900">
      {/* Sidebar Skeleton */}
      <div className="w-20 shrink-0 flex flex-col items-center py-6 gap-4 border-r border-gray-800">
        {[...Array(6)].map((_, i) => (
          <SkeletonBox key={i} className="h-10 w-10 mb-2" />
        ))}
        <div className="flex-1" />
        <SkeletonBox className="h-8 w-8 mb-2" />
      </div>

      {/* AgencyMenu Skeleton */}
      <div className="shrink-0 border-l border-gray-800 flex flex-col items-center py-6 gap-4 w-24">
        {[...Array(4)].map((_, i) => (
          <SkeletonBox key={i} className="h-8 w-8 mb-4" />
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="flex flex-col flex-grow overflow-hidden">
        {/* Navbar Skeleton */}
        <div className="h-16 px-8 flex items-center border-b border-gray-800">
          <SkeletonBox className="h-10 w-10 rounded-full mr-4" />
          <SkeletonBox className="h-6 w-40 mr-8" />
          <SkeletonBox className="h-8 w-8 ml-auto" />
        </div>
        {/* Outlet/content skeleton */}
        <main className="flex-grow overflow-y-auto p-8">
          <div className="max-w-8xl mx-auto">
            <SkeletonBox className="h-12 w-1/3 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              {[1, 2, 3].map((i) => (
                <SkeletonBox key={i} className="h-40 w-full" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonBox key={i} className="h-32 w-full" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              <SkeletonBox className="h-56 w-full" />
              <SkeletonBox className="h-56 w-full" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AgencyLayoutSkeleton;
