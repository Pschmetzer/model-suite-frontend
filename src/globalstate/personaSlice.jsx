import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import personaService from "../services/personaService";

// Async thunks for persona operations

/**
 * Generate a new persona using AI
 */
export const generatePersona = createAsyncThunk(
  "persona/generate",
  async ({ modelId, tags }, { rejectWithValue }) => {
    try {
      const response = await personaService.generatePersona({ modelId, tags });
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to generate persona",
      );
    }
  },
);

/**
 * Save a persona
 */
export const savePersona = createAsyncThunk(
  "persona/save",
  async ({ modelId, content, tags }, { rejectWithValue }) => {
    try {
      const response = await personaService.savePersona({
        modelId,
        content,
        tags,
      });
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to save persona",
      );
    }
  },
);

/**
 * Fetch personas for the agency
 */
export const fetchPersonas = createAsyncThunk(
  "persona/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await personaService.getPersonas(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch personas",
      );
    }
  },
);

/**
 * Fetch a specific persona by ID
 */
export const fetchPersonaById = createAsyncThunk(
  "persona/fetchById",
  async (personaId, { rejectWithValue }) => {
    try {
      const response = await personaService.getPersonaById(personaId);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch persona",
      );
    }
  },
);

/**
 * Update a persona
 */
export const updatePersona = createAsyncThunk(
  "persona/update",
  async ({ personaId, content, tags }, { rejectWithValue }) => {
    try {
      const response = await personaService.updatePersona(personaId, {
        content,
        tags,
      });
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update persona",
      );
    }
  },
);

/**
 * Delete a persona
 */
export const deletePersona = createAsyncThunk(
  "persona/delete",
  async (personaId, { rejectWithValue }) => {
    try {
      await personaService.deletePersona(personaId);
      return personaId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete persona",
      );
    }
  },
);

/**
 * Export persona as PDF
 */
export const exportPersona = createAsyncThunk(
  "persona/export",
  async (personaId, { rejectWithValue }) => {
    try {
      const blob = await personaService.exportPersona(personaId);
      return { personaId, blob };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to export persona",
      );
    }
  },
);

/**
 * Fetch quota status
 */
export const fetchQuotaStatus = createAsyncThunk(
  "persona/fetchQuota",
  async (_, { rejectWithValue }) => {
    try {
      const response = await personaService.getQuotaStatus();
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch quota status",
      );
    }
  },
);

/**
 * Fetch analytics data
 */
export const fetchAnalytics = createAsyncThunk(
  "persona/fetchAnalytics",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await personaService.getAnalytics(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch analytics",
      );
    }
  },
);

// Initial state
const initialState = {
  // Current persona being worked on
  currentPersona: {
    modelId: null,
    content: "",
    tags: [],
    isGenerated: false,
  },

  // Personas list
  personas: [],
  totalPersonas: 0,
  currentPage: 1,
  totalPages: 1,

  // Selected persona for viewing/editing
  selectedPersona: null,

  // Loading states
  loading: {
    generating: false,
    saving: false,
    fetching: false,
    updating: false,
    deleting: false,
    exporting: false,
  },

  // Quota information
  quota: {
    used: 0,
    limit: 0,
    remaining: 0,
    resetDate: null,
  },

  // Analytics data
  analytics: {
    totalGenerated: 0,
    totalSaved: 0,
    popularTags: [],
    usageByModel: [],
    usageOverTime: [],
  },

  // Error states
  error: null,

  // UI state
  showAIPrompt: false,
};

// Persona slice
const personaSlice = createSlice({
  name: "persona",
  initialState,
  reducers: {
    // Clear current persona
    clearCurrentPersona: (state) => {
      state.currentPersona = {
        modelId: null,
        content: "",
        tags: [],
        isGenerated: false,
      };
      state.error = null;
    },

    // Set current persona model
    setCurrentPersonaModel: (state, action) => {
      state.currentPersona.modelId = action.payload;
    },

    // Update current persona content
    updateCurrentPersonaContent: (state, action) => {
      state.currentPersona.content = action.payload;
    },

    // Update current persona tags
    updateCurrentPersonaTags: (state, action) => {
      state.currentPersona.tags = action.payload;
    },

    // Set selected persona
    setSelectedPersona: (state, action) => {
      state.selectedPersona = action.payload;
    },

    // Clear selected persona
    clearSelectedPersona: (state) => {
      state.selectedPersona = null;
    },

    // Toggle AI prompt visibility
    toggleAIPrompt: (state) => {
      state.showAIPrompt = !state.showAIPrompt;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Set error
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate persona
      .addCase(generatePersona.pending, (state) => {
        state.loading.generating = true;
        state.error = null;
      })
      .addCase(generatePersona.fulfilled, (state, action) => {
        state.loading.generating = false;

        if (action.payload && action.payload.data) {
          const persona = action.payload.data;
          state.currentPersona.content = persona.personaText || "";
          state.currentPersona.tags = persona.tags || [];
          state.currentPersona.isGenerated = true;
        } else {
          state.error = "Invalid response format from server";
        }

        if (!state.error) {
          state.error = null;
        }
      })
      .addCase(generatePersona.rejected, (state, action) => {
        state.loading.generating = false;
        state.error = action.payload;
      })

      // Save persona
      .addCase(savePersona.pending, (state) => {
        state.loading.saving = true;
        state.error = null;
      })
      .addCase(savePersona.fulfilled, (state, action) => {
        state.loading.saving = false;
        // Add to personas list if not already there
        const existingIndex = state.personas.findIndex(
          (p) => p._id === action.payload._id,
        );
        if (existingIndex === -1) {
          state.personas.unshift(action.payload);
          state.totalPersonas += 1;
        } else {
          state.personas[existingIndex] = action.payload;
        }
        state.error = null;
      })
      .addCase(savePersona.rejected, (state, action) => {
        state.loading.saving = false;
        state.error = action.payload;
      })

      // Fetch personas
      .addCase(fetchPersonas.pending, (state) => {
        state.loading.fetching = true;
        state.error = null;
      })
      .addCase(fetchPersonas.fulfilled, (state, action) => {
        state.loading.fetching = false;
        state.personas = action.payload.personas || [];
        state.totalPersonas = action.payload.total || 0;
        state.currentPage = action.payload.currentPage || 1;
        state.totalPages = action.payload.totalPages || 1;
        state.error = null;
      })
      .addCase(fetchPersonas.rejected, (state, action) => {
        state.loading.fetching = false;
        state.error = action.payload;
      })

      // Fetch persona by ID
      .addCase(fetchPersonaById.pending, (state) => {
        state.loading.fetching = true;
        state.error = null;
      })
      .addCase(fetchPersonaById.fulfilled, (state, action) => {
        state.loading.fetching = false;
        state.selectedPersona = action.payload;
        state.error = null;
      })
      .addCase(fetchPersonaById.rejected, (state, action) => {
        state.loading.fetching = false;
        state.error = action.payload;
      })

      // Update persona
      .addCase(updatePersona.pending, (state) => {
        state.loading.updating = true;
        state.error = null;
      })
      .addCase(updatePersona.fulfilled, (state, action) => {
        state.loading.updating = false;
        // Update in personas list
        const index = state.personas.findIndex(
          (p) => p._id === action.payload._id,
        );
        if (index !== -1) {
          state.personas[index] = action.payload;
        }
        // Update selected persona if it's the same
        if (state.selectedPersona?._id === action.payload._id) {
          state.selectedPersona = action.payload;
        }
        state.error = null;
      })
      .addCase(updatePersona.rejected, (state, action) => {
        state.loading.updating = false;
        state.error = action.payload;
      })

      // Delete persona
      .addCase(deletePersona.pending, (state) => {
        state.loading.deleting = true;
        state.error = null;
      })
      .addCase(deletePersona.fulfilled, (state, action) => {
        state.loading.deleting = false;
        // Remove from personas list
        state.personas = state.personas.filter((p) => p._id !== action.payload);
        state.totalPersonas -= 1;
        // Clear selected persona if it was deleted
        if (state.selectedPersona?._id === action.payload) {
          state.selectedPersona = null;
        }
        state.error = null;
      })
      .addCase(deletePersona.rejected, (state, action) => {
        state.loading.deleting = false;
        state.error = action.payload;
      })

      // Export persona
      .addCase(exportPersona.pending, (state) => {
        state.loading.exporting = true;
        state.error = null;
      })
      .addCase(exportPersona.fulfilled, (state) => {
        state.loading.exporting = false;
        state.error = null;
      })
      .addCase(exportPersona.rejected, (state, action) => {
        state.loading.exporting = false;
        state.error = action.payload;
      })

      // Fetch quota status
      .addCase(fetchQuotaStatus.fulfilled, (state, action) => {
        // action.payload is ApiResponse { statusCode, data, message, success }
        // we only need the inner data object for quota fields
        state.quota = action.payload.data || action.payload;
      })

      // Fetch analytics
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      });
  },
});

// Export actions
export const {
  clearCurrentPersona,
  setCurrentPersonaModel,
  updateCurrentPersonaContent,
  updateCurrentPersonaTags,
  setSelectedPersona,
  clearSelectedPersona,
  toggleAIPrompt,
  clearError,
  setError,
} = personaSlice.actions;

// Export reducer
export default personaSlice.reducer;
