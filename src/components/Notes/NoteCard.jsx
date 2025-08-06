import React, { useState, useEffect, useRef } from "react";
import {
  Pin,
  Edit3,
  Trash2,
  Eye,
  Calendar,
  Tag,
  AlertCircle,
  Clock,
  Star,
  MoreVertical,
  User,
  Building2,
  ExternalLink,
} from "lucide-react";

/**
 * Individual note card component with actions and proper styling
 * Matches the project's dark theme and card design patterns
 */
const NoteCard = ({
  note,
  userRole,
  onEdit,
  onDelete,
  onTogglePin,
  onView,
  onUpdatePriority,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const priorityDropdownRef = useRef(null);

  // Close priority dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        priorityDropdownRef.current &&
        !priorityDropdownRef.current.contains(event.target)
      ) {
        setShowPriorityDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "text-red-400 bg-red-900/20 border-red-700";
      case "high":
        return "text-orange-400 bg-orange-900/20 border-orange-700";
      case "medium":
        return "text-yellow-400 bg-yellow-900/20 border-yellow-700";
      case "low":
        return "text-green-400 bg-green-900/20 border-green-700";
      default:
        return "text-gray-400 bg-gray-900/20 border-gray-700";
    }
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      performance: "text-blue-400 bg-blue-900/20 border-blue-700",
      behavior: "text-purple-400 bg-purple-900/20 border-purple-700",
      feedback: "text-green-400 bg-green-900/20 border-green-700",
      reminder: "text-yellow-400 bg-yellow-900/20 border-yellow-700",
      general: "text-gray-400 bg-gray-900/20 border-gray-700",
    };
    return colors[category] || colors.general;
  };

  // Truncate content for preview
  const truncateContent = (content, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  // Check if user can edit/delete
  const canModify = userRole === "agency";

  // Priority options
  const priorityOptions = [
    {
      value: "critical",
      label: "Critical",
      color: "text-red-400 bg-red-900/20 border-red-700",
    },
    {
      value: "high",
      label: "High",
      color: "text-orange-400 bg-orange-900/20 border-orange-700",
    },
    {
      value: "medium",
      label: "Medium",
      color: "text-yellow-400 bg-yellow-900/20 border-yellow-700",
    },
    {
      value: "low",
      label: "Low",
      color: "text-green-400 bg-green-900/20 border-green-700",
    },
  ];

  // Handle priority change
  const handlePriorityChange = async (newPriority) => {
    if (onUpdatePriority && canModify) {
      try {
        await onUpdatePriority(note._id, newPriority);
        setShowPriorityDropdown(false);
      } catch (error) {
        console.error("Failed to update priority:", error);
      }
    }
  };

  return (
    <div className="relative group">
      <div
        className={`rounded-xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 shadow-lg hover:shadow-xl transition-all duration-200 ${
          note.isPinned ? "ring-2 ring-blue-500/50" : ""
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {note.isPinned && (
                  <Pin className="h-4 w-4 text-blue-400 fill-current" />
                )}
                <h3 className="text-lg font-semibold text-white truncate">
                  {note.title}
                </h3>
              </div>

              {/* Priority and Category Badges */}
              <div className="flex items-center gap-2 mb-2">
                {/* Priority Badge - Clickable if user can modify */}
                <div className="relative" ref={priorityDropdownRef}>
                  {canModify ? (
                    <button
                      onClick={() =>
                        setShowPriorityDropdown(!showPriorityDropdown)
                      }
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border transition-all duration-200 hover:scale-105 cursor-pointer ${getPriorityColor(
                        note.priority,
                      )}`}
                      title="Click to change priority"
                    >
                      {note.priority}
                    </button>
                  ) : (
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                        note.priority,
                      )}`}
                    >
                      {note.priority}
                    </span>
                  )}

                  {/* Priority Dropdown */}
                  {showPriorityDropdown && canModify && (
                    <div className="absolute top-full left-0 mt-1 z-20 w-32 bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1">
                      {priorityOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handlePriorityChange(option.value)}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-700 transition-colors flex items-center ${
                            note.priority === option.value ? "bg-gray-700" : ""
                          }`}
                        >
                          <span
                            className={`inline-block w-2 h-2 rounded-full mr-2 ${
                              option.color.split(" ")[0]
                            } ${option.color.split(" ")[1]}`}
                          ></span>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(
                    note.category,
                  )}`}
                >
                  {note.category}
                </span>
              </div>
            </div>

            {/* Actions Menu */}
            {canModify && (
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {showActions && (
                  <div className="absolute right-0 top-8 z-10 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1">
                    <button
                      onClick={() => {
                        onView?.(note);
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Details
                    </button>

                    <button
                      onClick={() => {
                        onTogglePin(note._id);
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Pin className="h-4 w-4" />
                      {note.isPinned ? "Unpin" : "Pin"} Note
                    </button>

                    <button
                      onClick={() => {
                        onEdit(note);
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit Note
                    </button>

                    <button
                      onClick={() => {
                        onDelete(note._id);
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Note
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="text-gray-300 text-sm leading-relaxed mb-4">
            {note.contentType === "markdown" ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: truncateContent(note.content),
                }}
              />
            ) : (
              <p>{truncateContent(note.content)}</p>
            )}
          </div>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {note.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
              {note.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded-full">
                  +{note.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Visibility Indicator */}
          <div className="flex items-center gap-2 mb-3">
            <Eye className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-500 capitalize">
              {note.visibility.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-700 bg-gray-800/50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              {/* Created By */}
              <div className="flex items-center gap-1">
                {note.createdBy?.userType === "Agency" ? (
                  <Building2 className="h-3 w-3" />
                ) : (
                  <User className="h-3 w-3" />
                )}
                <span>
                  {note.createdBy?.userType === "Agency"
                    ? note.agencyId?.agencyName || "Agency"
                    : note.modelId?.fullName || "Model"}
                </span>
              </div>

              {/* Version */}
              <span>v{note.version}</span>
            </div>

            {/* Timestamps */}
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDate(note.createdAt)}</span>
            </div>
          </div>

          {/* Last Modified */}
          {note.lastModified && note.lastModified !== note.createdAt && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
              <span>Modified: {formatDate(note.lastModified)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close actions */}
      {showActions && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  );
};

export default NoteCard;
