import axios from "axios";

// API Base URL from environment variables with fallback
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

// Create axios instance specifically for caption API
const captionApiClient = axios.create({
  baseURL: `${API_BASE_URL}/caption`,
  timeout: 60000, // 60 second timeout for AI generation
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
captionApiClient.interceptors.request.use(
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

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor for error handling
captionApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common error scenarios
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem("auth");
      window.location.href = "/";
    }

    if (error.response?.status === 429) {
      // Quota exceeded
      console.warn("Caption quota exceeded:", error.response.data);
    }

    if (error.response?.status >= 500) {
      // Server error
      console.error("Caption service error:", error.response.data);
    }

    return Promise.reject(error);
  },
);

const captionService = {
  /**
   * Generate captions for media URL
   * @param {Object} data - Generation parameters
   * @param {string} data.mediaUrl - URL of the media file
   * @param {number} data.captionCount - Number of captions to generate (1-10)
   * @param {string} data.style - Caption style ("professional", "casual", "creative", "trendy")
   * @returns {Promise} API response with generated captions
   */
  generateCaptions: async ({
    mediaUrl,
    captionCount = 3,
    style = "professional",
  }) => {
    const response = await captionApiClient.post("/generate", {
      mediaUrl,
      captionCount,
      style,
    });
    return response.data;
  },

  /**
   * Upload media file to Cloudinary
   * @param {File} file - Media file to upload
   * @param {Function} onUploadProgress - Progress callback function
   * @returns {Promise} API response with media URL and metadata
   */
  uploadMedia: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append("media", file);

    const response = await captionApiClient.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onUploadProgress(progress);
        }
      },
    });
    return response.data;
  },

  /**
   * Get current quota status for the authenticated user
   * @returns {Promise} API response with quota information
   */
  getQuotaStatus: async () => {
    const response = await captionApiClient.get("/quota");
    return response.data;
  },

  /**
   * Get caption generation history
   * @param {Object} params - Pagination parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10)
   * @returns {Promise} API response with history data and pagination
   */
  getCaptionHistory: async ({ page = 1, limit = 10 } = {}) => {
    const response = await captionApiClient.get("/history", {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Health check for the caption service
   * @returns {Promise} API response indicating service status
   */
  healthCheck: async () => {
    try {
      const response = await captionApiClient.get("/health");
      return response.data;
    } catch (error) {
      console.warn("Caption service health check failed:", error.message);
      throw error;
    }
  },
};

// Utility functions for client-side validation
export const captionUtils = {
  /**
   * Validate file type and size
   * @param {File} file - File to validate
   * @returns {Object} Validation result with isValid and error message
   */
  validateFile: (file) => {
    const maxSize = 20 * 1024 * 1024; // 20MB
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "video/webm",
    ];

    if (!file) {
      return { isValid: false, error: "No file selected" };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: "File size must be less than 20MB",
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: "Only image and video files are supported",
      };
    }

    return { isValid: true, error: null };
  },

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted size string
   */
  formatFileSize: (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  /**
   * Get file type category (image or video)
   * @param {string} mimeType - File MIME type
   * @returns {string} "image" or "video"
   */
  getFileCategory: (mimeType) => {
    return mimeType.startsWith("video/") ? "video" : "image";
  },

  /**
   * Format processing time for display
   * @param {number} ms - Processing time in milliseconds
   * @returns {string} Formatted time string
   */
  formatProcessingTime: (ms) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  },

  /**
   * Check if quota is near limit
   * @param {number} remaining - Remaining quota
   * @param {number} total - Total quota
   * @returns {boolean} True if near limit (< 20%)
   */
  isQuotaNearLimit: (remaining, total) => {
    return remaining / total < 0.2;
  },

  /**
   * Format quota reset time for display
   * @param {string} resetTime - ISO timestamp string
   * @returns {string} Formatted time string
   */
  formatResetTime: (resetTime) => {
    const resetDate = new Date(resetTime);
    const now = new Date();
    const diffMs = resetDate - now;

    if (diffMs <= 0) return "Available now";

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  },
};

export default captionService;
