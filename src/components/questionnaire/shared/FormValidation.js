// Form validation utilities for questionnaire components

/**
 * Validates a single question answer based on question configuration
 * @param {Object} question - The question object with type, required, options, etc.
 * @param {*} answer - The answer value to validate
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
export const validateQuestionAnswer = (question, answer) => {
  // Check if required field is empty
  if (question.required) {
    if (answer === null || answer === undefined || answer === "") {
      return { isValid: false, error: "This field is required" };
    }

    // Special case for multi-select - check if array is empty
    if (
      question.type === "multi-select" &&
      Array.isArray(answer) &&
      answer.length === 0
    ) {
      return { isValid: false, error: "Please select at least one option" };
    }
  }

  // If not required and empty, it's valid
  if (
    !question.required &&
    (answer === null || answer === undefined || answer === "")
  ) {
    return { isValid: true, error: null };
  }

  // Type-specific validation
  switch (question.type) {
    case "text":
      if (typeof answer !== "string") {
        return { isValid: false, error: "Please enter valid text" };
      }
      // Check minimum length if specified
      if (question.minLength && answer.length < question.minLength) {
        return {
          isValid: false,
          error: `Minimum ${question.minLength} characters required`,
        };
      }
      // Check maximum length if specified
      if (question.maxLength && answer.length > question.maxLength) {
        return {
          isValid: false,
          error: `Maximum ${question.maxLength} characters allowed`,
        };
      }
      break;

    case "number": {
      const numValue = Number(answer);
      if (isNaN(numValue)) {
        return { isValid: false, error: "Please enter a valid number" };
      }
      // Check minimum value if specified
      if (question.min !== undefined && numValue < question.min) {
        return {
          isValid: false,
          error: `Value must be at least ${question.min}`,
        };
      }
      // Check maximum value if specified
      if (question.max !== undefined && numValue > question.max) {
        return {
          isValid: false,
          error: `Value must be at most ${question.max}`,
        };
      }
      break;
    }

    case "date": {
      const dateValue = new Date(answer);
      if (isNaN(dateValue.getTime())) {
        return { isValid: false, error: "Please enter a valid date" };
      }
      // Check if date is in the future when not allowed
      if (question.noFutureDates && dateValue > new Date()) {
        return { isValid: false, error: "Future dates are not allowed" };
      }
      // Check if date is in the past when not allowed
      if (question.noPastDates && dateValue < new Date()) {
        return { isValid: false, error: "Past dates are not allowed" };
      }
      break;
    }
    case "select":
      if (!question.options || !question.options.includes(answer)) {
        return { isValid: false, error: "Please select a valid option" };
      }
      break;

    case "multi-select": {
      if (!Array.isArray(answer)) {
        return { isValid: false, error: "Invalid selection format" };
      }
      // Check if all selected options are valid
      const invalidOptions = answer.filter(
        (option) => !question.options?.includes(option),
      );
      if (invalidOptions.length > 0) {
        return { isValid: false, error: "Please select valid options only" };
      }
      // Check minimum selections if specified
      if (question.minSelections && answer.length < question.minSelections) {
        return {
          isValid: false,
          error: `Please select at least ${question.minSelections} option(s)`,
        };
      }
      // Check maximum selections if specified
      if (question.maxSelections && answer.length > question.maxSelections) {
        return {
          isValid: false,
          error: `Please select at most ${question.maxSelections} option(s)`,
        };
      }
      break;
    }
    case "boolean":
      if (
        typeof answer !== "boolean" &&
        answer !== "true" &&
        answer !== "false"
      ) {
        return { isValid: false, error: "Please select Yes or No" };
      }
      break;

    default:
      // Unknown question type
      return {
        isValid: false,
        error: `Unsupported question type: ${question.type}`,
      };
  }

  return { isValid: true, error: null };
};

/**
 * Validates all answers in a questionnaire
 * @param {Object} template - The template object with sections and questions
 * @param {Array} answers - Array of answer objects with questionId and answer
 * @returns {Object} - { isValid: boolean, errors: Object, summary: Object }
 */
export const validateQuestionnaire = (template, answers) => {
  const errors = {};
  let totalQuestions = 0;
  let validAnswers = 0; // actually answered and valid
  let requiredQuestions = 0;
  let requiredAnswered = 0;

  // Create a map of answers for quick lookup
  const answerMap = {};
  answers.forEach((answer) => {
    answerMap[answer.questionId] = answer.answer;
  });

  // Validate each question in each section
  template.sections?.forEach((section) => {
    section.questions?.forEach((question) => {
      totalQuestions++;
      if (question.required) {
        requiredQuestions++;
      }

      const answer = answerMap[question._id];
      const validation = validateQuestionAnswer(question, answer);

      if (!validation.isValid) {
        errors[question._id] = validation.error;
      } else {
        // Only increment validAnswers if an answer was provided
        if (answer !== null && answer !== undefined && answer !== "") {
          validAnswers++;
          if (question.required) {
            requiredAnswered++;
          }
        }
      }
    });
  });

  const isValid = Object.keys(errors).length === 0;
  const completionPercentage =
    totalQuestions > 0 ? Math.round((validAnswers / totalQuestions) * 100) : 0;
  const requiredCompletionPercentage =
    requiredQuestions > 0
      ? Math.round((requiredAnswered / requiredQuestions) * 100)
      : 100;

  return {
    isValid,
    errors,
    summary: {
      totalQuestions,
      validAnswers,
      requiredQuestions,
      requiredAnswered,
      completionPercentage,
      requiredCompletionPercentage,
      canSubmit: requiredAnswered === requiredQuestions,
    },
  };
};

/**
 * Validates template structure before saving
 * @param {Object} template - The template object to validate
 * @returns {Object} - { isValid: boolean, errors: Array }
 */
export const validateTemplate = (template) => {
  const errors = [];

  // Check required fields
  if (!template.title || template.title.trim() === "") {
    errors.push("Template title is required");
  }

  if (!template.sections || template.sections.length === 0) {
    errors.push("Template must have at least one section");
  }

  // Validate sections
  template.sections?.forEach((section, sectionIndex) => {
    if (!section.title || section.title.trim() === "") {
      errors.push(`Section ${sectionIndex + 1} title is required`);
    }

    if (!section.questions || section.questions.length === 0) {
      errors.push(`Section "${section.title}" must have at least one question`);
    }

    // Validate questions
    section.questions?.forEach((question, questionIndex) => {
      const questionLabel = `Section "${section.title}", Question ${
        questionIndex + 1
      }`;

      if (!question.label || question.label.trim() === "") {
        errors.push(`${questionLabel}: Question label is required`);
      }

      if (!question.type) {
        errors.push(`${questionLabel}: Question type is required`);
      }

      // Validate select/multi-select options
      if (question.type === "select" || question.type === "multi-select") {
        if (!question.options || question.options.length === 0) {
          errors.push(
            `${questionLabel}: Options are required for ${question.type} questions`,
          );
        } else {
          // Check for empty options
          const emptyOptions = question.options.filter(
            (option) => !option || option.trim() === "",
          );
          if (emptyOptions.length > 0) {
            errors.push(`${questionLabel}: All options must have values`);
          }
        }
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitizes user input to prevent XSS attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

/**
 * Formats validation errors for display
 * @param {Object} errors - Object with questionId as key and error message as value
 * @param {Object} template - Template object to get question labels
 * @returns {Array} - Array of formatted error objects
 */
export const formatValidationErrors = (errors, template) => {
  const formattedErrors = [];

  // Create a map of question IDs to labels
  const questionMap = {};
  template.sections?.forEach((section) => {
    section.questions?.forEach((question) => {
      questionMap[question._id] = {
        label: question.label,
        sectionTitle: section.title,
      };
    });
  });

  // Format errors
  Object.entries(errors).forEach(([questionId, error]) => {
    const questionInfo = questionMap[questionId];
    formattedErrors.push({
      questionId,
      error,
      questionLabel: questionInfo?.label || "Unknown Question",
      sectionTitle: questionInfo?.sectionTitle || "Unknown Section",
    });
  });

  return formattedErrors;
};

export default {
  validateQuestionAnswer,
  validateQuestionnaire,
  validateTemplate,
  sanitizeInput,
  formatValidationErrors,
};
