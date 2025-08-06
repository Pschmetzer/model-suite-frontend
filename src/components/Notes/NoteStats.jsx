import React from "react";
import {
  FileText,
  Pin,
  Flag,
  Folder,
  TrendingUp,
  Calendar,
  Eye,
  AlertCircle,
} from "lucide-react";

/**
 * Note statistics component
 * Displays overview statistics for notes
 */
const NoteStats = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="bg-gray-800 border border-gray-700 rounded-xl p-4"
          >
            <div className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: "Total Notes",
      value: stats.totalNotes || 0,
      icon: FileText,
      color: "text-blue-400",
      bgColor: "bg-blue-900/20",
      borderColor: "border-blue-700",
    },
    {
      title: "Pinned Notes",
      value: stats.pinnedNotes || 0,
      icon: Pin,
      color: "text-yellow-400",
      bgColor: "bg-yellow-900/20",
      borderColor: "border-yellow-700",
    },
    {
      title: "High Priority",
      value: stats.highPriorityNotes || 0,
      icon: Flag,
      color: "text-red-400",
      bgColor: "bg-red-900/20",
      borderColor: "border-red-700",
    },
    {
      title: "Categories",
      value: stats.categoriesCount || 0,
      icon: Folder,
      color: "text-green-400",
      bgColor: "bg-green-900/20",
      borderColor: "border-green-700",
    },
  ];

  return (
    <div className="mb-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className={`bg-gray-800 border rounded-xl p-4 hover:shadow-lg transition-all duration-200 ${stat.borderColor}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <IconComponent className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Stats */}
      {stats.categoryBreakdown &&
        Object.keys(stats.categoryBreakdown).length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Folder className="h-5 w-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">
                Category Breakdown
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.categoryBreakdown).map(
                ([category, count]) => (
                  <div key={category} className="text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                      {count}
                    </div>
                    <div className="text-sm text-gray-400 capitalize">
                      {category}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        )}

      {/* Priority Breakdown */}
      {stats.priorityBreakdown &&
        Object.keys(stats.priorityBreakdown).length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Flag className="h-5 w-5 text-red-400" />
              <h3 className="text-lg font-semibold text-white">
                Priority Breakdown
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.priorityBreakdown).map(
                ([priority, count]) => {
                  const priorityColors = {
                    critical: "text-red-400",
                    high: "text-orange-400",
                    medium: "text-yellow-400",
                    low: "text-green-400",
                  };

                  return (
                    <div key={priority} className="text-center">
                      <div className="text-2xl font-bold text-white mb-1">
                        {count}
                      </div>
                      <div
                        className={`text-sm capitalize ${priorityColors[priority] || "text-gray-400"}`}
                      >
                        {priority}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        )}

      {/* Recent Activity */}
      {stats.recentActivity && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">
              Recent Activity
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {stats.recentActivity.notesCreatedToday || 0}
              </div>
              <div className="text-sm text-gray-400">Created Today</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {stats.recentActivity.notesUpdatedToday || 0}
              </div>
              <div className="text-sm text-gray-400">Updated Today</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {stats.recentActivity.notesCreatedThisWeek || 0}
              </div>
              <div className="text-sm text-gray-400">Created This Week</div>
            </div>
          </div>
        </div>
      )}

      {/* Visibility Stats */}
      {stats.visibilityBreakdown &&
        Object.keys(stats.visibilityBreakdown).length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">
                Visibility Breakdown
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(stats.visibilityBreakdown).map(
                ([visibility, count]) => {
                  const visibilityLabels = {
                    internal: "Internal Only",
                    shared_with_model: "Shared with Model",
                    neutral: "Neutral",
                  };

                  return (
                    <div key={visibility} className="text-center">
                      <div className="text-2xl font-bold text-white mb-1">
                        {count}
                      </div>
                      <div className="text-sm text-gray-400">
                        {visibilityLabels[visibility] || visibility}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        )}

      {/* No Data Message */}
      {stats.totalNotes === 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
          <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No Notes Yet
          </h3>
          <p className="text-gray-400">
            Start creating notes to see statistics and insights here.
          </p>
        </div>
      )}
    </div>
  );
};

export default NoteStats;
