import React from "react";
import { useSelector } from "react-redux";
import { AlertCircle, Clock, CheckCircle, RefreshCw } from "lucide-react";
import { captionUtils } from "../../services/captionService.js";

const QuotaDisplay = ({ className = "" }) => {
  const { quotaStatus, quotaLoading, quotaError } = useSelector(
    (state) => state.caption,
  );

  const {
    usageCount = 0,
    quotaRemaining = 5,
    resetTime,
    dailyLimit = 5,
  } = quotaStatus;

  const progressPercentage = ((dailyLimit - quotaRemaining) / dailyLimit) * 100;
  const isNearLimit = captionUtils.isQuotaNearLimit(quotaRemaining, dailyLimit);
  const isExhausted = quotaRemaining <= 0;

  if (quotaLoading) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 ${className}`}
      >
        <div className="flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin text-gray-500 mr-2" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Loading quota status...
          </span>
        </div>
      </div>
    );
  }

  if (quotaError) {
    return (
      <div
        className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 ${className}`}
      >
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
          <span className="text-sm text-red-600 dark:text-red-400">
            Failed to load quota status
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 ${className}`}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Daily Usage
          </h3>
          <div className="flex items-center space-x-1">
            {isExhausted ? (
              <AlertCircle className="w-4 h-4 text-red-500" />
            ) : isNearLimit ? (
              <AlertCircle className="w-4 h-4 text-orange-500" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
            <span
              className={`text-sm font-medium ${
                isExhausted
                  ? "text-red-600 dark:text-red-400"
                  : isNearLimit
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-green-600 dark:text-green-400"
              }`}
            >
              {quotaRemaining} / {dailyLimit}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Used: {usageCount}</span>
            <span>Remaining: {quotaRemaining}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                isExhausted
                  ? "bg-red-500"
                  : isNearLimit
                    ? "bg-orange-500"
                    : "bg-gradient-to-r from-blue-500 to-green-500"
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Status Message */}
        <div className="text-xs">
          {isExhausted ? (
            <div className="text-red-600 dark:text-red-400 space-y-1">
              <p className="font-medium">⚠️ Daily limit reached</p>
              {resetTime && (
                <p>Resets in: {captionUtils.formatResetTime(resetTime)}</p>
              )}
            </div>
          ) : isNearLimit ? (
            <div className="text-orange-600 dark:text-orange-400">
              <p>🟡 Running low on daily quota</p>
            </div>
          ) : (
            <div className="text-gray-600 dark:text-gray-400">
              <p>
                ✅ You have {quotaRemaining} caption
                {quotaRemaining !== 1 ? "s" : ""} remaining today
              </p>
            </div>
          )}

          {resetTime && !isExhausted && (
            <div className="flex items-center mt-1 text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3 mr-1" />
              <span>Resets in: {captionUtils.formatResetTime(resetTime)}</span>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 Your quota resets daily at midnight UTC
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuotaDisplay;
