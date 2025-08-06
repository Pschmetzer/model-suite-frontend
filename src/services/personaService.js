import axios from "axios";

// API Base URL from environment variables with fallback
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

// Create axios instance specifically for persona API
const personaApiClient = axios.create({
  baseURL: `${API_BASE_URL}/persona`,
  timeout: 60000, // 60 second timeout for AI generation
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
personaApiClient.interceptors.request.use(
  (config) => {
    const authData = JSON.parse(localStorage.getItem("auth"));
    const token = authData?.token;

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
personaApiClient.interceptors.response.use(
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
      console.warn("Persona quota exceeded:", error.response.data);
    }

    if (error.response?.status >= 500) {
      // Server error
      console.error("Persona service error:", error.response.data);
    }

    return Promise.reject(error);
  },
);

const personaService = {
  /**
   * Generate a persona for a specific model
   * @param {Object} data - Generation parameters
   * @param {string} data.modelId - ID of the model to generate persona for
   * @param {string[]} data.tags - Array of tags for persona customization
   * @returns {Promise} API response with generated persona
   */
  generatePersona: async ({ modelId, tags = [] }) => {
    const response = await personaApiClient.post("/generate", {
      modelId,
      tags,
    });
    return response.data;
  },

  /**
   * Save a persona
   * @param {Object} data - Persona data to save
   * @param {string} data.modelId - ID of the model
   * @param {string} data.content - Persona content
   * @param {string[]} data.tags - Array of tags
   * @returns {Promise} API response with saved persona
   */
  savePersona: async ({ modelId, content, tags = [] }) => {
    const response = await personaApiClient.post("/", {
      modelId,
      content,
      tags,
    });
    return response.data;
  },

  /**
   * Get personas for the current agency
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10)
   * @param {string} params.modelId - Filter by model ID
   * @returns {Promise} API response with personas list
   */
  getPersonas: async ({ page = 1, limit = 10, modelId } = {}) => {
    const params = { page, limit };
    if (modelId) params.modelId = modelId;

    const response = await personaApiClient.get("/", { params });
    return response.data;
  },

  /**
   * Get a specific persona by ID
   * @param {string} personaId - ID of the persona
   * @returns {Promise} API response with persona data
   */
  getPersonaById: async (personaId) => {
    const response = await personaApiClient.get(`/${personaId}`);
    return response.data;
  },

  /**
   * Update a persona
   * @param {string} personaId - ID of the persona to update
   * @param {Object} data - Updated persona data
   * @param {string} data.content - Updated persona content
   * @param {string[]} data.tags - Updated tags array
   * @returns {Promise} API response with updated persona
   */
  updatePersona: async (personaId, { content, tags = [] }) => {
    const response = await personaApiClient.put(`/${personaId}`, {
      content,
      tags,
    });
    return response.data;
  },

  /**
   * Delete a persona
   * @param {string} personaId - ID of the persona to delete
   * @returns {Promise} API response
   */
  deletePersona: async (personaId) => {
    const response = await personaApiClient.delete(`/${personaId}`);
    return response.data;
  },

  /**
   * Export persona as PDF
   * @param {string} personaId - ID of the persona to export
   * @returns {Promise} API response with PDF blob
   */
  exportPersona: async (personaId) => {
    const response = await personaApiClient.get(`/${personaId}/export`, {
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Get quota status for persona generation
   * @returns {Promise} API response with quota information
   */
  getQuotaStatus: async () => {
    const response = await personaApiClient.get("/quota");
    return response.data;
  },

  /**
   * Get persona analytics
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date for analytics
   * @param {string} params.endDate - End date for analytics
   * @param {string} params.modelId - Filter by model ID
   * @returns {Promise} API response with analytics data
   */
  getAnalytics: async ({ startDate, endDate, modelId } = {}) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (modelId) params.modelId = modelId;

    const response = await personaApiClient.get("/analytics", { params });
    return response.data;
  },
};

// Utility functions for client-side validation
export const personaUtils = {
  /**
   * Validate persona content
   * @param {string} content - Persona content to validate
   * @returns {Object} Validation result with isValid and error message
   */
  validateContent: (content) => {
    if (!content || content.trim().length === 0) {
      return { isValid: false, error: "Persona content is required" };
    }

    const wordCount = content.trim().split(/\s+/).length;
    if (wordCount > 150) {
      return {
        isValid: false,
        error: `Persona content must be 150 words or less (current: ${wordCount} words)`,
      };
    }

    return { isValid: true, error: null };
  },

  /**
   * Count words in content
   * @param {string} content - Content to count words for
   * @returns {number} Word count
   */
  countWords: (content) => {
    if (!content || content.trim().length === 0) return 0;
    return content.trim().split(/\s+/).length;
  },

  /**
   * Validate tags array
   * @param {string[]} tags - Tags array to validate
   * @returns {Object} Validation result with isValid and error message
   */
  validateTags: (tags) => {
    if (!Array.isArray(tags)) {
      return { isValid: false, error: "Tags must be an array" };
    }

    if (tags.length > 10) {
      return {
        isValid: false,
        error: "Maximum 10 tags allowed",
      };
    }

    const invalidTags = tags.filter(
      (tag) => !tag || typeof tag !== "string" || tag.trim().length === 0,
    );

    if (invalidTags.length > 0) {
      return {
        isValid: false,
        error: "All tags must be non-empty strings",
      };
    }

    return { isValid: true, error: null };
  },

  /**
   * Get suggested tags for persona
   * @returns {string[]} Array of suggested tags
   */
  getSuggestedTags: () => {
    return [
      "Empowering",
      "Funny",
      "Bold",
      "Creative",
      "Professional",
      "Authentic",
      "Inspiring",
      "Confident",
      "Playful",
      "Sophisticated",
      "Energetic",
      "Mysterious",
      "Elegant",
      "Adventurous",
      "Compassionate",
    ];
  },
};

export default personaService;
