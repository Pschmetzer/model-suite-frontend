import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchModels = createAsyncThunk(
  "models/fetch",
  async (_, thunkAPI) => {
    try {
      const token = JSON.parse(localStorage.getItem("auth"))?.token;
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await axios.get(`${baseUrl}/agency/agency-models`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data.models;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  },
);

const modelsSlice = createSlice({
  name: "models",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchModels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchModels.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchModels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default modelsSlice.reducer;
