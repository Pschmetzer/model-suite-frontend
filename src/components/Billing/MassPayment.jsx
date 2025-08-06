import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  massUpdateInvoicesAction,
  getInvoicesAction,
} from "../../globalstate/Actions/invoiceActions";
import { toast } from "react-hot-toast";

const MassUpdatePaymentModal = ({ onClose, onSubmit }) => {
  const dispatch = useDispatch();
  const { invoices, loading } = useSelector((state) => state.invoice);

  const [formData, setFormData] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (invoices.length > 0 && formData.length === 0) {
      const initial = invoices
        .filter((inv) => inv.status === "Unpaid" || inv.status === "Failed")
        .map((invoice) => ({
          invoiceId: invoice._id,
          transactionMethod: "",
          transactionStatus: "",
          screenshot: null,
          reason: "", // ✅ added
          client: invoice.client,
          amount: invoice.amount,
          currency: invoice.currency,
        }));

      setFormData(initial);
    }
  }, [invoices, formData.length]);

  const handleChange = (index, field, value) => {
    const updated = [...formData];
    updated[index][field] = value;
    setFormData(updated);
  };

  const handleFileChange = (index, file) => {
    const updated = [...formData];
    updated[index].screenshot = file;
    setFormData(updated);
  };

  const getCurrencySymbol = (currency) => {
    switch (currency) {
      case "INR":
        return "₹";
      case "USD":
        return "$";
      case "EUR":
        return "€";
      case "GBP":
        return "£";
      case "JPY":
        return "¥";
      default:
        return currency + " ";
    }
  };

  const validateFormData = () => {
    let atLeastOneFilled = false;

    for (let i = 0; i < formData.length; i++) {
      const { transactionMethod, transactionStatus, screenshot, reason } =
        formData[i];

      const anyFieldFilled =
        transactionMethod.trim() !== "" ||
        transactionStatus.trim() !== "" ||
        screenshot !== null;

      const allFieldsFilled =
        transactionMethod.trim() !== "" &&
        transactionStatus.trim() !== "" &&
        screenshot !== null;

      if (anyFieldFilled) {
        atLeastOneFilled = true;

        if (!allFieldsFilled) {
          toast.error(`⚠️ Please fill all fields for row ${i + 1}`);
          return false;
        }

        if (
          transactionStatus === "Failed" &&
          (!reason || reason.trim() === "")
        ) {
          toast.error(`⚠️ Please provide a failure reason for row ${i + 1}`);
          return false;
        }
      }
    }

    if (!atLeastOneFilled) {
      toast.error("⚠️ No fields filled. Nothing to update.");
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateFormData()) return;

    setSubmitting(true);

    const payload = new FormData();

    payload.append(
      "updates",
      JSON.stringify(
        formData
          .filter(
            (item) =>
              item.transactionMethod &&
              item.transactionStatus &&
              item.screenshot,
          )
          .map((item) => ({
            invoiceId: item.invoiceId,
            transactionMethod: item.transactionMethod,
            transactionStatus: item.transactionStatus,
            screenshotName: item.screenshot.name,
            reason:
              item.transactionStatus === "Failed"
                ? item.reason === "Other"
                  ? item.customReason || "Other"
                  : item.reason
                : undefined,
          })),
      ),
    );

    formData.forEach((item) => {
      if (item.screenshot) {
        payload.append(item.screenshot.name, item.screenshot);
      }
    });

    dispatch(
      massUpdateInvoicesAction(payload, () => {
        setSubmitting(false);
        onSubmit?.();
        onClose();
      }),
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white text-gray-800 w-full max-w-6xl rounded-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-semibold tracking-tight">
            💸 Mass Payment Update
          </h2>
          <button
            onClick={onClose}
            className="text-red-500 text-sm font-medium hover:underline"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-600 uppercase text-xs">
                  <th className="p-4 font-medium">Client</th>
                  <th className="p-4 font-medium">Amount</th>
                  <th className="p-4 font-medium">Transaction Method</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Screenshot</th>
                  <th className="p-4 font-medium">Failure Reason</th>
                </tr>
              </thead>
              <tbody>
                {formData.map((invoice, index) => (
                  <tr
                    key={`${invoice.invoiceId}-${index}`}
                    className="border-t hover:bg-gray-50 transition-all"
                  >
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                        {invoice.client?.fullName?.charAt(0) || "?"}
                      </div>
                      <span className="font-medium">
                        {invoice.client?.fullName || "Unknown"}
                      </span>
                    </td>

                    <td className="p-4 font-semibold text-gray-700">
                      {getCurrencySymbol(invoice.currency)}
                      {invoice.amount.toLocaleString("en-IN")}
                    </td>

                    <td className="p-4">
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={invoice.transactionMethod}
                        onChange={(e) =>
                          handleChange(
                            index,
                            "transactionMethod",
                            e.target.value,
                          )
                        }
                      >
                        <option value="">Select</option>
                        <option value="UPI">📱 UPI</option>
                        <option value="Bank Transfer">🏦 Bank Transfer</option>
                        <option value="Cash">💵 Cash</option>
                        <option value="SEPA">🔁 SEPA</option>
                        <option value="Sofort">⚡ Sofort (Klarna)</option>
                        <option value="PayPal">🅿️ PayPal</option>
                        <option value="Giropay">💶 Giropay</option>
                        <option value="Apple Pay">🍎 Apple Pay</option>
                        <option value="Google Pay">🤖 Google Pay</option>
                        <option value="Credit Card">💳 Credit Card</option>
                      </select>
                    </td>

                    <td className="p-4">
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={invoice.transactionStatus}
                        onChange={(e) =>
                          handleChange(
                            index,
                            "transactionStatus",
                            e.target.value,
                          )
                        }
                      >
                        <option value="">Select</option>
                        <option value="Paid">✅ Success</option>
                        <option value="Failed">❌ Failed</option>
                      </select>
                    </td>

                    <td className="p-4">
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpg,image/jpeg,application/pdf"
                        onChange={(e) =>
                          handleFileChange(index, e.target.files[0])
                        }
                        className="block w-full text-sm text-gray-600 file:mr-4 file:py-1.5 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {invoice.screenshot && (
                        <p className="text-xs text-green-600 mt-1 truncate">
                          {invoice.screenshot.name}
                        </p>
                      )}
                    </td>

                    <td className="p-4">
                      {invoice.transactionStatus === "Failed" && (
                        <div className="flex flex-col gap-2">
                          <select
                            value={invoice.reason || ""}
                            onChange={(e) =>
                              handleChange(index, "reason", e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            <option value="">Select reason</option>
                            <option value="Insufficient funds">
                              Insufficient funds
                            </option>
                            <option value="Incorrect account details">
                              Incorrect account details
                            </option>
                            <option value="Bank error">Bank error</option>
                            <option value="Technical issue">
                              Technical issue
                            </option>
                            <option value="Client-side failure">
                              Client-side failure
                            </option>
                            <option value="Other">Other</option>
                          </select>

                          {invoice.reason === "Other" && (
                            <input
                              type="text"
                              placeholder="Enter custom reason"
                              value={invoice.customReason || ""}
                              onChange={(e) => {
                                const updated = [...formData];
                                updated[index].customReason = e.target.value;
                                setFormData(updated);
                              }}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className={`${
                submitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              } transition-all text-white text-sm font-medium px-6 py-2.5 rounded-lg shadow-md`}
            >
              {submitting ? "Submitting..." : "✅ Submit Selected"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MassUpdatePaymentModal;
