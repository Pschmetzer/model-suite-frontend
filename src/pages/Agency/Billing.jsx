import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  uploadInvoiceAction,
  getInvoicesAction,
  exportInvoicesAction,
  updateInvoiceAction,
} from "../../globalstate/Actions/invoiceActions.jsx";

import Header from "../../components/Billing/Header.jsx";
import SearchBar from "../../components/Billing/SearchBar.jsx";
import InvoiceTable from "../../components/Billing/InvoiceTable.jsx";
import InvoiceModal from "../../components/Billing/InvoiceModal.jsx";
import Pagination from "../../components/Billing/Pagination.jsx";
import MassUpdatePaymentModal from "../../components/Billing/MassPayment.jsx";
import { motion } from "framer-motion";

const BillingUIDemo = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showMassUpdate, setShowMassUpdate] = useState(false);

  const [formData, setFormData] = useState({
    client: "",
    campaign: "",
    amount: "",
    currency: "INR",
    dueDate: "",
    status: "Unpaid",
    note: "",
    file: null,
  });
  const [page, setPage] = useState(1);
  const limit = 5;
  const {
    invoices,
    loading,
    currentInvoice,
    error,
    totalPages,
    totalInvoices,
  } = useSelector((state) => state.invoice);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getInvoicesAction(page, limit));
  }, [dispatch, page]);

  const handlePrev = () => {
    if (page > 1) setPage((prev) => prev - 1);
  };

  const handleNext = () => {
    if (page < totalPages) setPage((prev) => prev + 1);
  };

  const handleChange = useCallback((e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({ ...prev, [name]: files ? files[0] : value }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const form = new FormData();
      for (let key in formData) {
        form.append(key, formData[key]);
      }
      dispatch(uploadInvoiceAction(form));
      setShowModal(false);
    },
    [dispatch, formData],
  );

  const handleMassUpdateSubmit = (data) => {
    console.log("Mass update data:", data);
    setShowMassUpdate(false);
  };

  const handleModalOpen = useCallback(() => setShowModal(true), []);
  const handleModalClose = useCallback(() => setShowModal(false), []);

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return (
      invoices?.filter((inv) => {
        const clientName = inv.client?.fullName?.toLowerCase() || "";
        const username = inv.client?.username?.toLowerCase() || "";
        const status = inv.status?.toLowerCase() || "";

        return (
          clientName.includes(query) ||
          username.includes(query) ||
          status.includes(query)
        );
      }) || []
    );
  }, [searchQuery, invoices]);
  const handleEditInvoice = useCallback(
    (id, updatedData) => {
      dispatch(updateInvoiceAction(id, updatedData));
    },
    [dispatch],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen dark:bg-gradient-to-br from-zinc-950 via-zinc-900 to-black dark:text-white"
    >
      <div className="max-w-7xl mx-auto px-6 py-10">
        <Header title="Billing" onClick={handleModalOpen} />

        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex justify-between items-center mb-8"
        >
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMassUpdate(true)}
            className="ml-4 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-lg transition"
          >
            Update Payments
          </motion.button>
        </motion.div>

        <InvoiceTable
          invoices={filtered}
          loading={loading}
          onEdit={handleEditInvoice}
        />
        <Pagination
          page={page}
          totalPages={totalPages}
          onPrev={handlePrev}
          onNext={handleNext}
        />

        {showModal && (
          <InvoiceModal
            onClose={handleModalClose}
            onSubmit={handleSubmit}
            formData={formData}
            setFormData={setFormData}
            handleChange={handleChange}
          />
        )}

        {showMassUpdate && (
          <MassUpdatePaymentModal
            onClose={() => setShowMassUpdate(false)}
            onSubmit={handleMassUpdateSubmit}
          />
        )}
      </div>
    </motion.div>
  );
};

export default BillingUIDemo;
