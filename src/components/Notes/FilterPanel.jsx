import React from "react";
import {
  X,
  Filter,
  Folder,
  Flag,
  Eye,
  Pin,
  Tag,
  RotateCcw,
} from "lucide-react";

/**
 * Filter panel component for notes
 * Provides filtering options for category, priority, status, tags, and pin status
 */
const FilterPanel = ({ filters, onFilterChange, onClose }) => {
  // Predefined filter options
  const categories = [
    { value: "", label: "All Categories" },
    { value: "general", label: "General" },
    { value: "performance", label: "Performance" },
    { value: "behavior", label: "Behavior" },
    { value: "feedback", label: "Feedback" },
    { value: "reminder", label: "Reminder" },
    { value: "meeting", label: "Meeting" },
    { value: "contract", label: "Contract" },
    { value: "payment", label: "Payment" },
  ];

  const priorities = [
    { value: "", label: "All Priorities" },
    { value: "low", label: "Low", color: "text-green-400" },
    { value: "medium", label: "Medium", color: "text-yellow-400" },
    { value: "high", label: "High", color: "text-orange-400" },
    { value: "critical", label: "Critical", color: "text-red-400" },
  ];

  const statusOptions = [
    { value: "active", label: "Active Notes" },
    { value: "archived", label: "Archived Notes" },
    { value: "all", label: "All Notes" },
  ];

  const pinOptions = [
    { value: null, label: "All Notes" },
    { value: true, label: "Pinned Only" },
    { value: false, label: "Unpinned Only" },
  ];

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    onFilterChange(newFilters);
  };

  // Reset all filters
  const resetFilters = () => {
    const resetFilters = {
      category: "",
      priority: "",
      status: "active",
      tags: [],
      isPinned: null,
    };
    onFilterChange(resetFilters);
  };

  // Handle tag input
  const handleTagsChange = (e) => {
    const tags = e.target.value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    handleFilterChange("tags", tags);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-end bg-gray-900 bg-opacity-50 backdrop-blur-sm">
      <div className="w-full max-w-sm h-full bg-gray-800 border-l border-gray-700 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Filter Notes</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Options */}
        <div className="p-6 space-y-6">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              <Folder className="inline h-4 w-4 mr-2" />
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              <Flag className="inline h-4 w-4 mr-2" />
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange("priority", e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {priorities.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              <Eye className="inline h-4 w-4 mr-2" />
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Pin Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              <Pin className="inline h-4 w-4 mr-2" />
              Pin Status
            </label>
            <select
              value={
                filters.isPinned === null ? "null" : filters.isPinned.toString()
              }
              onChange={(e) => {
                const value =
                  e.target.value === "null" ? null : e.target.value === "true";
                handleFilterChange("isPinned", value);
              }}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {pinOptions.map((option, index) => (
                <option
                  key={index}
                  value={
                    option.value === null ? "null" : option.value.toString()
                  }
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tags Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              <Tag className="inline h-4 w-4 mr-2" />
              Tags
            </label>
            <input
              type="text"
              value={filters.tags.join(", ")}
              onChange={handleTagsChange}
              placeholder="Enter tags separated by commas..."
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-2 text-xs text-gray-500">
              Separate multiple tags with commas
            </p>
          </div>

          {/* Active Filters Summary */}
          {(filters.category ||
            filters.priority ||
            filters.status !== "active" ||
            filters.isPinned !== null ||
            filters.tags.length > 0) && (
            <div className="p-4 bg-gray-900 border border-gray-600 rounded-lg">
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                Active Filters:
              </h4>
              <div className="space-y-1 text-xs text-gray-400">
                {filters.category && (
                  <div>
                    Category:{" "}
                    <span className="text-blue-400">{filters.category}</span>
                  </div>
                )}
                {filters.priority && (
                  <div>
                    Priority:{" "}
                    <span className="text-blue-400">{filters.priority}</span>
                  </div>
                )}
                {filters.status !== "active" && (
                  <div>
                    Status:{" "}
                    <span className="text-blue-400">{filters.status}</span>
                  </div>
                )}
                {filters.isPinned !== null && (
                  <div>
                    Pinned:{" "}
                    <span className="text-blue-400">
                      {filters.isPinned ? "Yes" : "No"}
                    </span>
                  </div>
                )}
                {filters.tags.length > 0 && (
                  <div>
                    Tags:{" "}
                    <span className="text-blue-400">
                      {filters.tags.join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reset Button */}
          <button
            onClick={resetFilters}
            className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset All Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
