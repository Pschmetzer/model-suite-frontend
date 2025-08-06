import { createSlice } from "@reduxjs/toolkit";

const invoiceSlice = createSlice({
  name: "invoice",
  initialState: {
    invoices: [],
    currentInvoice: null,
    loading: false,
    error: null,
    totalPages: 1,
    totalInvoices: 0,
  },
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearInvoiceError: (state) => {
      state.error = null;
    },
    setInvoices: (state, action) => {
      state.invoices = action.payload.invoices;
      state.totalPages = action.payload.totalPages;
      state.totalInvoices = action.payload.totalInvoices;
    },
    addInvoice: (state, action) => {
      state.invoices.unshift(action.payload);
    },
    setCurrentInvoice: (state, action) => {
      state.currentInvoice = action.payload;
    },
    updateInvoiceInState: (state, action) => {
      const index = state.invoices.findIndex(
        (i) => i._id === action.payload.id,
      );
      if (index !== -1) {
        state.invoices[index] = {
          ...state.invoices[index],
          ...action.payload.data,
        };
      }
    },
    deleteInvoiceFromState: (state, action) => {
      state.invoices = state.invoices.filter((i) => i._id !== action.payload);
    },
    updateMultipleInvoicesInState: (state, action) => {
      const updatedList = action.payload;
      updatedList.forEach((updatedInvoice) => {
        const index = state.invoices.findIndex(
          (i) => i._id === updatedInvoice._id,
        );
        if (index !== -1) {
          state.invoices[index] = updatedInvoice;
        }
      });
    },
  },
});

export const {
  setLoading,
  setError,
  clearInvoiceError,
  setInvoices,
  addInvoice,
  setCurrentInvoice,
  updateInvoiceInState,
  deleteInvoiceFromState,
  updateMultipleInvoicesInState,
} = invoiceSlice.actions;

export default invoiceSlice.reducer;
