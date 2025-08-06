import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "react-hot-toast";
import { getDataAPI } from "../../utils/fetchData";
import { motion } from "framer-motion";

const exportInvoicesAction = async () => {
  try {
    const res = await getDataAPI("/billing/invoices/export");
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

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invoiceStats, setInvoiceStats] = useState({
    outstanding: 0,
    earnings: 0,
    paid: 0,
    pending: 0,
    weekly: [],
  });

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await getDataAPI("/billing/dashboard");
        setSummary(res.data);

        const invoices = res.data.invoices || [];
        const rate = res.data.conversionRate || 1;
        const paid = invoices.filter((inv) => inv.status === "Paid");
        const unpaid = invoices.filter((inv) => inv.status !== "Paid");
        const totalUSD = paid.reduce(
          (sum, inv) => sum + (inv.amountInUSD || inv.amount * rate),
          0,
        );

        const recentTransactions = invoices.slice(0, 5).map((inv) => ({
          id: inv._id,
          amount: inv.amountInUSD || inv.amount * rate,
          status: inv.status,
          statusColor:
            inv.status === "Paid" ? "text-green-400" : "text-yellow-400",
          date: new Date(inv.createdAt).toLocaleDateString(),
        }));

        const latestActivities = invoices.slice(0, 5).map((inv) => {
          return `${inv.client?.fullName || "Unknown client"} • ${inv.status} • ${new Date(inv.updatedAt).toLocaleString()}`;
        });

        // ✅ Weekly Summary in USD
        const weeklyMap = {};
        invoices.forEach((inv) => {
          const date = new Date(inv.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          });

          if (!weeklyMap[date]) {
            weeklyMap[date] = {
              date,
              amount: 0,
              transactions: 0,
            };
          }

          const amountUSD = inv.amountInUSD || inv.amount * rate;
          weeklyMap[date].amount += amountUSD;
          weeklyMap[date].transactions += 1;
        });

        const weeklyChartData = Object.values(weeklyMap);

        setInvoiceStats({
          outstanding: unpaid.reduce(
            (sum, inv) => sum + (inv.amountInUSD || inv.amount * rate),
            0,
          ),
          earnings: totalUSD,
          paid: paid.length,
          pending: unpaid.length,
          weekly: weeklyChartData,
        });

        setSummary((prev) => ({
          ...prev,
          recentTransactions,
          latestActivities,
        }));
      } catch (error) {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const convert = (value) => `$${value.toFixed(2)}`;

  if (loading)
    return <div className="text-center dark:text-white mt-20">Loading...</div>;

  return (
    <div className="min-h-screen dark:bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-10 text-gray-200 font-sans">
      <header className="text-center mb-16">
        <motion.h1
          className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          🌍 Executive Dashboard
        </motion.h1>
        <p className="text-gray-400 mt-4 text-lg">
          Monitor your performance in real time with precision
        </p>
        <motion.button
          onClick={exportInvoicesAction}
          className="mt-6 px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl shadow transition-all duration-300 hover:scale-105"
          whileTap={{ scale: 0.95 }}
        >
          ⬇️ Export Invoices as CSV
        </motion.button>
      </header>

      {/* ✅ Stat Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 mb-16">
        {[
          {
            title: "Outstanding",
            value: invoiceStats?.outstanding,
            color: "text-red-400",
            icon: "📤",
          },
          {
            title: "Earnings (USD)",
            value: invoiceStats?.earnings.toFixed(2),
            color: "text-green-400",
            icon: "💰",
          },
          {
            title: "Paid Invoices",
            value: invoiceStats?.paid,
            color: "text-blue-400",
            icon: "✅",
          },
          {
            title: "Pending Invoices",
            value: invoiceStats?.pending,
            color: "text-yellow-400",
            icon: "⏳",
          },
        ].map(({ title, value, color, icon }, i) => (
          <motion.div
            key={i}
            className="dark:bg-[#1e293b] p-6 rounded-3xl shadow-xl border border-gray-700 hover:shadow-2xl transition-all duration-300 flex items-center gap-5"
            whileHover={{ y: -4 }}
          >
            <div className="text-5xl">{icon}</div>
            <div>
              <h2 className="text-sm uppercase tracking-wider text-gray-400 font-medium">
                {title}
              </h2>
              <p className={`text-3xl font-extrabold ${color}`}>
                {title.includes("Earnings") || title === "Outstanding"
                  ? `$${parseFloat(value).toFixed(2)}`
                  : value}
              </p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* ✅ Weekly Chart Summary */}
      <motion.div
        className="dark:bg-[#1e293b] p-8 rounded-3xl shadow-xl border border-gray-700 mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-2xl font-bold dark:text-gray-100 text-black mb-6">
          📅 Weekly Summary Chart
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={invoiceStats.weekly}>
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis
              stroke="#94a3b8"
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip
              formatter={(value) => `${value.toFixed(2)}`}
              contentStyle={{
                backgroundColor: "#1e293b",
                borderColor: "#334155",
                color: "#fff",
              }}
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#34d399"
              strokeWidth={3}
              name="Total Amount"
            />
            <Line
              type="monotone"
              dataKey="transactions"
              stroke="#60a5fa"
              strokeWidth={3}
              name="Transaction Count"
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* ✅ Activities & Transactions */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <motion.div
          className="dark:bg-[#1e293b] p-8 rounded-3xl shadow-xl border border-gray-700 xl:col-span-2"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-2xl font-bold dark:text-gray-100 text-black mb-6">
            📝 Latest Activities
          </h3>
          <ul className="space-y-4">
            {(summary?.latestActivities || []).map((activity, i) => (
              <li
                key={i}
                className="p-4 dark:bg-[#334155] border border-gray-600 rounded-xl hover:bg-[#475569] transition-all text-gray-200"
              >
                {activity}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          className="dark:bg-[#1e293b] p-8 rounded-3xl shadow-xl border border-gray-700"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h3 className="text-2xl font-bold dark:text-gray-100 text-black mb-6">
            📄 Recent Transactions
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="dark:text-gray-400 border-b border-gray-600">
                <tr>
                  <th className="pb-2 dark:text-gray-200 text-black">
                    Invoice ID
                  </th>
                  <th className="pb-2 dark:text-gray-200 text-black">Amount</th>
                  <th className="pb-2 dark:text-gray-200 text-black">Status</th>
                  <th className="pb-2 dark:text-gray-200 text-black">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {(summary?.recentTransactions || []).map(
                  ({ id, amount, status, statusColor, date }, i) => (
                    <tr key={i} className="hover:bg-[#334155]">
                      <td className="py-3 font-medium dark:text-gray-200">
                        {id}
                      </td>
                      <td className="py-3 dark:text-gray-200">
                        {convert(amount)}
                      </td>
                      <td className={`py-3 font-semibold ${statusColor}`}>
                        {status}
                      </td>
                      <td className="py-3 dark:text-gray-400">{date}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Dashboard;
