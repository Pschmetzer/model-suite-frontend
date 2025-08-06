import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Async thunks for profile operations
export const fetchProfile = createAsyncThunk(
  "profile/fetchProfile",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = JSON.parse(localStorage.getItem("auth"))?.token;
      if (!token) throw new Error("No authentication token");

      const response = await fetch(`${API_BASE_URL}/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateProfile = createAsyncThunk(
  "profile/updateProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const token = JSON.parse(localStorage.getItem("auth"))?.token;
      if (!token) throw new Error("No authentication token");

      const response = await fetch(`${API_BASE_URL}/profile/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const createProfile = createAsyncThunk(
  "profile/createProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const token = JSON.parse(localStorage.getItem("auth"))?.token;
      if (!token) throw new Error("No authentication token");

      const response = await fetch(`${API_BASE_URL}/profile/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error("Failed to create profile");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const uploadAvatar = createAsyncThunk(
  "profile/uploadAvatar",
  async (file, { rejectWithValue }) => {
    try {
      const token = JSON.parse(localStorage.getItem("auth"))?.token;
      if (!token) throw new Error("No authentication token");

      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch(`${API_BASE_URL}/profile/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload avatar");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const uploadCover = createAsyncThunk(
  "profile/uploadCover",
  async (file, { rejectWithValue }) => {
    try {
      const token = JSON.parse(localStorage.getItem("auth"))?.token;
      if (!token) throw new Error("No authentication token");

      const formData = new FormData();
      formData.append("cover", file);

      const response = await fetch(`${API_BASE_URL}/profile/cover`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload cover photo");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Initial state
const initialState = {
  data: {
    display_name: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    bio: "",
    job_title: "",
    role_description: "",
    status: "",
    avatar_url: "",
    cover_url: "",
    social_links: {
      instagram: "",
      tiktok: "",
      youtube: "",
    },
    availability_text: "",
    reachability: "",
    last_active: "",
    hide_last_active: false,
    what_i_do: "",
    passions: "",
    communication_style: "",
    languages: [],
    fun_fact: "",
    // Profile enhancement fields
    interests: [],
    goals: [],
    demographics: "",
    archetype: "",
    tone: "",
    audience: "",
    // Portfolio
    portfolio: [],
  },
  loading: false,
  error: null,
  isEditing: false,
  uploadingAvatar: false,
  uploadingCover: false,
};

// Profile slice
const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setEditMode: (state, action) => {
      state.isEditing = action.payload;
    },
    updateProfileField: (state, action) => {
      const { field, value } = action.payload;
      if (field.includes(".")) {
        // Handle nested fields like social_links.instagram
        const [parent, child] = field.split(".");
        state.data[parent][child] = value;
      } else {
        state.data[field] = value;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    resetProfile: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profile
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.data = { ...state.data, ...action.payload };
        state.error = null;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.data = { ...state.data, ...action.payload };
        state.error = null;
        state.isEditing = false;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Profile
      .addCase(createProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.data = { ...state.data, ...action.payload };
        state.error = null;
      })
      .addCase(createProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Upload Avatar
      .addCase(uploadAvatar.pending, (state) => {
        state.uploadingAvatar = true;
        state.error = null;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.uploadingAvatar = false;
        state.data.avatar_url = action.payload.avatar_url;
        state.error = null;
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.uploadingAvatar = false;
        state.error = action.payload;
      })
      // Upload Cover
      .addCase(uploadCover.pending, (state) => {
        state.uploadingCover = true;
        state.error = null;
      })
      .addCase(uploadCover.fulfilled, (state, action) => {
        state.uploadingCover = false;
        state.data.cover_url = action.payload.cover_url;
        state.error = null;
      })
      .addCase(uploadCover.rejected, (state, action) => {
        state.uploadingCover = false;
        state.error = action.payload;
      });
  },
});

export const { setEditMode, updateProfileField, clearError, resetProfile } =
  profileSlice.actions;

export default profileSlice.reducer;
