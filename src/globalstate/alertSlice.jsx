import { createSlice } from "@reduxjs/toolkit";

const alertSlice = createSlice({
  name: "alert",
  initialState: {},
  reducers: {
    setAlert: (state, action) => {
      return action.payload; // direct overwrite like old reducer
    },
    clearAlert: () => {
      return {}; // optional clear method
    },
  },
});

export const { setAlert, clearAlert } = alertSlice.actions;
export default alertSlice.reducer;
