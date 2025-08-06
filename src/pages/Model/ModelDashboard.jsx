import React, { useEffect, useState } from "react";
import { getDataAPI } from "../../utils/fetchData";

const statusColors = {
  Paid: "bg-green-500/20 text-green-400",
  Unpaid: "bg-yellow-500/20 text-yellow-400",
  Failed: "bg-red-500/20 text-red-400",
};

const currencySymbols = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
};

const ModelDashboard = ({ modelId }) => {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [taxStatus, setTaxStatus] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await getDataAPI(`/billing/modeldashboard/${modelId}`);
        const data = await res.data;

        setInvoices(data.invoices);
        setSummary(data.summary);
        setTaxStatus(data.taxStatus);
        setActivities(data.activities);
      } catch (err) {
        console.error("Dashboard fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    if (modelId) fetchDashboardData();
  }, [modelId]);

  if (loading || !summary || !taxStatus) {
    return (
      <div className="text-center text-white py-20">Loading dashboard...</div>
    );
  }

  return (
    <div className="p-8 bg-gray-950 text-white min-h-screen transition-colors duration-500">
      <div className="max-w-6xl mx-auto space-y-10 [perspective:1000px]">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: "Amount Already Paid",
              value: summary.thisMonthEarnings,
              color: "text-green-400",
            },
            {
              label: "Pending Payout",
              value: summary.pendingPayout,
              color: "text-orange-400",
            },
            {
              label: "Last Payout",
              value: summary.lastPayout,
              color: "text-white",
            },
            {
              label: "Next Payout Method",
              value: summary.nextMethod,
              color: "text-white",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-gray-900 hover:bg-gray-800 transition duration-300 transform rounded-2xl shadow-xl p-6 text-center hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.03] hover:rotate-x-[2deg] hover:rotate-y-[2deg]"
              style={{
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
              }}
            >
              <h2 className="text-sm text-gray-400 tracking-wide">
                {item.label}
              </h2>
              <p className={`text-3xl font-bold mt-3 ${item.color}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Invoice Table */}
        <div className="bg-gray-900 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1">
          <h3 className="text-2xl font-semibold mb-6">Invoice History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="py-3 px-4">Campaign</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Due</th>
                  <th className="py-3 px-4">Uploaded By</th>{" "}
                  {/* ✅ NEW COLUMN */}
                  <th className="py-3 px-4">PDF</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, idx) => (
                  <tr
                    key={idx}
                    className="border-t border-gray-800 hover:bg-gray-800 transition"
                  >
                    <td className="py-3 px-4 font-medium text-white">
                      {inv.campaign}
                    </td>

                    <td className="py-3 px-4">
                      {currencySymbols[inv.currency] || ""}
                      {inv.amount} {inv.currency}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          statusColors[inv.status] || "bg-gray-600 text-white"
                        }`}
                      >
                        {inv.status}
                      </span>
                      {/* ✅ Show fail reason if invoice failed */}
                      {inv.status === "Failed" && inv.failReason && (
                        <p className="text-xs text-red-400 mt-1">
                          Reason: {inv.failReason}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>

                    {/* ✅ Show agency name + email */}
                    <td className="py-3 px-4 text-sm">
                      <div className="text-white">
                        {inv.uploadedBy?.agencyName || "—"}
                      </div>
                      <div className="text-gray-400">
                        {inv.uploadedBy?.agencyEmail || ""}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <a
                        href={inv.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tax Status */}
        <div className="bg-gray-900 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1">
          <h3 className="text-2xl font-semibold mb-4">Tax Compliance</h3>
          {taxStatus.status === "Approved" ? (
            <p className="text-green-400 font-medium">
              ✅ Approved — {taxStatus.docName}
            </p>
          ) : (
            <>
              <p className="text-red-400 font-medium">❌ {taxStatus.status}</p>
              <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Upload Document
              </button>
            </>
          )}
        </div>

        {/* Activity Timeline */}
        <div className="bg-gray-900 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1">
          <h3 className="text-2xl font-semibold mb-4">Activity Timeline</h3>
          <ul className="space-y-3">
            {activities.map((item, i) => (
              <li key={i} className="text-sm text-gray-300">
                <span className="font-medium text-white">{item.date}</span> —{" "}
                {item.action}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ModelDashboard;
