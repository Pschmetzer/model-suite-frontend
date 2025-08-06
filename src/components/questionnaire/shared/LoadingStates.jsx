import React from "react";
import LoadingSpinner from "./LoadingSpinner";

// Skeleton loader for template cards
export const TemplateCardSkeleton = () => (
  <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg p-6 border border-gray-600 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="h-6 bg-gray-600 rounded w-3/4"></div>
      <div className="flex space-x-1">
        <div className="h-5 w-8 bg-gray-600 rounded"></div>
        <div className="h-5 w-8 bg-gray-600 rounded"></div>
      </div>
    </div>

    <div className="space-y-2 mb-4">
      <div className="h-4 bg-gray-600 rounded w-full"></div>
      <div className="h-4 bg-gray-600 rounded w-2/3"></div>
    </div>

    <div className="h-3 bg-gray-600 rounded w-1/3 mb-4"></div>

    <div className="flex space-x-2">
      <div className="h-9 bg-gray-600 rounded flex-1"></div>
      <div className="h-9 bg-gray-600 rounded flex-1"></div>
    </div>

    <div className="flex space-x-2 mt-2">
      <div className="h-9 bg-gray-600 rounded flex-1"></div>
      <div className="h-9 bg-gray-600 rounded w-20"></div>
    </div>
  </div>
);

// Skeleton loader for questionnaire cards
export const QuestionnaireCardSkeleton = () => (
  <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg p-6 border border-gray-600 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1 min-w-0">
        <div className="h-6 bg-gray-600 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-600 rounded w-full"></div>
        <div className="h-4 bg-gray-600 rounded w-2/3 mt-1"></div>
      </div>
      <div className="ml-3 flex-shrink-0">
        <div className="h-6 w-20 bg-gray-600 rounded"></div>
      </div>
    </div>

    <div className="mb-4">
      <div className="flex items-center justify-between text-sm mb-2">
        <div className="h-4 bg-gray-600 rounded w-16"></div>
        <div className="h-4 bg-gray-600 rounded w-10"></div>
      </div>
      <div className="w-full bg-gray-600 rounded-full h-2"></div>
    </div>

    <div className="space-y-2 mb-4">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-600 rounded w-16"></div>
        <div className="h-4 bg-gray-600 rounded w-24"></div>
      </div>
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-600 rounded w-20"></div>
        <div className="h-4 bg-gray-600 rounded w-20"></div>
      </div>
    </div>

    <div className="h-11 bg-gray-600 rounded"></div>
  </div>
);

// Skeleton loader for form sections
export const FormSectionSkeleton = () => (
  <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg p-6 border border-gray-600 animate-pulse">
    <div className="h-6 bg-gray-600 rounded w-1/3 mb-6"></div>

    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-600 rounded w-1/4"></div>
          <div className="h-10 bg-gray-600 rounded w-full"></div>
        </div>
      ))}
    </div>
  </div>
);

// Loading overlay for forms
export const FormLoadingOverlay = ({ message = "Saving..." }) => (
  <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-600 flex items-center space-x-3">
      <LoadingSpinner size="sm" color="blue" />
      <span className="text-white font-medium">{message}</span>
    </div>
  </div>
);

// Inline loading state for buttons
export const ButtonLoadingState = ({
  loading,
  children,
  loadingText = "Loading...",
  className = "",
  ...props
}) => (
  <button
    className={`${className} ${loading ? "cursor-not-allowed opacity-75" : ""}`}
    disabled={loading}
    {...props}
  >
    {loading ? (
      <div className="flex items-center justify-center">
        <LoadingSpinner size="sm" color="white" className="mr-2" />
        {loadingText}
      </div>
    ) : (
      children
    )}
  </button>
);

// Page loading state
export const PageLoadingState = ({ message = "Loading..." }) => (
  <div className="min-h-[400px] flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner size="lg" color="blue" className="mb-4" />
      <p className="text-gray-400 text-lg">{message}</p>
    </div>
  </div>
);

// List loading state with skeletons
export const ListLoadingState = ({
  count = 3,
  SkeletonComponent = TemplateCardSkeleton,
  className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
}) => (
  <div className={className}>
    {Array.from({ length: count }, (_, i) => (
      <SkeletonComponent key={i} />
    ))}
  </div>
);

// Search loading state
export const SearchLoadingState = () => (
  <div className="flex items-center justify-center py-8">
    <div className="flex items-center space-x-2 text-gray-400">
      <LoadingSpinner size="sm" color="gray" />
      <span>Searching...</span>
    </div>
  </div>
);

// Empty state with loading option
export const EmptyState = ({
  title = "No items found",
  description = "There are no items to display.",
  action = null,
  loading = false,
  icon = null,
}) => {
  if (loading) {
    return <PageLoadingState message="Loading items..." />;
  }

  return (
    <div className="text-center py-12">
      {icon || (
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      )}
      <h3 className="mt-2 text-sm font-medium text-gray-300">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export default {
  TemplateCardSkeleton,
  QuestionnaireCardSkeleton,
  FormSectionSkeleton,
  FormLoadingOverlay,
  ButtonLoadingState,
  PageLoadingState,
  ListLoadingState,
  SearchLoadingState,
  EmptyState,
};
