import React, { useState, useEffect } from "react";
import {
  templateAPI,
  questionnaireUtils,
} from "../../../utils/questionnaireApi";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import SuccessNotification from "../shared/SuccessNotification";
import Button from "../../ui/Button";
import Badge from "../../ui/Badge";
import Modal from "../../ui/Modal";

const TemplateList = ({ onEdit, onAssign, onView, onAnalytics }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("list"); // 'grid' or 'list'
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    template: null,
  });
  const [deleting, setDeleting] = useState(false);

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);

    const result = await templateAPI.getTemplates();

    if (result.success) {
      const formattedTemplates = result.data.map(
        questionnaireUtils.formatTemplate,
      );
      setTemplates(formattedTemplates);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleDelete = async (template) => {
    setDeleting(true);

    const result = await templateAPI.deleteTemplate(template._id);

    if (result.success) {
      setTemplates(templates.filter((t) => t._id !== template._id));
      setSuccess(`Template "${template.title}" deleted successfully`);
      setDeleteModal({ open: false, template: null });
    } else {
      setError(result.error);
    }

    setDeleting(false);
  };

  const openDeleteModal = (template) => {
    setDeleteModal({ open: true, template });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ open: false, template: null });
  };

  // Filter templates based on search term
  const filteredTemplates = templates.filter(
    (template) =>
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" text="Loading templates..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header Section */}
      <div className="relative">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 rounded-2xl"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800/30 via-transparent to-gray-900/30 rounded-2xl"></div>

        {/* Content */}
        <div className="relative bg-gradient-to-br from-gray-800/50 via-gray-700/50 to-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-600/30">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            {/* Left Section - Title & Description */}
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                {/* Icon */}
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>

                {/* Title with gradient text */}
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                    Questionnaire Management
                  </h1>
                </div>
              </div>

              {/* Enhanced Description */}
              <div className="space-y-3">
                <p className="text-xl text-gray-300 font-medium leading-relaxed">
                  Create, assign, and analyze questionnaires for your models
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Template Creation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Model Assignment</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Response Analytics</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Action Button */}
            <div className="flex-shrink-0">
              <Button
                onClick={() => onEdit(null)}
                className="w-full lg:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 text-lg font-semibold flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-xl"
              >
                <svg
                  className="w-6 h-6 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Create New Template</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <SuccessNotification
          message={success}
          onDismiss={() => setSuccess(null)}
        />
      )}
      {error && (
        <ErrorMessage
          message={error}
          onRetry={loadTemplates}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Search and View Controls */}
      <div className="bg-gradient-to-br from-gray-800/50 via-gray-700/50 to-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-600/30">
        <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-center justify-between">
          <div className="relative flex-1 max-w-lg">
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-900/70 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 text-base"
            />
          </div>

          <div className="flex items-center justify-center lg:justify-start space-x-3">
            <span className="text-gray-300 text-sm font-medium">View:</span>
            <div className="flex items-center bg-gray-900/70 rounded-lg p-1 border border-gray-600">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center justify-center p-3 rounded-md transition-all duration-200 ${
                  viewMode === "grid"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
                aria-label="Grid view"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center justify-center p-3 rounded-md transition-all duration-200 ${
                  viewMode === "list"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
                aria-label="List view"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Display */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-gradient-to-br from-gray-800/50 via-gray-700/50 to-gray-800/50 backdrop-blur-sm rounded-xl p-12 border border-gray-600/30 max-w-md mx-auto">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 mb-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-white mb-2">
              No templates found
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm
                ? "Try adjusting your search terms."
                : "Get started by creating your first template."}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => onEdit(null)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5 mr-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Create Template</span>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
              : "space-y-6"
          }
        >
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template._id}
              template={template}
              viewMode={viewMode}
              onView={() => onView(template)}
              onEdit={() => onEdit(template)}
              onDelete={() => openDeleteModal(template)}
              onAssign={() => onAssign(template)}
              onAnalytics={() => onAnalytics(template)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal open={deleteModal.open} onClose={closeDeleteModal}>
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-white mb-2">
              Delete Template
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Are you sure you want to delete "{deleteModal.template?.title}"?
              This action cannot be undone.
            </p>
            <div className="flex space-x-3 justify-center">
              <Button
                variant="ghost"
                onClick={closeDeleteModal}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(deleteModal.template)}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <LoadingSpinner size="sm" color="white" className="mr-2" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Template Card Component
const TemplateCard = ({
  template,
  viewMode,
  onView,
  onEdit,
  onDelete,
  onAssign,
  onAnalytics,
}) => {
  if (viewMode === "list") {
    return (
      <div className="bg-gradient-to-br from-gray-800/70 via-gray-700/70 to-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-600/30 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-4 mb-3">
              <h3 className="text-xl font-semibold text-white truncate">
                {template.title}
              </h3>
              <div className="flex space-x-2">
                <Badge color="blue" className="text-xs font-medium">
                  {template.sectionCount} sections
                </Badge>
                <Badge color="purple" className="text-xs font-medium">
                  {template.questionCount} questions
                </Badge>
              </div>
            </div>
            {template.description && (
              <p className="text-gray-300 mb-3 truncate text-base">
                {template.description}
              </p>
            )}
            <p className="text-sm text-gray-400">
              Created {template.createdAt}
            </p>
          </div>
          <div className="flex items-center space-x-2 ml-6">
            <Button
              size="sm"
              variant="ghost"
              onClick={onView}
              className="hover:bg-gray-700 text-gray-300 hover:text-white w-12 h-8 flex items-center justify-center"
              title="View"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 w-12 h-8 flex items-center justify-center"
              title="Edit"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </Button>
            <Button
              size="sm"
              onClick={onAssign}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center px-3 h-8"
            >
              <svg
                className="w-4 h-4 mr-1 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
              <span>Assign</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onAnalytics}
              className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 flex items-center px-3 h-8"
            >
              <svg
                className="w-4 h-4 mr-1 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span>Analytics</span>
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={onDelete}
              className="bg-red-600/80 hover:bg-red-600 w-12 h-8 flex items-center justify-center"
              title="Delete"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-800/70 via-gray-700/70 to-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-600/30 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 group">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-semibold text-white truncate pr-4 group-hover:text-blue-300 transition-colors">
          {template.title}
        </h3>
        <div className="flex space-x-2 flex-shrink-0">
          <Badge color="blue" className="text-xs font-medium">
            {template.sectionCount}
          </Badge>
          <Badge color="purple" className="text-xs font-medium">
            {template.questionCount}
          </Badge>
        </div>
      </div>

      {template.description && (
        <p className="text-gray-300 mb-4 line-clamp-2 text-base leading-relaxed">
          {template.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-400 mb-6">
        <span>Created {template.createdAt}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={onView}
          className="bg-gray-700/50 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600/50 hover:border-gray-500 flex items-center justify-center h-10"
        >
          <svg
            className="w-4 h-4 mr-2 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <span>View</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onEdit}
          className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400 flex items-center justify-center h-10"
        >
          <svg
            className="w-4 h-4 mr-2 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <span>Edit</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          size="sm"
          onClick={onAssign}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium flex items-center justify-center h-10"
        >
          <svg
            className="w-4 h-4 mr-2 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
            />
          </svg>
          <span>Assign</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onAnalytics}
          className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400 flex items-center justify-center h-10"
        >
          <svg
            className="w-4 h-4 mr-2 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <span>Analytics</span>
        </Button>
      </div>

      <div className="mt-3">
        <Button
          size="sm"
          variant="danger"
          onClick={onDelete}
          className="w-full bg-red-600/80 hover:bg-red-600 text-white font-medium flex items-center justify-center h-10"
        >
          <svg
            className="w-4 h-4 mr-2 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          <span>Delete</span>
        </Button>
      </div>
    </div>
  );
};

export default TemplateList;
