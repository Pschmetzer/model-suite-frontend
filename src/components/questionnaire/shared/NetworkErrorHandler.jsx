import React from "react";
import Button from "../../ui/Button";

const NetworkErrorHandler = ({
  error,
  onRetry,
  onGoBack,
  title = "Connection Error",
  message = "Unable to connect to the server. Please check your internet connection and try again.",
}) => {
  const getErrorMessage = () => {
    if (typeof error === "string") return error;
    if (error?.message) return error.message;
    if (error?.response?.data?.message) return error.response.data.message;
    return message;
  };

  const getErrorType = () => {
    if (!error) return "network";
    if (
      error?.code === "NETWORK_ERROR" ||
      error?.message?.includes("Network Error")
    )
      return "network";
    if (error?.response?.status >= 500) return "server";
    if (error?.response?.status === 404) return "notfound";
    if (error?.response?.status === 403 || error?.response?.status === 401)
      return "permission";
    return "unknown";
  };

  const errorType = getErrorType();

  const getIcon = () => {
    switch (errorType) {
      case "network":
        return (
          <svg
            className="mx-auto h-16 w-16 text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"
            />
          </svg>
        );
      case "server":
        return (
          <svg
            className="mx-auto h-16 w-16 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3V6a3 3 0 013-3h13.5a3 3 0 013 3v5.25a3 3 0 01-3 3m-16.5 0a3 3 0 013-3h13.5a3 3 0 013 3v5.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3v-5.25z"
            />
          </svg>
        );
      case "permission":
        return (
          <svg
            className="mx-auto h-16 w-16 text-orange-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        );
    }
  };

  const getTitle = () => {
    switch (errorType) {
      case "network":
        return "Connection Problem";
      case "server":
        return "Server Error";
      case "permission":
        return "Access Denied";
      case "notfound":
        return "Not Found";
      default:
        return title;
    }
  };

  const getMessage = () => {
    switch (errorType) {
      case "network":
        return "Please check your internet connection and try again.";
      case "server":
        return "The server is experiencing issues. Please try again in a few moments.";
      case "permission":
        return "You don't have permission to access this resource.";
      case "notfound":
        return "The requested resource could not be found.";
      default:
        return getErrorMessage();
    }
  };

  return (
    <div className="min-h-[300px] flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg border border-gray-600 p-8">
      <div className="text-center max-w-md">
        <div className="mb-6">{getIcon()}</div>

        <h3 className="text-xl font-semibold text-white mb-2">{getTitle()}</h3>

        <p className="text-gray-400 mb-6">{getMessage()}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
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

        {error?.response?.status && (
          <p className="text-xs text-gray-500 mt-4">
            Error Code: {error.response.status}
          </p>
        )}
      </div>
    </div>
  );
};

export default NetworkErrorHandler;
