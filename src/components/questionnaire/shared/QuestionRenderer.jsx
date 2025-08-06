import React from "react";

const QuestionRenderer = ({
  question,
  value,
  onChange,
  error,
  disabled = false,
  className = "",
}) => {
  const handleChange = (newValue) => {
    if (!disabled) {
      onChange(question._id, newValue);
    }
  };

  const baseInputClasses = `
    w-full px-3 py-2 border rounded-lg transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    text-sm bg-gray-800 border-gray-600 text-white placeholder-gray-400
    ${
      error
        ? "border-red-500 bg-red-900/20 focus:ring-red-400 focus:border-red-400"
        : "hover:border-gray-500"
    }
    ${disabled ? "bg-gray-700 cursor-not-allowed opacity-60" : ""}
  `;

  const renderQuestionInput = () => {
    switch (question.type) {
      case "text":
        return (
          <input
            id={question._id}
            type="text"
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`Enter ${question.label.toLowerCase()}`}
            className={baseInputClasses}
            disabled={disabled}
            aria-describedby={
              `${question.helpText ? `${question._id}-help` : ""} ${
                error ? `${question._id}-error` : ""
              }`.trim() || undefined
            }
            aria-required={question.required}
            aria-invalid={!!error}
          />
        );

      case "number":
        return (
          <input
            id={question._id}
            type="number"
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`Enter ${question.label.toLowerCase()}`}
            className={baseInputClasses}
            disabled={disabled}
            aria-describedby={
              `${question.helpText ? `${question._id}-help` : ""} ${
                error ? `${question._id}-error` : ""
              }`.trim() || undefined
            }
            aria-required={question.required}
            aria-invalid={!!error}
            inputMode="numeric"
          />
        );

      case "date":
        return (
          <input
            id={question._id}
            type="date"
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            className={baseInputClasses}
            disabled={disabled}
            aria-describedby={
              `${question.helpText ? `${question._id}-help` : ""} ${
                error ? `${question._id}-error` : ""
              }`.trim() || undefined
            }
            aria-required={question.required}
            aria-invalid={!!error}
          />
        );

      case "select":
        return (
          <select
            id={question._id}
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            className={baseInputClasses}
            disabled={disabled}
            aria-describedby={
              `${question.helpText ? `${question._id}-help` : ""} ${
                error ? `${question._id}-error` : ""
              }`.trim() || undefined
            }
            aria-required={question.required}
            aria-invalid={!!error}
          >
            <option value="">Select an option</option>
            {question.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case "multi-select":
        return (
          <fieldset
            className="space-y-3"
            aria-describedby={
              `${question.helpText ? `${question._id}-help` : ""} ${
                error ? `${question._id}-error` : ""
              }`.trim() || undefined
            }
            aria-required={question.required}
            aria-invalid={!!error}
          >
            <legend className="sr-only">
              {question.label} - Select multiple options
            </legend>
            {question.options?.map((option, index) => {
              const isSelected = Array.isArray(value) && value.includes(option);
              const optionId = `${question._id}-option-${index}`;
              return (
                <label
                  key={index}
                  htmlFor={optionId}
                  className={`
                    flex items-center p-2 border rounded-lg cursor-pointer transition-colors duration-200
                    min-h-[36px] touch-manipulation focus-within:ring-2 focus-within:ring-blue-400
                    ${
                      isSelected
                        ? "border-blue-500 bg-blue-900/20"
                        : "border-gray-600 hover:border-gray-500 bg-gray-800"
                    }
                    ${disabled ? "cursor-not-allowed opacity-60" : ""}
                  `}
                >
                  <input
                    id={optionId}
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      if (e.target.checked) {
                        handleChange([...currentValues, option]);
                      } else {
                        handleChange(currentValues.filter((v) => v !== option));
                      }
                    }}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={disabled}
                    aria-describedby={
                      question.helpText ? `${question._id}-help` : undefined
                    }
                  />
                  <span className="text-white text-sm">{option}</span>
                </label>
              );
            })}
          </fieldset>
        );

      case "boolean":
        return (
          <fieldset
            className="flex flex-col sm:flex-row gap-3 sm:gap-4"
            aria-describedby={
              `${question.helpText ? `${question._id}-help` : ""} ${
                error ? `${question._id}-error` : ""
              }`.trim() || undefined
            }
            aria-required={question.required}
            aria-invalid={!!error}
          >
            <legend className="sr-only">{question.label} - Yes or No</legend>
            <label
              htmlFor={`${question._id}-yes`}
              className={`flex items-center cursor-pointer p-2 border rounded-lg transition-colors min-h-[36px] touch-manipulation focus-within:ring-2 focus-within:ring-blue-400 ${
                value === true || value === "true"
                  ? "border-blue-500 bg-blue-900/20"
                  : "border-gray-600 hover:border-gray-500 bg-gray-800"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <input
                id={`${question._id}-yes`}
                type="radio"
                name={question._id}
                value="true"
                checked={value === true || value === "true"}
                onChange={() => handleChange(true)}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                disabled={disabled}
                aria-describedby={
                  question.helpText ? `${question._id}-help` : undefined
                }
              />
              <span className="text-white text-sm">Yes</span>
            </label>
            <label
              htmlFor={`${question._id}-no`}
              className={`flex items-center cursor-pointer p-2 border rounded-lg transition-colors min-h-[36px] touch-manipulation focus-within:ring-2 focus-within:ring-blue-400 ${
                value === false || value === "false"
                  ? "border-blue-500 bg-blue-900/20"
                  : "border-gray-600 hover:border-gray-500 bg-gray-800"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <input
                id={`${question._id}-no`}
                type="radio"
                name={question._id}
                value="false"
                checked={value === false || value === "false"}
                onChange={() => handleChange(false)}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                disabled={disabled}
                aria-describedby={
                  question.helpText ? `${question._id}-help` : undefined
                }
              />
              <span className="text-white text-sm">No</span>
            </label>
          </fieldset>
        );

      default:
        return (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800">
              Unsupported question type: {question.type}
            </p>
          </div>
        );
    }
  };

  return (
    <div
      className={`space-y-3 ${className}`}
      role="group"
      aria-labelledby={`${question._id}-label`}
    >
      {/* Question Label */}
      <label
        id={`${question._id}-label`}
        htmlFor={question._id}
        className="block text-base font-semibold text-white"
      >
        {question.label}
        {question.required && (
          <span
            className="text-red-400 ml-1 text-lg"
            aria-label="Required field"
          >
            *
          </span>
        )}
      </label>

      {/* Help Text */}
      {question.helpText && (
        <p
          id={`${question._id}-help`}
          className="text-xs text-gray-300 bg-gray-700/50 p-2 rounded border-l-2 border-blue-500"
          role="note"
        >
          <svg
            className="w-3 h-3 inline mr-1 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {question.helpText}
        </p>
      )}

      {/* Question Input */}
      <div role="application" aria-live="polite">
        {renderQuestionInput()}
      </div>

      {/* Error Message */}
      {error && (
        <div
          id={`${question._id}-error`}
          className="text-xs text-red-300 flex items-center bg-red-900/20 border border-red-500 rounded p-2"
          role="alert"
          aria-live="assertive"
        >
          <svg
            className="w-4 h-4 mr-1 flex-shrink-0 text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      )}
    </div>
  );
};

export default QuestionRenderer;
