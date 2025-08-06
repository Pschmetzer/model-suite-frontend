import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;

// Async thunk for login
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ identifier, password, userType }, { rejectWithValue }) => {
    try {
      const endpoint = userType === "agency" ? "/agency/login" : "/model/login";
      const response = await axios.post(
        `${baseURL}${endpoint}`,
        {
          identifier,
          password,
        },
        {
          withCredentials: true,
        },
      );

      // Store in localStorage for persistence
      localStorage.setItem(
        "auth",
        JSON.stringify({
          user: response.data.user,
          token: response.data.token,
        }),
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Login failed");
    }
  },
);

// Async thunk for OTP verification
export const verifyOTP = createAsyncThunk(
  "auth/verifyOTP",
  async ({ identifier, otp, userType }, { rejectWithValue }) => {
    try {
      const endpoint =
        userType === "agency"
          ? "/agency/login/verify-otp"
          : "/model/login/verify-otp";
      const response = await axios.post(
        `${baseURL}${endpoint}`,
        {
          identifier,
          otp,
        },
        {
          withCredentials: true,
        },
      );

      // Store in localStorage for persistence
      localStorage.setItem(
        "auth",
        JSON.stringify({
          user: response.data.user,
          token: response.data.token,
        }),
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "OTP verification failed",
      );
    }
  },
);

// Load initial state from localStorage
const loadInitialState = () => {
  try {
    const authData = localStorage.getItem("auth");
    if (authData) {
      const { user, token } = JSON.parse(authData);
      return {
        user,
        token,
        isAuthenticated: true,
        permissions: user?.effectivePermissions || user?.permissions || [],
        role: user?.role,
        loading: false,
        error: null,
        otpRequired: false,
        pendingData: null,
        lastPermissionUpdate: Date.now(),
      };
    }
  } catch (error) {
    console.error("Error loading auth state from localStorage:", error);
  }

  return {
    user: null,
    token: null,
    isAuthenticated: false,
    permissions: [],
    role: null,
    loading: false,
    error: null,
    otpRequired: false,
    pendingData: null,
    lastPermissionUpdate: null,
  };
};

const authSlice = createSlice({
  name: "auth",
  initialState: loadInitialState(),
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.permissions = [];
      state.role = null;
      state.error = null;
      state.otpRequired = false;
      state.pendingData = null;

      // Clear localStorage
      localStorage.removeItem("auth");
      localStorage.removeItem("token");
      localStorage.removeItem("tokenExpiry");
    },
    clearError: (state) => {
      state.error = null;
    },
    setOTPRequired: (state, action) => {
      state.otpRequired = true;
      state.pendingData = action.payload;
    },
    clearOTPState: (state) => {
      state.otpRequired = false;
      state.pendingData = null;
    },
    forcePermissionUpdate: (state) => {
      // Force a re-render by updating a timestamp
      state.lastPermissionUpdate = Date.now();

      // Re-extract permissions from user object to ensure consistency
      if (state.user) {
        state.permissions =
          state.user?.effectivePermissions || state.user?.permissions || [];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;

        // Check if OTP is required
        if (!action.payload.token || !action.payload.user) {
          state.otpRequired = true;
          state.pendingData = { identifier: action.meta.arg.identifier };
          return;
        }

        // Successful login
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.permissions =
          action.payload.user?.effectivePermissions ||
          action.payload.user?.permissions ||
          [];
        state.role = action.payload.user?.role;
        state.otpRequired = false;
        state.pendingData = null;

        // Force update localStorage to ensure consistency
        localStorage.setItem(
          "auth",
          JSON.stringify({
            user: action.payload.user,
            token: action.payload.token,
          }),
        );
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // OTP verification cases
      .addCase(verifyOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.permissions =
          action.payload.user?.effectivePermissions ||
          action.payload.user?.permissions ||
          [];
        state.role = action.payload.user?.role;
        state.otpRequired = false;
        state.pendingData = null;

        // Force update localStorage to ensure consistency
        localStorage.setItem(
          "auth",
          JSON.stringify({
            user: action.payload.user,
            token: action.payload.token,
          }),
        );
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  logout,
  clearError,
  setOTPRequired,
  clearOTPState,
  forcePermissionUpdate,
} = authSlice.actions;
export default authSlice.reducer;
