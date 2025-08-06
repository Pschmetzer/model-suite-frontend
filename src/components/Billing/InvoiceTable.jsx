import React, { useState } from "react";
import moment from "moment";
import { useDispatch } from "react-redux";
import { massUpdateInvoicesAction } from "../../globalstate/Actions/invoiceActions";
import { toast } from "react-hot-toast";

const InvoiceTable = React.memo(({ invoices = [], loading, onEdit }) => {
  const dispatch = useDispatch();

  const [editRowId, setEditRowId] = useState(null);
  const [editForm, setEditForm] = useState({
    transactionMethod: "",
    transactionStatus: "",
    screenshot: null,
    reason: "",
    customReason: "",
  });

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

  const handleEditClick = (inv) => {
    setEditRowId(inv._id);
    setEditForm({
      transactionMethod: "",
      transactionStatus: "",
      screenshot: null,
      reason: "",
      customReason: "",
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 2 * 1024 * 1024) {
      alert("File size should be ≤ 2MB");
      return;
    }
    setEditForm({ ...editForm, screenshot: file });
  };

  const handleUpdate = (invoiceId) => {
    const {
      transactionMethod,
      transactionStatus,
      screenshot,
      reason,
      customReason,
    } = editForm;

    if (!transactionMethod || !transactionStatus || !screenshot) {
      toast.error("Please fill all fields.");
      return;
    }

    let finalReason = undefined;

    if (transactionStatus === "Failed") {
      if (!reason) {
        toast.error("Please select failure reason.");
        return;
      }

      if (reason === "Other" && !customReason.trim()) {
        toast.error("Please provide a custom reason.");
        return;
      }

      finalReason = reason === "Other" ? customReason.trim() : reason;
    }

    const updateData = {
      invoiceId,
      transactionMethod,
      transactionStatus,
      screenshotName: screenshot.name,
    };

    if (transactionStatus === "Failed") {
      updateData.reason = finalReason;
    }

    const payload = new FormData();
    payload.append("updates", JSON.stringify([updateData]));
    payload.append("screenshot", screenshot); // ✅ Proper key used

    console.log("Sending updateData to backend:", updateData);

    dispatch(
      massUpdateInvoicesAction(payload, () => {
        setEditRowId(null);
        toast.success("Invoice updated!");
      }),
    );
  };

  return (
    <div className="overflow-x-auto scrollBar dark:bg-gray-800 rounded-lg shadow">
      <table className="min-w-full divide-y dark:divide-gray-700">
        <thead className="dark:bg-gray-700">
          <tr>
            {[
              "Client",
              "Campaign",
              "Amount",
              "Payment Status",
              "Payment Method",
              "Payment Receipt",
              "Due Date",
              "Due Status",
              "Download",
              "Actions",
            ].map((col) => (
              <th
                key={col}
                className="px-4 py-2 text-left text-xs font-medium dark:text-gray-300"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="dark:divide-y dark:divide-gray-700">
          {loading ? (
            <tr>
              <td colSpan={12} className="text-center text-gray-400 py-4">
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              </td>
            </tr>
          ) : invoices.length === 0 ? (
            <tr>
              <td colSpan={12} className="text-center text-gray-400 py-4">
                No invoices found.
              </td>
            </tr>
          ) : (
            invoices.map((inv) => (
              <tr key={inv._id}>
                <td className="px-4 py-2 text-sm">
                  {inv.client?.fullName || "N/A"}
                </td>
                <td className="px-4 py-2 text-sm">{inv.campaign}</td>
                <td className="px-4 py-2 text-sm">
                  {getCurrencySymbol(inv.currency)}
                  {inv.amount.toLocaleString("en-IN")}
                </td>
                <td
                  className={`px-4 py-2 text-sm ${
                    inv.status === "Paid"
                      ? "text-green-400"
                      : inv.status === "Unpaid"
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  {inv.status}
                </td>

                <td className="px-4 py-2 text-sm">
                  {editRowId === inv._id ? (
                    <select
                      value={editForm.transactionMethod}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          transactionMethod: e.target.value,
                        })
                      }
                      className="bg-gray-700 text-gray-200 rounded px-1 py-1 text-xs w-full"
                    >
                      <option value="">Select</option>
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank</option>
                      <option value="Cash">Cash</option>
                      <option value="SEPA">SEPA</option>
                      <option value="PayPal">PayPal</option>
                    </select>
                  ) : inv.status === "Paid" ? (
                    <span className="text-xs text-gray-200">
                      {inv.transactionMethod}
                    </span>
                  ) : (
                    <span className="text-gray-500 italic text-xs">
                      Pending
                    </span>
                  )}
                </td>

                <td className="px-4 py-2 text-sm">
                  {inv.status === "Paid" && inv.screenshotUrl ? (
                    <a
                      href={inv.screenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 text-sm hover:underline"
                    >
                      📎 View
                    </a>
                  ) : editRowId === inv._id ? (
                    <>
                      <label className="text-blue-400 cursor-pointer text-xs underline">
                        Upload
                        <input
                          type="file"
                          onChange={handleFileChange}
                          className="hidden"
                          accept="image/*,.pdf"
                        />
                      </label>
                      {editForm.screenshot && (
                        <p className="text-green-400 text-[10px] mt-1 truncate max-w-[80px]">
                          {editForm.screenshot.name}
                        </p>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-500 italic text-xs">
                      Not Uploaded
                    </span>
                  )}
                </td>

                <td className="px-4 py-2 text-sm">
                  {moment(inv.dueDate).format("YYYY-MM-DD")}
                </td>
                <td
                  className={`px-4 py-2 text-sm ${
                    inv.dueStatus === "Paid In Advance"
                      ? "text-green-400"
                      : inv.dueStatus === "Paid Late"
                        ? "text-yellow-400"
                        : inv.dueStatus === "Overdue"
                          ? "text-red-400"
                          : inv.dueStatus === "Upcoming"
                            ? "text-blue-400"
                            : inv.dueStatus === "Payment Failed"
                              ? "text-red-600"
                              : "text-gray-400"
                  }`}
                >
                  {inv.dueStatus || "Unknown"}
                </td>

                <td className="px-4 py-2 text-sm">
                  {inv.fileUrl ? (
                    <a
                      href={inv.fileUrl}
                      download={`invoice_${inv._id}.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      📥
                    </a>
                  ) : (
                    <span className="text-gray-400">No file</span>
                  )}
                </td>

                <td className="px-4 py-2 text-sm">
                  {editRowId === inv._id ? (
                    <div className="flex flex-col gap-1">
                      <select
                        value={editForm.transactionStatus}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            transactionStatus: e.target.value,
                          })
                        }
                        className="bg-gray-700 text-gray-200 rounded px-1 py-1 text-xs"
                      >
                        <option value="">Status</option>
                        <option value="Paid">✅ Paid</option>
                        <option value="Failed">❌ Failed</option>
                      </select>

                      {editForm.transactionStatus === "Failed" && (
                        <>
                          <select
                            value={editForm.reason}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                reason: e.target.value,
                                customReason: "",
                              })
                            }
                            className="mt-1 bg-gray-700 text-gray-200 rounded px-2 py-1 text-xs w-full"
                          >
                            <option value="">Select Reason</option>

                            <option value="Wrong UPI">Wrong UPI</option>
                            <option value="Bank Issue">Bank Issue</option>
                            <option value="Other">Other</option>
                            <option value="Insufficient funds">
                              Insufficient funds
                            </option>
                            <option value="Incorrect account details">
                              Incorrect account details
                            </option>

                            <option value="Technical issue">
                              Technical issue
                            </option>
                            <option value="Client-side failure">
                              Client-side failure
                            </option>
                          </select>

                          {editForm.reason === "Other" && (
                            <input
                              type="text"
                              placeholder="Enter custom reason"
                              value={editForm.customReason}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  customReason: e.target.value,
                                })
                              }
                              className="mt-1 bg-gray-700 text-gray-200 rounded px-2 py-1 text-xs w-full"
                            />
                          )}
                        </>
                      )}

                      <button
                        onClick={() => handleUpdate(inv._id)}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded"
                        title="Save Changes"
                      >
                        💾 Save
                      </button>
                    </div>
                  ) : inv.status !== "Paid" ? (
                    <button
                      onClick={() => handleEditClick(inv)}
                      className="text-blue-400 text-sm hover:underline"
                      title="Make Payment"
                    >
                      ✏️ Edit
                    </button>
                  ) : (
                    <span className="text-gray-500 text-xs">-</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
});

export default InvoiceTable;
