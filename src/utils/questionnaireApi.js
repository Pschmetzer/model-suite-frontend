import axios from "axios";
import { logoutAndRedirect } from "./logout";

// API Base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = JSON.parse(localStorage.getItem("auth"))?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      // Get user role BEFORE removing auth data
      const authData = JSON.parse(localStorage.getItem("auth"));
      const userRole = authData?.user?.role;

      // Use centralized logout utility
      logoutAndRedirect(userRole);
    }
    return Promise.reject(error);
  },
);

// Template API functions
export const templateAPI = {
  // Get all templates for agency
  getTemplates: async () => {
    try {
      const response = await apiClient.get("/questionnaire/templates");
      return {
        success: true,
        data: response.data,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || "Failed to fetch templates",
      };
    }
  },

  // Get single template by ID
  getTemplate: async (templateId) => {
    try {
      const response = await apiClient.get(
        `/questionnaire/templates/${templateId}`,
      );
      return {
        success: true,
        data: response.data,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || "Failed to fetch template",
      };
    }
  },

  // Create new template
  createTemplate: async (templateData) => {
    try {
      const response = await apiClient.post(
        "/questionnaire/templates",
        templateData,
      );
      return {
        success: true,
        data: response.data,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || "Failed to create template",
      };
    }
  },

  // Update existing template
  updateTemplate: async (templateId, templateData) => {
    try {
      const response = await apiClient.put(
        `/questionnaire/templates/${templateId}`,
        templateData,
      );
      return {
        success: true,
        data: response.data,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || "Failed to update template",
      };
    }
  },

  // Delete template
  deleteTemplate: async (templateId) => {
    try {
      const response = await apiClient.delete(
        `/questionnaire/templates/${templateId}`,
      );
      return {
        success: true,
        data: response.data,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || "Failed to delete template",
      };
    }
  },
};

// Assignment API functions
export const assignmentAPI = {
  // Get all assignments for agency
  getAssignments: async () => {
    try {
      const response = await apiClient.get("/questionnaire/assignments");
      return {
        success: true,
        data: response.data,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || "Failed to fetch assignments",
      };
    }
  },

  // Get assignments for the logged-in model
  getModelAssignments: async () => {
    try {
      const response = await apiClient.get("/questionnaire/assignments/my");
      return {
        success: true,
        data: response.data,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error:
          error.response?.data?.error || "Failed to fetch model assignments",
      };
    }
  },

  // Create new assignment
  createAssignment: async (assignmentData) => {
    try {
      const response = await apiClient.post(
        "/questionnaire/assignments",
        assignmentData,
      );
      return {
        success: true,
        data: response.data,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || "Failed to create assignment",
      };
    }
  },

  // Bulk create assignments
  createBulkAssignments: async (assignmentsData) => {
    try {
      const response = await apiClient.post(
        "/questionnaire/assignments/bulk",
        assignmentsData,
      );
      return {
        success: true,
        data: response.data,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error:
          error.response?.data?.error || "Failed to create bulk assignments",
      };
    }
  },

  // Update assignment status
  updateAssignmentStatus: async (assignmentId, status) => {
    try {
      const response = await apiClient.patch(
        `/questionnaire/assignments/${assignmentId}/status`,
        { status },
      );
      return {
        success: true,
        data: response.data,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error:
          error.response?.data?.error || "Failed to update assignment status",
      };
    }
  },

  // Delete assignment
  deleteAssignment: async (assignmentId) => {
    try {
      const response = await apiClient.delete(
        `/questionnaire/assignments/${assignmentId}`,
      );
      return {
        success: true,
        data: response.data,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || "Failed to delete assignment",
      };
    }
  },
};

// Answer API functions
export const answerAPI = {
  // Get saved answers for a template (model view)
  getAnswers: async (templateId) => {
    try {
      // Fetch answers if any (uses agency endpoint but returns ModelAnswer)
      const response = await apiClient.get(
        `/questionnaire/answers/template/${templateId}`,
      );
      return {
        success: true,
        data: { answers: response.data.answers || [] },
        error: null,
      };
    } catch (error) {
      // No prior answers is not fatal
      if (error.response?.status === 404) {
        return { success: true, data: { answers: [] }, error: null };
      }
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || "Failed to fetch answers",
      };
    }
  },

  // Get all answers for a template (for agency analytics)
  getTemplateAnswers: async (templateId) => {
    try {
      const response = await apiClient.get(
        `/questionnaire/answers/analytics/${templateId}`,
      );
      return {
        success: true,
        data: response.data,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error:
          error.response?.data?.error || "Failed to fetch template answers",
      };
    }
  },

  // Save answers (draft or final) via single endpoint
  saveAnswers: async (templateId, answersData) => {
    try {
      const response = await apiClient.post("/questionnaire/answers", {
        templateId,
        answers: answersData,
      });
      return { success: true, data: response.data, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || "Failed to save answers",
      };
    }
  },

  // Submit answers (draft or final) via same endpoint
  submitAnswers: async (templateId, answersData) => {
    return await apiClient
      .post("/questionnaire/answers", { templateId, answers: answersData })
      .then((res) => ({ success: true, data: res.data, error: null }))
      .catch((error) => ({
        success: false,
        data: null,
        error: error.response?.data?.error || "Failed to submit answers",
      }));
  },
  // Get a specific model's answers for a template (agency view)
  getModelAnswers: async (modelId, templateId) => {
    try {
      const response = await apiClient.get(
        `/questionnaire/answers/${modelId}/${templateId}`,
      );

      return { success: true, data: response.data, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || "Failed to fetch model answers",
      };
    }
  },

  // Get a specific model's answers as PDF (agency view)
  getModelAnswersPDF: async (modelId, templateId) => {
    try {
      const response = await apiClient.get(
        `/questionnaire/answers/${modelId}/${templateId}?format=pdf`,
        {
          responseType: "blob", // Important for PDF downloads
        },
      );

      return { success: true, data: response.data, error: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || "Failed to fetch PDF report",
      };
    }
  },
};

// Utility functions for data formatting and validation
export const questionnaireUtils = {
  // Format template data for display
  formatTemplate: (template) => {
    return {
      ...template,
      createdAt: new Date(template.createdAt).toLocaleDateString(),
      questionCount:
        template.sections?.reduce(
          (total, section) => total + section.questions.length,
          0,
        ) || 0,
      sectionCount: template.sections?.length || 0,
    };
  },

  // Format assignment data for display
  formatAssignment: (assignment) => {
    return {
      ...assignment,
      modelName: assignment.modelId?.fullName || "Unknown Model",
      modelEmail: assignment.modelId?.email || "No email",
      templateTitle: assignment.templateId?.title || "Unknown Template",
      assignedAt: new Date(assignment.assignedAt).toLocaleDateString(),
      submittedAt: assignment.submittedAt
        ? new Date(assignment.submittedAt).toLocaleDateString()
        : null,
      isOverdue:
        assignment.dueDate && new Date(assignment.dueDate) < new Date(),
      statusColor:
        {
          "Not started": "text-gray-500",
          "In progress": "text-yellow-500",
          Submitted: "text-green-500",
        }[assignment.status] || "text-gray-500",
    };
  },

  // Validate question answer based on question type
  validateAnswer: (question, answer) => {
    if (question.required && (!answer || answer === "")) {
      return { isValid: false, error: "This field is required" };
    }

    switch (question.type) {
      case "email":
        if (answer && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer)) {
          return {
            isValid: false,
            error: "Please enter a valid email address",
          };
        }
        break;
      case "number":
        if (answer && isNaN(Number(answer))) {
          return { isValid: false, error: "Please enter a valid number" };
        }
        break;
      case "date":
        if (answer && isNaN(Date.parse(answer))) {
          return { isValid: false, error: "Please enter a valid date" };
        }
        break;
      case "select":
        if (answer && question.options && !question.options.includes(answer)) {
          return { isValid: false, error: "Please select a valid option" };
        }
        break;
      case "multi-select":
        if (answer && Array.isArray(answer) && question.options) {
          const invalidOptions = answer.filter(
            (option) => !question.options.includes(option),
          );
          if (invalidOptions.length > 0) {
            return {
              isValid: false,
              error: "Please select valid options only",
            };
          }
        }
        break;
    }

    return { isValid: true, error: null };
  },

  // Calculate questionnaire completion percentage
  calculateProgress: (template, answers) => {
    if (!template.sections || template.sections.length === 0) return 0;

    const totalQuestions = template.sections.reduce(
      (total, section) => total + section.questions.length,
      0,
    );

    if (totalQuestions === 0) return 0;

    const answeredQuestions = answers.filter(
      (answer) =>
        answer.answer !== null &&
        answer.answer !== undefined &&
        answer.answer !== "",
    ).length;

    return Math.round((answeredQuestions / totalQuestions) * 100);
  },

  // Group answers by section for display
  groupAnswersBySection: (template, answers) => {
    return template.sections.map((section) => ({
      ...section,
      questions: section.questions.map((question) => {
        const answer = answers.find((a) => a.questionId === question._id);
        return {
          ...question,
          answer: answer?.answer || null,
        };
      }),
    }));
  },
};

// Loading state management
export const createLoadingState = () => ({
  isLoading: false,
  error: null,
  data: null,
});

// Error handling utilities
export const handleApiError = (error) => {
  console.error("API Error:", error);

  if (error.response) {
    // Server responded with error status
    return (
      error.response.data?.error || `Server error: ${error.response.status}`
    );
  } else if (error.request) {
    // Request made but no response received
    return "Network error: Unable to connect to server";
  } else {
    // Something else happened
    return error.message || "An unexpected error occurred";
  }
};

export default {
  templateAPI,
  assignmentAPI,
  answerAPI,
  questionnaireUtils,
  createLoadingState,
  handleApiError,
};
