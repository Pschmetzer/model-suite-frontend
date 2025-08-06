import {
  getDataAPI,
  postDataAPI,
  putDataAPI,
  deleteDataAPI,
} from "../../utils/fetchData.jsx";
import { toast } from "react-hot-toast";

import {
  setLoading,
  setError,
  setInvoices,
  addInvoice,
  setCurrentInvoice,
  updateInvoiceInState,
  deleteInvoiceFromState,
  updateMultipleInvoicesInState,
} from "../invoiceSlice";

// ✅ Upload Invoice
export const uploadInvoiceAction = (formData) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const res = await postDataAPI("billing/invoice", formData);
    dispatch(addInvoice(res.data.invoice));
    toast.success("Invoice uploaded successfully!");
  } catch (err) {
    dispatch(setError(err.response?.data?.message || "Upload failed"));
    toast.error(err.response?.data?.message || "Upload failed");
  } finally {
    dispatch(setLoading(false));
  }
};

// ✅ Get All Invoices
export const getInvoicesAction =
  (page = 1, limit = 10, status = "") =>
  async (dispatch) => {
    try {
      dispatch(setLoading(true));
      const res = await getDataAPI(
        `billing/invoices?page=${page}&limit=${limit}&status=${status}`,
      );
      dispatch(setInvoices(res.data));
    } catch (err) {
      const msg = err.response?.data?.message || "Fetching failed";
      dispatch(setError(msg));
      toast.error(msg);
    } finally {
      dispatch(setLoading(false));
    }
  };

// ✅ Get Single Invoice by ID (with toast)
export const getInvoiceByIdAction = (id) => async (dispatch) => {
  try {
    const res = await getDataAPI(`billing/invoices/${id}`);
    dispatch(setCurrentInvoice(res.data.data));
  } catch (err) {
    const msg = err.response?.data?.message || "Invoice not found";
    dispatch(setError(msg));
    toast.error(msg); // ✅ Added toast
  }
};

// ✅ Delete Invoice
export const deleteInvoiceAction = (id) => async (dispatch) => {
  try {
    await deleteDataAPI(`billing/invoices/${id}`);
    dispatch(deleteInvoiceFromState(id));
    toast.success("Invoice deleted");
  } catch (err) {
    dispatch(setError(err.response?.data?.message || "Delete failed"));
    toast.error(err.response?.data?.message || "Delete failed");
  }
};

// ✅ Export Invoices as CSV
export const exportInvoicesAction = () => async () => {
  try {
    const res = await getDataAPI("invoices/export");
    if (res.data?.downloadUrl) {
      const link = document.createElement("a");
      link.href = res.data.downloadUrl;
      link.setAttribute("download", "invoices.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("CSV export started");
    } else {
      toast.error("Download URL not available");
    }
  } catch (err) {
    console.error("CSV Export Error:", err);
    toast.error(err.response?.data?.message || "CSV export failed");
  }
};

// ✅ Search Models
export const searchModelsAction = (query) => async (dispatch) => {
  try {
    dispatch(setLoading(true));

    const token = JSON.parse(localStorage.getItem("auth"))?.token;
    if (!token) throw new Error("Token not found");

    const res = await getDataAPI(`/agency/models?search=${query}`, token);
    return res.data;
  } catch (err) {
    dispatch(setError(err.response?.data?.message || "Model search failed"));
    toast.error(err.response?.data?.message || "Model search failed");
    return [];
  } finally {
    dispatch(setLoading(false));
  }
};

// ✅ Mass Update Invoices
export const massUpdateInvoicesAction =
  (formData, onSuccess) => async (dispatch) => {
    try {
      dispatch(setLoading(true));
      const res = await postDataAPI("billing/mass-update", formData, true);
      dispatch(updateMultipleInvoicesInState(res.data.data));
      toast.success("update successful!");
      if (onSuccess) onSuccess();
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || " update failed";
      dispatch(setError(errorMsg));
      toast.error(errorMsg);
    } finally {
      dispatch(setLoading(false));
    }
  };

// ✅ Update Invoice
export const updateInvoiceAction = (id, data) => async (dispatch) => {
  try {
    dispatch(setLoading(true));

    let payload = data;
    let isFormData = false;

    if (data.screenshot instanceof File) {
      isFormData = true;
      const formData = new FormData();
      for (let key in data) {
        formData.append(key, data[key]);
      }
      payload = formData;
    }

    const res = await putDataAPI(`billing/invoices/${id}`, payload, isFormData);
    dispatch(updateInvoiceInState({ id, data: res.data.updatedInvoice }));
    toast.success("Invoice updated!");
  } catch (err) {
    const msg = err.response?.data?.message || "Update failed";
    dispatch(setError(msg));
    toast.error(msg);
  } finally {
    dispatch(setLoading(false));
  }
};
