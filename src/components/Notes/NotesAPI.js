import axios from "axios";
import { logoutAndRedirect } from "../../utils/logout";

// Base API URL - adjust according to your backend configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      const authData = JSON.parse(localStorage.getItem("auth") || "{}");
      const userRole = authData?.user?.role;
      logoutAndRedirect(userRole);
    }
    return Promise.reject(error);
  },
);

/**
 * Notes API functions
 */
export const NotesAPI = {
  // Get all notes with optional filters and pagination
  getNotes: async (params = {}) => {
    try {
      const response = await api.get("/notes", { params });
      const resp = response.data; // ApiResponse
      const payload = resp.data || {};
      return {
        success: resp.success,
        data: payload.notes || [],
        pagination: payload.pagination || {},
        total: payload.pagination?.totalNotes || 0,
      };
    } catch (error) {
      console.error("Get notes error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to fetch notes",
        data: [],
        pagination: {},
        total: 0,
      };
    }
  },

  // Get a single note by ID
  getNote: async (noteId) => {
    try {
      const response = await api.get(`/notes/${noteId}`);
      return {
        success: true,
        data: response.data.note || null,
      };
    } catch (error) {
      console.error("Get note error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to fetch note",
        data: null,
      };
    }
  },

  // Create a new note
  createNote: async (noteData) => {
    try {
      const response = await api.post("/notes", noteData);
      return {
        success: true,
        data: response.data.note || null,
        message: "Note created successfully",
      };
    } catch (error) {
      console.error("Create note error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to create note",
        data: null,
      };
    }
  },

  // Update an existing note
  updateNote: async (noteId, noteData) => {
    try {
      const response = await api.put(`/notes/${noteId}`, noteData);
      return {
        success: true,
        data: response.data.note || null,
        message: "Note updated successfully",
      };
    } catch (error) {
      console.error("Update note error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to update note",
        data: null,
      };
    }
  },

  // Delete a note
  deleteNote: async (noteId) => {
    try {
      await api.delete(`/notes/${noteId}`);
      return {
        success: true,
        message: "Note deleted successfully",
      };
    } catch (error) {
      console.error("Delete note error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to delete note",
      };
    }
  },

  // Pin/Unpin a note
  togglePinNote: async (noteId, isPinned) => {
    try {
      const response = await api.patch(`/notes/${noteId}/pin`, { isPinned });
      return {
        success: true,
        data: response.data.note || null,
        message: isPinned
          ? "Note pinned successfully"
          : "Note unpinned successfully",
      };
    } catch (error) {
      console.error("Toggle pin note error:", error);
      return {
        success: false,
        error:
          error.response?.data?.message || "Failed to update note pin status",
        data: null,
      };
    }
  },

  // Archive/Unarchive a note
  toggleArchiveNote: async (noteId, isArchived) => {
    try {
      const response = await api.patch(`/notes/${noteId}/archive`, {
        isArchived,
      });
      return {
        success: true,
        data: response.data.note || null,
        message: isArchived
          ? "Note archived successfully"
          : "Note unarchived successfully",
      };
    } catch (error) {
      console.error("Toggle archive note error:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          "Failed to update note archive status",
        data: null,
      };
    }
  },

  // Get notes statistics for a specific model
  getNotesStats: async (modelId) => {
    try {
      const response = await api.get(`/notes/model/${modelId}/stats`);
      return {
        success: true,
        data: response.data.data || {},
      };
    } catch (error) {
      console.error("Get notes stats error:", error);
      return {
        success: false,
        error:
          error.response?.data?.message || "Failed to fetch notes statistics",
        data: {},
      };
    }
  },

  // Search notes
  searchNotes: async (query, filters = {}) => {
    try {
      const params = {
        q: query,
        ...filters,
      };
      const response = await api.get("/notes/search", { params });
      return {
        success: true,
        data: response.data.notes || [],
        total: response.data.total || 0,
      };
    } catch (error) {
      console.error("Search notes error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to search notes",
        data: [],
        total: 0,
      };
    }
  },

  // Get notes by category
  getNotesByCategory: async (category, params = {}) => {
    try {
      const response = await api.get(`/notes/category/${category}`, { params });
      return {
        success: true,
        data: response.data.notes || [],
        pagination: response.data.pagination || {},
        total: response.data.total || 0,
      };
    } catch (error) {
      console.error("Get notes by category error:", error);
      return {
        success: false,
        error:
          error.response?.data?.message || "Failed to fetch notes by category",
        data: [],
        pagination: {},
        total: 0,
      };
    }
  },

  // Get notes by tag
  getNotesByTag: async (tag, params = {}) => {
    try {
      const response = await api.get(`/notes/tag/${tag}`, { params });
      return {
        success: true,
        data: response.data.notes || [],
        pagination: response.data.pagination || {},
        total: response.data.total || 0,
      };
    } catch (error) {
      console.error("Get notes by tag error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to fetch notes by tag",
        data: [],
        pagination: {},
        total: 0,
      };
    }
  },

  // Get all available tags
  getTags: async () => {
    try {
      const response = await api.get("/notes/tags");
      return {
        success: true,
        data: response.data.tags || [],
      };
    } catch (error) {
      console.error("Get tags error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to fetch tags",
        data: [],
      };
    }
  },

  // Get all available categories
  getCategories: async () => {
    try {
      const response = await api.get("/notes/categories");
      return {
        success: true,
        data: response.data.categories || [],
      };
    } catch (error) {
      console.error("Get categories error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to fetch categories",
        data: [],
      };
    }
  },

  // Bulk operations
  bulkDeleteNotes: async (noteIds) => {
    try {
      await api.delete("/notes/bulk", { data: { noteIds } });
      return {
        success: true,
        message: `${noteIds.length} notes deleted successfully`,
      };
    } catch (error) {
      console.error("Bulk delete notes error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to delete notes",
      };
    }
  },

  bulkArchiveNotes: async (noteIds, isArchived = true) => {
    try {
      await api.patch("/notes/bulk/archive", { noteIds, isArchived });
      return {
        success: true,
        message: `${noteIds.length} notes ${
          isArchived ? "archived" : "unarchived"
        } successfully`,
      };
    } catch (error) {
      console.error("Bulk archive notes error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to archive notes",
      };
    }
  },

  bulkPinNotes: async (noteIds, isPinned = true) => {
    try {
      await api.patch("/notes/bulk/pin", { noteIds, isPinned });
      return {
        success: true,
        message: `${noteIds.length} notes ${
          isPinned ? "pinned" : "unpinned"
        } successfully`,
      };
    } catch (error) {
      console.error("Bulk pin notes error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to pin notes",
      };
    }
  },

  // Export notes
  exportNotes: async (format = "json", filters = {}) => {
    try {
      const params = {
        format,
        ...filters,
      };
      const response = await api.get("/notes/export", {
        params,
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `notes-export.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return {
        success: true,
        message: "Notes exported successfully",
      };
    } catch (error) {
      console.error("Export notes error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to export notes",
      };
    }
  },

  // Import notes
  importNotes: async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/notes/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return {
        success: true,
        data: response.data,
        message: "Notes imported successfully",
      };
    } catch (error) {
      console.error("Import notes error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to import notes",
      };
    }
  },
};

/**
 * Reminders API functions
 */
export const RemindersAPI = {
  // Get reminders for a note
  getNoteReminders: async (noteId) => {
    try {
      const response = await api.get(`/notes/${noteId}/reminders`);
      return {
        success: true,
        data: response.data.reminders || [],
      };
    } catch (error) {
      console.error("Get note reminders error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to fetch reminders",
        data: [],
      };
    }
  },

  // Create a reminder
  createReminder: async (noteId, reminderData) => {
    try {
      const response = await api.post(
        `/notes/${noteId}/reminders`,
        reminderData,
      );
      return {
        success: true,
        data: response.data.reminder || null,
        message: "Reminder created successfully",
      };
    } catch (error) {
      console.error("Create reminder error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to create reminder",
        data: null,
      };
    }
  },

  // Update a reminder
  updateReminder: async (reminderId, reminderData) => {
    try {
      const response = await api.put(`/reminders/${reminderId}`, reminderData);
      return {
        success: true,
        data: response.data.reminder || null,
        message: "Reminder updated successfully",
      };
    } catch (error) {
      console.error("Update reminder error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to update reminder",
        data: null,
      };
    }
  },

  // Delete a reminder
  deleteReminder: async (reminderId) => {
    try {
      await api.delete(`/reminders/${reminderId}`);
      return {
        success: true,
        message: "Reminder deleted successfully",
      };
    } catch (error) {
      console.error("Delete reminder error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to delete reminder",
      };
    }
  },

  // Get all user reminders
  getAllReminders: async (params = {}) => {
    try {
      const response = await api.get("/reminders", { params });
      return {
        success: true,
        data: response.data.reminders || [],
      };
    } catch (error) {
      console.error("Get all reminders error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to fetch reminders",
        data: [],
      };
    }
  },
};

/**
 * Attachments API functions
 */
export const AttachmentsAPI = {
  // Upload file attachment
  uploadAttachment: async (noteId, file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("noteId", noteId);

      const response = await api.post("/attachments/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return {
        success: true,
        data: response.data.attachment || null,
        message: "File uploaded successfully",
      };
    } catch (error) {
      console.error("Upload attachment error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to upload file",
        data: null,
      };
    }
  },

  // Get note attachments
  getNoteAttachments: async (noteId) => {
    try {
      const response = await api.get(`/notes/${noteId}/attachments`);
      return {
        success: true,
        data: response.data.attachments || [],
      };
    } catch (error) {
      console.error("Get note attachments error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to fetch attachments",
        data: [],
      };
    }
  },

  // Delete attachment
  deleteAttachment: async (attachmentId) => {
    try {
      await api.delete(`/attachments/${attachmentId}`);
      return {
        success: true,
        message: "Attachment deleted successfully",
      };
    } catch (error) {
      console.error("Delete attachment error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to delete attachment",
      };
    }
  },

  // Download attachment
  downloadAttachment: async (attachmentId) => {
    try {
      const response = await api.get(`/attachments/${attachmentId}/download`, {
        responseType: "blob",
      });

      return {
        success: true,
        data: response.data,
        headers: response.headers,
      };
    } catch (error) {
      console.error("Download attachment error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to download attachment",
      };
    }
  },
};

export default { NotesAPI, RemindersAPI, AttachmentsAPI };
