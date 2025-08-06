import axios from "axios";
import { toast } from "react-hot-toast";
import { logoutAndRedirect } from "./logout";

// Create main axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem("auth");
    if (authData) {
      const { token } = JSON.parse(authData);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    if (response?.status === 401) {
      // Handle unauthorized access
      const authData = JSON.parse(localStorage.getItem("auth") || "{}");
      const userRole = authData?.user?.role;

      // Show error message
      toast.error("Your session has expired. Please log in again.");

      // Use centralized logout utility
      logoutAndRedirect(userRole);
      return Promise.reject(error);
    } else if (response?.status === 403) {
      // Handle permission denied
      const errorMessage =
        response.data?.message ||
        "You do not have permission to perform this action.";
      toast.error(errorMessage);
    } else if (response?.status >= 500) {
      // Handle server errors
      toast.error("Server error. Please try again later.");
    } else if (response?.status >= 400) {
      // Handle other client errors
      const errorMessage =
        response.data?.message || response.data?.error || "An error occurred.";
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  },
);

export default api;

// Helper functions for common API operations
export const apiHelpers = {
  get: (url, config = {}) => api.get(url, config),
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  patch: (url, data = {}, config = {}) => api.patch(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),
};

// Permission-specific API calls
export const permissionAPI = {
  getUserPermissions: () => api.get("/agency/user/permissions"),
};
