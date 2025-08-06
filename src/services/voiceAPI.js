import axios from "axios";

// API Base URL from environment variables with fallback
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Add request interceptor to include auth token and metadata
apiClient.interceptors.request.use(
  (config) => {
    const authData = JSON.parse(localStorage.getItem("auth"));
    const token = authData?.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // If sending FormData, remove default JSON header to let axios set multipart/form-data boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    // Add metadata for smart error handling and tracking
    config.metadata = {
      startTime: Date.now(),
      retryCount: 0,
      critical: config.critical !== false, // Voice operations are critical by default
      feature: "voice",
      url: config.url,
    };

    return config;
  },
  (error) => {
    console.error("🔴 Request interceptor error:", error);
    return Promise.reject(error);
  },
);

// Add response interceptor to handle responses and errors uniformly
apiClient.interceptors.response.use(
  (response) => {
    // Calculate response time for monitoring
    if (response.config.metadata) {
      const duration = Date.now() - response.config.metadata.startTime;
      console.log(
        `✅ Voice API request completed in ${duration}ms:`,
        response.config.url,
      );
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log error details
    console.error("🔴 Voice API Error:", {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      critical: originalRequest?.metadata?.critical,
    });

    // 401 Unauthorized - Graceful Error Handling
    if (error.response?.status === 401) {
      console.warn("⚠️ Voice authentication error - token may be expired");

      // Check if this is a legitimate auth failure by verifying token exists
      const authData = JSON.parse(localStorage.getItem("auth") || "{}");
      if (!authData.token) {
        // No token exists, redirect to login
        console.warn("🚨 No authentication token found - redirecting to login");
        window.location.href = "/agency/login";
        return Promise.reject(new Error("Please log in to continue"));
      }

      // Token exists but request failed - this might be a temporary issue
      // Don't immediately logout, let the user try again or navigate elsewhere
      console.warn(
        "🔄 Authentication token exists but request failed - allowing retry",
      );
      return Promise.reject(
        new Error(
          "Authentication failed. Please try refreshing the page or logging in again.",
        ),
      );
    }

    // 403 Forbidden - Role/permission issues
    if (error.response?.status === 403) {
      console.warn("🚫 Voice operation forbidden - insufficient permissions");
      return Promise.reject(
        new Error("You do not have permission to perform this action"),
      );
    }

    // 404 Not Found - Resource not found
    if (error.response?.status === 404) {
      console.warn("� Voice resource not found");
      return Promise.reject(new Error("The requested resource was not found"));
    }

    // 500 Server Error - Backend issues
    if (error.response?.status >= 500) {
      console.error("🔥 Voice server error:", error.response?.data);
      return Promise.reject(new Error("Server error. Please try again later."));
    }

    // Network errors or other issues
    if (!error.response) {
      console.error("🌐 Voice network error:", error.message);
      return Promise.reject(
        new Error("Network error. Please check your connection."),
      );
    }

    // Default error handling - preserve detailed server errors
    const serverResponse = error.response?.data;

    // For 409 conflicts, expose detailed error information
    if (error.response?.status === 409 && serverResponse?.errors) {
      console.error("🔴 409 Conflict Details:", {
        message: serverResponse.message,
        errors: serverResponse.errors,
        fullResponse: serverResponse,
      });

      // Create detailed error message from server errors
      const detailedErrors = serverResponse.errors
        .map((err) => `${err.modelUsername}: ${err.error}`)
        .join("\n");

      const fullMessage = `${serverResponse.message}\n\nDetails:\n${detailedErrors}`;

      const enrichedError = new Error(fullMessage);
      enrichedError.details = serverResponse.errors;
      enrichedError.serverResponse = serverResponse;
      return Promise.reject(enrichedError);
    }

    // For other errors, preserve original structure
    console.error("🔴 Full server response:", serverResponse);
    const errorMessage =
      serverResponse?.error ||
      serverResponse?.message ||
      error.message ||
      "An unexpected error occurred";

    const enrichedError = new Error(errorMessage);
    enrichedError.serverResponse = serverResponse;
    return Promise.reject(enrichedError);
  },
);

// Voice API endpoints
export const voiceAPI = {
  // Question Section Management
  getSections: () => {
    console.log("🔍 Fetching voice sections...");
    return apiClient
      .get("/voice/sections", { critical: false })
      .then((response) => {
        console.log("✅ Voice sections fetched:", response.data);
        return response;
      })
      .catch((error) => {
        console.error("❌ Error fetching voice sections:", error);
        throw error;
      });
  },
  createSection: (data) => apiClient.post("/voice/sections", data),
  updateSection: (id, data) => apiClient.put(`/voice/sections/${id}`, data),
  deleteSection: (id) => apiClient.delete(`/voice/sections/${id}`),

  // Question Management
  getAllQuestions: () => apiClient.get("/voice/questions", { critical: false }),
  getQuestions: (sectionId) => {
    const url = sectionId
      ? `/voice/sections/${sectionId}/questions`
      : "/voice/questions";
    console.log(
      `🔍 Fetching questions${sectionId ? ` for section ${sectionId}` : " (all)"}...`,
    );
    return apiClient
      .get(url, { critical: false })
      .then((response) => {
        console.log(
          `✅ Questions fetched${sectionId ? ` for section ${sectionId}` : " (all)"}:`,
          response.data,
        );
        return response;
      })
      .catch((error) => {
        console.error(
          `❌ Error fetching questions${sectionId ? ` for section ${sectionId}` : " (all)"}:`,
          error,
        );
        throw error;
      });
  },
  getQuestionsBySection: (sectionId) =>
    apiClient.get(`/voice/sections/${sectionId}/questions`, {
      critical: false,
    }),
  createQuestion: (data) => apiClient.post("/voice/questions", data),
  updateQuestion: (id, data) => apiClient.put(`/voice/questions/${id}`, data),
  deleteQuestion: (id) => apiClient.delete(`/voice/questions/${id}`),

  // Script Management
  getScripts: (params = {}) =>
    apiClient.get("/voice/scripts", { params, critical: false }),
  getScript: (id) => apiClient.get(`/voice/scripts/${id}`, { critical: false }),
  createScript: (data) => apiClient.post("/voice/scripts", data),
  updateScript: (id, data) => apiClient.put(`/voice/scripts/${id}`, data),
  deleteScript: (id) => apiClient.delete(`/voice/scripts/${id}`),

  // Script Templates
  getScriptTemplates: () => apiClient.get("/voice/scripts/templates"),
  createScriptFromTemplate: (templateId, data) =>
    apiClient.post(`/voice/scripts/templates/${templateId}/create`, data),

  // Sentence Management
  addSentence: (scriptId, data) =>
    apiClient.post(`/voice/scripts/${scriptId}/sentences`, data),
  updateSentence: (scriptId, sentenceId, data) =>
    apiClient.put(`/voice/scripts/${scriptId}/sentences/${sentenceId}`, data),
  removeSentence: (scriptId, sentenceId) =>
    apiClient.delete(`/voice/scripts/${scriptId}/sentences/${sentenceId}`),
  reorderSentences: (scriptId, data) =>
    apiClient.put(`/voice/scripts/${scriptId}/sentences/reorder`, data),
  breakIntoSentences: (scriptId, data) =>
    apiClient.post(`/voice/scripts/${scriptId}/break-sentences`, data),

  // Script Assignment Management - REMOVED: Only question assignments are supported

  // Assignment Management
  createAssignment: (data) => apiClient.post("/voice/assignments", data),
  getAssignments: (params = {}) =>
    apiClient.get("/voice/assignments", { params, critical: false }),
  getMyAssignments: (params = {}) => {
    console.log("🔍 Fetching model assignments with params:", params);
    return apiClient
      .get("/voice/assignments/model", { params, critical: false })
      .then((response) => {
        console.log("✅ Full response object:", response);
        console.log("✅ Response data:", response.data);
        console.log("✅ Response.data.data:", response.data.data);
        console.log(
          "✅ Expected assignments:",
          response.data.data?.assignments,
        );
        return response;
      })
      .catch((error) => {
        console.error(
          "❌ Error fetching model assignments:",
          error.response?.data || error.message,
        );
        throw error;
      });
  },
  getAgencyAssignments: (params = {}) =>
    apiClient.get("/voice/assignments", { params, critical: false }),
  getAssignmentById: (id) =>
    apiClient.get(`/voice/assignments/${id}`, { critical: false }),
  deleteAssignment: (id) => apiClient.delete(`/voice/assignments/${id}`),
  startAssignment: (id) => apiClient.post(`/voice/assignments/${id}/start`),
  submitAssignment: (id, data = {}) =>
    apiClient.post(`/voice/assignments/${id}/submit`, data),
  saveAssignmentProgress: (id, data = {}) =>
    apiClient.post(`/voice/assignments/${id}/save-progress`, data),
  cancelAssignment: (id, data) =>
    apiClient.post(`/voice/assignments/${id}/cancel`, data),
  updateAssignmentDeadline: (id, data) =>
    apiClient.put(`/voice/assignments/${id}/deadline`, data),
  getAssignmentStats: () => apiClient.get("/voice/assignments/stats"),
  downloadAssignmentRecordings: (id) =>
    apiClient.get(`/voice/assignments/${id}/download`),
  completeAssignmentReview: (id, data) =>
    apiClient.post(`/voice/assignments/${id}/complete-review`, data),

  // Recording Management (Enhanced)
  uploadRecording: (assignmentId, questionId, formData) =>
    // Send FormData; axios will set multipart/form-data header with boundary
    apiClient.post(
      `/voice/assignments/${assignmentId}/questions/${questionId}/record`,
      formData,
    ),

  submitRecording: (assignmentId, questionId, formData) =>
    // Alias for uploadRecording for compatibility
    apiClient.post(
      `/voice/assignments/${assignmentId}/questions/${questionId}/record`,
      formData,
    ),

  getAssignmentRecordings: (assignmentId) =>
    apiClient.get(`/voice/recordings?assignmentId=${assignmentId}`),

  getModelRecordings: (params = {}) =>
    apiClient.get("/voice/recordings/model", { params, critical: false }),

  getAgencyRecordings: (params = {}) =>
    apiClient.get("/voice/recordings/agency", { params, critical: false }),

  getRecordingById: (id) =>
    apiClient.get(`/voice/recordings/${id}`, { critical: false }),
  deleteRecording: (id) => apiClient.delete(`/voice/recordings/${id}`),
  updateRecording: (id, data) => apiClient.put(`/voice/recordings/${id}`, data),
  downloadRecording: (id) => apiClient.get(`/voice/recordings/${id}/download`), // Legacy method

  // NEW SECURE DOWNLOAD METHODS
  generateDownloadToken: (id) =>
    apiClient.post(`/voice/recordings/${id}/generate-download-token`),

  // Recording Review (Agency)
  reviewRecording: (id, data) =>
    apiClient.put(`/voice/recordings/${id}/review`, data),
  approveRecording: (id, data) =>
    apiClient.put(`/voice/recordings/${id}/approve`, data),
  rejectRecording: (id, data) =>
    apiClient.put(`/voice/recordings/${id}/reject`, data),

  // User Management
  getModelsByAgency: (params = {}) =>
    apiClient.get("/voice/models", { params }),
  getAvailableModels: (params = {}) =>
    apiClient.get("/voice/models", { params }),

  // General APIs
  getStats: (params = {}) => apiClient.get("/voice/stats/overview", { params }),
  exportData: (type, params = {}) =>
    apiClient.get(`/voice/export/${type}`, { params }),

  // File Upload Utilities
  uploadAudioFile: (file, assignmentId, onProgress = null) => {
    const formData = new FormData();
    formData.append("audio", file);

    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        onProgress(percentCompleted);
      };
    }

    return apiClient.post(
      `/voice/recordings/upload/${assignmentId}`,
      formData,
      config,
    );
  },

  // Utility Functions
  validateAudioFile: (file) => {
    const allowedTypes = ["audio/wav", "audio/mp3", "audio/mpeg", "audio/ogg"];
    const maxSize = 100 * 1024 * 1024; // 100MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "Invalid file type. Please upload WAV, MP3, or OGG files.",
      );
    }

    if (file.size > maxSize) {
      throw new Error("File size too large. Maximum size is 100MB.");
    }

    return true;
  },
};

export default voiceAPI;

// Export individual API groups for convenience
export const scriptAPI = {
  getAll: voiceAPI.getScripts,
  getById: voiceAPI.getScript,
  create: voiceAPI.createScript,
  update: voiceAPI.updateScript,
  delete: voiceAPI.deleteScript,
  getTemplates: voiceAPI.getScriptTemplates,
  createFromTemplate: voiceAPI.createScriptFromTemplate,
};

export const sentenceAPI = {
  add: voiceAPI.addSentence,
  update: voiceAPI.updateSentence,
  remove: voiceAPI.removeSentence,
  reorder: voiceAPI.reorderSentences,
  breakInto: voiceAPI.breakIntoSentences,
};

export const recordingAPI = {
  upload: voiceAPI.uploadRecording,
  getAll: voiceAPI.getModelRecordings,
  getById: voiceAPI.getRecordingById,
  update: voiceAPI.updateRecording,
  delete: voiceAPI.deleteRecording,
  review: voiceAPI.reviewRecording,
  approve: voiceAPI.approveRecording,
  reject: voiceAPI.rejectRecording,
};

export const assignmentAPI = {
  create: voiceAPI.createAssignment,
  getAll: voiceAPI.getAssignments,
  getMy: voiceAPI.getMyAssignments,
  getById: voiceAPI.getAssignmentById,
  start: voiceAPI.startAssignment,
  submit: voiceAPI.submitAssignment,
  cancel: voiceAPI.cancelAssignment,
  updateDeadline: voiceAPI.updateAssignmentDeadline,
  getStats: voiceAPI.getAssignmentStats,
  downloadRecordings: voiceAPI.downloadAssignmentRecordings,
};
