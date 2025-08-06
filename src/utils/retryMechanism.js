/**
 * Retry mechanism utility for failed operations
 */
import React from "react";
export const retryOperation = async (
  operation,
  maxRetries = 3,
  delay = 1000,
  backoffMultiplier = 2,
) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      return { success: true, data: result };
    } catch (error) {
      lastError = error;

      // Don't retry on certain error types
      if (shouldNotRetry(error)) {
        break;
      }

      // If this was the last attempt, don't wait
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying with exponential backoff
      const waitTime = delay * Math.pow(backoffMultiplier, attempt);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: maxRetries + 1,
  };
};

/**
 * Determines if an error should not be retried
 */
const shouldNotRetry = (error) => {
  // Don't retry on client errors (4xx) except for 408, 429
  if (error?.response?.status >= 400 && error?.response?.status < 500) {
    const retryableClientErrors = [408, 429]; // Request Timeout, Too Many Requests
    return !retryableClientErrors.includes(error.response.status);
  }

  // Don't retry on authentication/authorization errors
  if (error?.response?.status === 401 || error?.response?.status === 403) {
    return true;
  }

  // Don't retry on validation errors
  if (error?.response?.data?.type === "validation") {
    return true;
  }

  return false;
};

/**
 * Retry hook for React components
 */
export const useRetry = () => {
  const [retryCount, setRetryCount] = React.useState(0);

  const retry = React.useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  const reset = React.useCallback(() => {
    setRetryCount(0);
  }, []);

  return { retryCount, retry, reset };
};

/**
 * API call wrapper with automatic retry
 */
export const apiCallWithRetry = async (apiCall, options = {}) => {
  const {
    maxRetries = 3,
    delay = 1000,
    backoffMultiplier = 2,
    onRetry = null,
  } = options;

  return retryOperation(
    async () => {
      if (onRetry) {
        onRetry();
      }
      return await apiCall();
    },
    maxRetries,
    delay,
    backoffMultiplier,
  );
};

/**
 * Network-aware retry (checks if online)
 */
export const networkAwareRetry = async (operation, options = {}) => {
  // Check if browser supports navigator.onLine
  if (typeof navigator !== "undefined" && "onLine" in navigator) {
    if (!navigator.onLine) {
      return {
        success: false,
        error: new Error("No internet connection"),
        offline: true,
      };
    }
  }

  return retryOperation(
    operation,
    options.maxRetries,
    options.delay,
    options.backoffMultiplier,
  );
};

export default {
  retryOperation,
  apiCallWithRetry,
  networkAwareRetry,
  useRetry,
};
