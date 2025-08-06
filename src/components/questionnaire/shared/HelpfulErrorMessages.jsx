import React from "react";
import Button from "../../ui/Button";

// Error message mapping with helpful suggestions
const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: {
    title: "Connection Problem",
    message: "Unable to connect to the server.",
    suggestions: [
      "Check your internet connection",
      "Try refreshing the page",
      "Contact support if the problem persists",
    ],
    icon: "network",
  },

  // Validation errors
  VALIDATION_ERROR: {
    title: "Invalid Information",
    message: "Please check the information you entered.",
    suggestions: [
      "Make sure all required fields are filled",
      "Check that email addresses are valid",
      "Ensure dates are in the correct format",
    ],
    icon: "warning",
  },

  // Permission errors
  PERMISSION_DENIED: {
    title: "Access Denied",
    message: "You don't have permission to perform this action.",
    suggestions: [
      "Make sure you're logged in",
      "Contact your administrator for access",
      "Try logging out and back in",
    ],
    icon: "lock",
  },

  // Template errors
  TEMPLATE_NOT_FOUND: {
    title: "Template Not Found",
    message: "The questionnaire template could not be found.",
    suggestions: [
      "The template may have been deleted",
      "Check if you have the correct permissions",
      "Try refreshing the page",
    ],
    icon: "document",
  },

  // Assignment errors
  ASSIGNMENT_ERROR: {
    title: "Assignment Problem",
    message: "Unable to assign the questionnaire.",
    suggestions: [
      "Make sure the models are still active",
      "Check if the template is complete",
      "Try assigning to fewer models at once",
    ],
    icon: "users",
  },

  // Submission errors
  SUBMISSION_ERROR: {
    title: "Submission Failed",
    message: "Your questionnaire could not be submitted.",
    suggestions: [
      "Check that all required questions are answered",
      "Make sure your answers are valid",
      "Try saving as draft first, then submit",
    ],
    icon: "exclamation",
  },

  // Server errors
  SERVER_ERROR: {
    title: "Server Problem",
    message: "The server is experiencing issues.",
    suggestions: [
      "Try again in a few minutes",
      "Check if other features are working",
      "Contact support if the problem continues",
    ],
    icon: "server",
  },
};

const getIcon = (iconType) => {
  const iconClasses = "w-6 h-6";

  switch (iconType) {
    case "network":
      return (
        <svg
          className={`${iconClasses} text-yellow-400`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"
          />
        </svg>
      );
    case "warning":
      return (
        <svg
          className={`${iconClasses} text-yellow-400`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      );
    case "lock":
      return (
        <svg
          className={`${iconClasses} text-red-400`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
      );
    case "document":
      return (
        <svg
          className={`${iconClasses} text-blue-400`}
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
      );
    case "users":
      return (
        <svg
          className={`${iconClasses} text-purple-400`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          />
        </svg>
      );
    case "server":
      return (
        <svg
          className={`${iconClasses} text-red-400`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3V6a3 3 0 013-3h13.5a3 3 0 013 3v5.25a3 3 0 01-3 3m-16.5 0a3 3 0 013-3h13.5a3 3 0 013 3v5.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3v-5.25z"
          />
        </svg>
      );
    default:
      return (
        <svg
          className={`${iconClasses} text-gray-400`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      );
  }
};

const HelpfulErrorMessage = ({
  error,
  errorType = null,
  onRetry = null,
  onGoBack = null,
  customMessage = null,
  customSuggestions = null,
  className = "",
}) => {
  // Determine error type from error object or use provided type
  const determineErrorType = () => {
    if (errorType) return errorType;

    if (error?.code) return error.code;
    if (error?.response?.status === 404) return "TEMPLATE_NOT_FOUND";
    if (error?.response?.status === 403 || error?.response?.status === 401)
      return "PERMISSION_DENIED";
    if (error?.response?.status >= 500) return "SERVER_ERROR";
    if (error?.response?.data?.type === "validation") return "VALIDATION_ERROR";
    if (error?.message?.includes("Network Error")) return "NETWORK_ERROR";

    return "UNKNOWN_ERROR";
  };

  const type = determineErrorType();
  const errorInfo = ERROR_MESSAGES[type] ||
    ERROR_MESSAGES["UNKNOWN_ERROR"] || {
      title: "Something went wrong",
      message: "An unexpected error occurred.",
      suggestions: [
        "Try refreshing the page",
        "Contact support if the problem persists",
      ],
      icon: "exclamation",
    };

  const title = customMessage?.title || errorInfo.title;
  const message = customMessage?.message || errorInfo.message;
  const suggestions = customSuggestions || errorInfo.suggestions;

  return (
    <div
      className={`bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg border border-gray-600 p-6 ${className}`}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">{getIcon(errorInfo.icon)}</div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>

          <p className="text-gray-400 mb-4">{message}</p>

          {suggestions && suggestions.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                Try these solutions:
              </h4>
              <ul className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="flex items-start space-x-2 text-sm text-gray-400"
                  >
                    <span className="text-blue-400 mt-1">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {onRetry && (
              <Button
                onClick={onRetry}
                className="min-h-[44px] touch-manipulation"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Try Again
              </Button>
            )}

            {onGoBack && (
              <Button
                variant="outline"
                onClick={onGoBack}
                className="min-h-[44px] touch-manipulation"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Go Back
              </Button>
            )}
          </div>

          {/* Show technical details in development */}
          {import.meta.env.DEV && error && (
            <details className="mt-4">
              <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-400">
                Technical Details (Development)
              </summary>
              <div className="mt-2 p-3 bg-gray-900 rounded border text-xs text-gray-300 overflow-auto">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(error, null, 2)}
                </pre>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

// Quick error message for inline use
export const InlineErrorMessage = ({ message, onDismiss }) => (
  <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 flex items-center justify-between">
    <div className="flex items-center space-x-2">
      <svg
        className="w-4 h-4 text-red-400 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="text-red-300 text-sm">{message}</span>
    </div>
    {onDismiss && (
      <button
        onClick={onDismiss}
        className="text-red-400 hover:text-red-300 ml-2"
        aria-label="Dismiss error"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    )}
  </div>
);

export default HelpfulErrorMessage;
