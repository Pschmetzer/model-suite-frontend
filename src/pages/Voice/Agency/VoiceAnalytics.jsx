import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Users,
  FileAudio,
  Clock,
  Download,
  Calendar,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { voiceAPI } from "../../../services/voiceAPI";

const VoiceAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const response = await voiceAPI.getStats({ days: dateRange });
      setAnalytics(response.data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      toast.error("Failed to fetch analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const exportReport = async () => {
    try {
      await voiceAPI.exportData("analytics", { days: dateRange });
      toast.success("Report exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export report");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No analytics data available</p>
        <p className="text-sm text-gray-400 mt-2">
          Analytics feature is under development. Please check back later.
        </p>
      </div>
    );
  }

  // Handle case where analytics might not have the expected structure
  const safeAnalytics = {
    overview: analytics.overview || {
      totalScripts: analytics.scripts || 0,
      activeModels: 0,
      completedRecordings: analytics.recordings || 0,
      avgTurnaroundHours: 0,
      scriptsChange: 0,
      modelsChange: 0,
      recordingsChange: 0,
      turnaroundChange: 0,
    },
    trends: analytics.trends || { daily: [] },
    statusDistribution: analytics.statusDistribution || [],
    modelPerformance: analytics.modelPerformance || [],
    quality: analytics.quality || {
      firstTimeApprovalRate: 0,
      avgReviewTimeHours: 0,
      revisionRequestRate: 0,
      rejectionRate: 0,
    },
    recentActivity: analytics.recentActivity || [],
  };

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                📊 Voice Analytics Dashboard
              </h1>
              <p className="text-gray-300 text-lg">
                Track performance and progress metrics for voice recordings
              </p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                <span>
                  🎯 {safeAnalytics.overview.totalRecordings} total recordings
                </span>
                <span>
                  ✅ {safeAnalytics.overview.approvedRecordings} approved
                </span>
                <span>
                  ⏳ {safeAnalytics.overview.pendingReviews} pending review
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
              <button
                onClick={fetchAnalytics}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <button
                onClick={exportReport}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total Assignments"
            value={safeAnalytics.overview.totalAssignments}
            icon={<FileAudio className="w-6 h-6" />}
            color="bg-blue-500"
            change={safeAnalytics.overview.assignmentsChange}
          />
          <KPICard
            title="Total Recordings"
            value={safeAnalytics.overview.totalRecordings}
            icon={<Users className="w-6 h-6" />}
            color="bg-green-500"
            change={safeAnalytics.overview.recordingsChange}
          />
          <KPICard
            title="Approved Recordings"
            value={safeAnalytics.overview.approvedRecordings}
            icon={<TrendingUp className="w-6 h-6" />}
            color="bg-purple-500"
            change={safeAnalytics.overview.approvedChange}
          />
          <KPICard
            title="Pending Reviews"
            value={safeAnalytics.overview.pendingReviews}
            icon={<Clock className="w-6 h-6" />}
            color="bg-orange-500"
            change={safeAnalytics.overview.pendingChange}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Completion Trends */}
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Completion Trends
            </h3>
            {safeAnalytics.trends.daily.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={safeAnalytics.trends.daily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#3B82F6"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="submitted"
                    stroke="#10B981"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-400">
                <p>No trend data available</p>
              </div>
            )}
          </div>

          {/* Status Distribution */}
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Recording Status Distribution
            </h3>
            {safeAnalytics.statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={safeAnalytics.statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {safeAnalytics.statusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-400">
                <p>No status distribution data available</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Model Performance */}
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Top Performing Models
            </h3>
            {safeAnalytics.modelPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={safeAnalytics.modelPerformance.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="username"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completedRecordings" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-400">
                <p>No model performance data available</p>
              </div>
            )}
          </div>

          {/* Quality Metrics */}
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Quality Metrics
            </h3>
            <div className="space-y-4">
              <QualityMetric
                label="First-time Approval Rate"
                value={safeAnalytics.quality.firstTimeApprovalRate}
                target={85}
              />
              <QualityMetric
                label="Average Review Time"
                value={`${safeAnalytics.quality.avgReviewTimeHours}h`}
                isTime
              />
              <QualityMetric
                label="Revision Request Rate"
                value={safeAnalytics.quality.revisionRequestRate}
                target={15}
                inverse
              />
              <QualityMetric
                label="Rejection Rate"
                value={safeAnalytics.quality.rejectionRate}
                target={5}
                inverse
              />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          {safeAnalytics.recentActivity.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Script
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Model
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Submitted
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {safeAnalytics.recentActivity.map((activity, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {activity.scriptTitle}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {activity.modelUsername}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            activity.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : activity.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : activity.status === "pending"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {activity.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(activity.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {Math.floor(activity.duration / 60)}:
                        {(activity.duration % 60).toString().padStart(2, "0")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No recent activity available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon, color, change }) => {
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {change !== undefined && (
            <p
              className={`text-sm mt-1 ${
                isPositive
                  ? "text-green-400"
                  : isNegative
                    ? "text-red-400"
                    : "text-gray-400"
              }`}
            >
              {isPositive && "+"}
              {change}% from last period
            </p>
          )}
        </div>
        <div className={`${color} text-white p-3 rounded-lg`}>{icon}</div>
      </div>
    </div>
  );
};

const QualityMetric = ({
  label,
  value,
  target,
  inverse = false,
  isTime = false,
}) => {
  const numericValue = isTime
    ? parseFloat(value)
    : parseFloat(value.toString().replace("%", ""));
  const percentage = target ? (numericValue / target) * 100 : 100;
  const isGood = inverse ? percentage <= 100 : percentage >= 100;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <span
          className={`text-sm font-semibold ${
            isGood ? "text-green-400" : "text-red-400"
          }`}
        >
          {isTime ? value : `${value}%`}
        </span>
      </div>
      {target && (
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isGood ? "bg-green-500" : "bg-red-500"
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
      {target && (
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0{isTime ? "h" : "%"}</span>
          <span>
            Target: {target}
            {isTime ? "h" : "%"}
          </span>
        </div>
      )}
    </div>
  );
};

export default VoiceAnalytics;
