import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import captionService from "../services/captionService.js";

// Async thunks for API calls
export const generateCaptions = createAsyncThunk(
  "caption/generateCaptions",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await captionService.generateCaptions(formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to generate captions",
      );
    }
  },
);

export const fetchQuotaStatus = createAsyncThunk(
  "caption/fetchQuotaStatus",
  async (_, { rejectWithValue }) => {
    try {
      const response = await captionService.getQuotaStatus();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch quota status",
      );
    }
  },
);

export const fetchCaptionHistory = createAsyncThunk(
  "caption/fetchCaptionHistory",
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await captionService.getCaptionHistory({ page, limit });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch caption history",
      );
    }
  },
);

export const uploadMedia = createAsyncThunk(
  "caption/uploadMedia",
  async (file, { rejectWithValue }) => {
    try {
      const response = await captionService.uploadMedia(file);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to upload media",
      );
    }
  },
);

const initialState = {
  // Current generation state
  currentMedia: null,
  generatedCaptions: [],
  isGenerating: false,
  generateError: null,

  // Upload state
  isUploading: false,
  uploadProgress: 0,
  uploadError: null,

  // Quota state
  quotaStatus: {
    usageCount: 0,
    quotaRemaining: 5,
    resetTime: null,
    dailyLimit: 5,
  },
  quotaLoading: false,
  quotaError: null,

  // History state
  history: [],
  historyLoading: false,
  historyError: null,
  historyPagination: {
    current: 1,
    total: 1,
    hasNext: false,
    count: 0,
    totalRecords: 0,
    limit: 10,
  },

  // UI state
  activeTab: "generator", // "generator" | "history"
  selectedStyle: "professional",
  captionCount: 3,

  // Generation metadata
  lastGeneration: {
    aiService: null,
    processingTime: null,
    isNsfw: false,
    timestamp: null,
  },
};

const captionSlice = createSlice({
  name: "caption",
  initialState,
  reducers: {
    // UI actions
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },

    setSelectedStyle: (state, action) => {
      state.selectedStyle = action.payload;
    },

    setCaptionCount: (state, action) => {
      state.captionCount = Math.min(Math.max(action.payload, 1), 10);
    },

    // Media actions
    setCurrentMedia: (state, action) => {
      // Extract File object and store only serializable data
      const { file: _file, ...serializableData } = action.payload;
      state.currentMedia = serializableData;
      state.generatedCaptions = [];
      state.generateError = null;
    },

    clearCurrentMedia: (state) => {
      state.currentMedia = null;
      state.generatedCaptions = [];
      state.generateError = null;
      state.uploadProgress = 0;
      state.uploadError = null;
    },

    // Error clearing
    clearErrors: (state) => {
      state.generateError = null;
      state.uploadError = null;
      state.quotaError = null;
      state.historyError = null;
    },

    // Upload progress
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },

    // Reset state
    resetCaptionState: (state) => {
      return { ...initialState, quotaStatus: state.quotaStatus };
    },
  },

  extraReducers: (builder) => {
    // Generate captions
    builder
      .addCase(generateCaptions.pending, (state) => {
        state.isGenerating = true;
        state.generateError = null;
      })
      .addCase(generateCaptions.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.generatedCaptions = action.payload.captions;
        state.lastGeneration = {
          aiService: action.payload.metadata.aiService,
          processingTime: action.payload.metadata.processingTime,
          isNsfw: action.payload.metadata.isNsfw,
          timestamp: new Date().toISOString(),
        };
        // Update quota after successful generation
        if (action.payload.metadata.quotaRemaining !== undefined) {
          state.quotaStatus.quotaRemaining =
            action.payload.metadata.quotaRemaining;
          state.quotaStatus.usageCount = action.payload.metadata.quotaUsed;
        }
      })
      .addCase(generateCaptions.rejected, (state, action) => {
        state.isGenerating = false;
        state.generateError = action.payload;
      });

    // Upload media
    builder
      .addCase(uploadMedia.pending, (state) => {
        state.isUploading = true;
        state.uploadError = null;
        state.uploadProgress = 0;
      })
      .addCase(uploadMedia.fulfilled, (state, action) => {
        state.isUploading = false;
        state.uploadProgress = 100;
        // Merge the upload result with existing preview data
        state.currentMedia = {
          ...state.currentMedia,
          ...action.payload,
        };
      })
      .addCase(uploadMedia.rejected, (state, action) => {
        state.isUploading = false;
        state.uploadError = action.payload;
        state.uploadProgress = 0;
      });

    // Fetch quota status
    builder
      .addCase(fetchQuotaStatus.pending, (state) => {
        state.quotaLoading = true;
        state.quotaError = null;
      })
      .addCase(fetchQuotaStatus.fulfilled, (state, action) => {
        state.quotaLoading = false;
        state.quotaStatus = action.payload;
      })
      .addCase(fetchQuotaStatus.rejected, (state, action) => {
        state.quotaLoading = false;
        state.quotaError = action.payload;
      });

    // Fetch caption history
    builder
      .addCase(fetchCaptionHistory.pending, (state) => {
        state.historyLoading = true;
        state.historyError = null;
      })
      .addCase(fetchCaptionHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.history = action.payload.history;
        state.historyPagination = action.payload.pagination;
      })
      .addCase(fetchCaptionHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.historyError = action.payload;
      });
  },
});

export const {
  setActiveTab,
  setSelectedStyle,
  setCaptionCount,
  setCurrentMedia,
  clearCurrentMedia,
  clearErrors,
  setUploadProgress,
  resetCaptionState,
} = captionSlice.actions;

export default captionSlice.reducer;
