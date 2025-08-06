import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedIds: {},
  search: "",
  page: 1,
  pageSize: 20,
  sectionId: null,
};

const questionsUiSlice = createSlice({
  name: "questionsUi",
  initialState,
  reducers: {
    setSearch: (state, action) => {
      state.search = action.payload;
      state.page = 1; // Reset to first page when searching
    },
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload;
      state.page = 1; // Reset to first page when changing page size
    },
    setSectionId: (state, action) => {
      state.sectionId = action.payload;
      state.page = 1; // Reset to first page when changing section
      state.selectedIds = {}; // Clear selection when switching sections
    },
    toggleSelect: (state, action) => {
      const id = action.payload;
      if (state.selectedIds[id]) {
        delete state.selectedIds[id];
      } else {
        state.selectedIds[id] = true;
      }
    },
    clearSelection: (state) => {
      state.selectedIds = {};
    },
    selectMany: (state, action) => {
      for (const id of action.payload) {
        state.selectedIds[id] = true;
      }
    },
    deselectMany: (state, action) => {
      for (const id of action.payload) {
        delete state.selectedIds[id];
      }
    },
  },
});

export const {
  setSearch,
  setPage,
  setPageSize,
  setSectionId,
  toggleSelect,
  clearSelection,
  selectMany,
  deselectMany,
} = questionsUiSlice.actions;

export default questionsUiSlice.reducer;
