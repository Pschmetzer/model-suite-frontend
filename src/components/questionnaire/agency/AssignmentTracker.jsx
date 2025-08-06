import React, { useState, useEffect } from "react";
import {
  assignmentAPI,
  questionnaireUtils,
} from "../../../utils/questionnaireApi";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import SuccessNotification from "../shared/SuccessNotification";
import Button from "../../ui/Button";
import Badge from "../../ui/Badge";
import Modal from "../../ui/Modal";

const AssignmentTracker = ({ onViewResponses, onReassign }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("assignedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    assignment: null,
  });
  const [deleting, setDeleting] = useState(false);

  // Load assignments on component mount
  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    setLoading(true);
    setError(null);

    const result = await assignmentAPI.getAssignments();

    if (result.success) {
      const formattedAssignments = result.data.map(
        questionnaireUtils.formatAssignment,
      );
      setAssignments(formattedAssignments);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleStatusUpdate = async (assignmentId, newStatus) => {
    const result = await assignmentAPI.updateAssignmentStatus(
      assignmentId,
      newStatus,
    );

    if (result.success) {
      setAssignments((prev) =>
        prev.map((assignment) =>
          assignment._id === assignmentId
            ? { ...assignment, status: newStatus }
            : assignment,
        ),
      );
      setSuccess(`Assignment status updated to ${newStatus}`);
    } else {
      setError(result.error);
    }
  };

  const handleDeleteAssignment = async (assignment) => {
    setDeleting(true);

    const result = await assignmentAPI.deleteAssignment(assignment._id);

    if (result.success) {
      setAssignments((prev) => prev.filter((a) => a._id !== assignment._id));
      setSuccess(`Assignment for ${assignment.modelName} deleted successfully`);
      setDeleteModal({ open: false, assignment: null });
    } else {
      setError(result.error);
    }

    setDeleting(false);
  };

  const openDeleteModal = (assignment) => {
    setDeleteModal({ open: true, assignment });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ open: false, assignment: null });
  };

  // Get unique templates for filter
  const uniqueTemplates = [
    ...new Set(assignments.map((a) => a.templateTitle)),
  ].filter(Boolean);

  // Filter and sort assignments
  const filteredAndSortedAssignments = assignments
    .filter((assignment) => {
      const matchesSearch =
        assignment.modelName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        assignment.templateTitle
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        assignment.modelEmail?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || assignment.status === statusFilter;
      const matchesTemplate =
        templateFilter === "all" || assignment.templateTitle === templateFilter;

      return matchesSearch && matchesStatus && matchesTemplate;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle date sorting
      if (sortBy === "assignedAt" || sortBy === "submittedAt") {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Get assignment statistics
  const stats = {
    total: assignments.length,
    notStarted: assignments.filter((a) => a.status === "Not started").length,
    inProgress: assignments.filter((a) => a.status === "In progress").length,
    submitted: assignments.filter((a) => a.status === "Submitted").length,
    overdue: assignments.filter((a) => a.isOverdue).length,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" text="Loading assignments..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Assignment Tracker</h2>
          <p className="text-gray-400 mt-1">
            Monitor questionnaire assignments and their progress
          </p>
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
          onRetry={loadAssignments}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Total" value={stats.total} color="blue" />
        <StatCard title="Not Started" value={stats.notStarted} color="gray" />
        <StatCard title="In Progress" value={stats.inProgress} color="yellow" />
        <StatCard title="Submitted" value={stats.submitted} color="green" />
        <StatCard title="Overdue" value={stats.overdue} color="red" />
      </div>

      {/* Filters and Search */}
      <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg p-4 border border-gray-600">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="Not started">Not Started</option>
            <option value="In progress">In Progress</option>
            <option value="Submitted">Submitted</option>
          </select>

          {/* Template Filter */}
          <select
            value={templateFilter}
            onChange={(e) => setTemplateFilter(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Templates</option>
            {uniqueTemplates.map((template) => (
              <option key={template} value={template}>
                {template}
              </option>
            ))}
          </select>

          {/* Sort Options */}
          <div className="flex space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="assignedAt">Assigned Date</option>
              <option value="submittedAt">Submitted Date</option>
              <option value="modelName">Model Name</option>
              <option value="templateTitle">Template</option>
              <option value="status">Status</option>
            </select>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              <svg
                className={`w-4 h-4 transform ${
                  sortOrder === "desc" ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 11l5-5m0 0l5 5m-5-5v12"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      {filteredAndSortedAssignments.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-300">
            No assignments found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== "all" || templateFilter !== "all"
              ? "Try adjusting your filters."
              : "Create your first assignment to get started."}
          </p>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg border border-gray-600 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-600">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Template
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Assigned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {filteredAndSortedAssignments.map((assignment) => (
                  <AssignmentRow
                    key={assignment._id}
                    assignment={assignment}
                    onStatusUpdate={handleStatusUpdate}
                    onViewResponses={onViewResponses}
                    onReassign={onReassign}
                    onDelete={() => openDeleteModal(assignment)}
                  />
                ))}
              </tbody>
            </table>
          </div>
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
              Delete Assignment
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Are you sure you want to delete the assignment for "
              {deleteModal.assignment?.modelName}"? This action cannot be
              undone.
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
                onClick={() => handleDeleteAssignment(deleteModal.assignment)}
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

// Statistics Card Component
const StatCard = ({ title, value, color }) => {
  const colorClasses = {
    blue: "text-blue-400",
    gray: "text-gray-400",
    yellow: "text-yellow-400",
    green: "text-green-400",
    red: "text-red-400",
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg p-4 border border-gray-600">
      <div className="text-center">
        <div className={`text-2xl font-bold ${colorClasses[color]}`}>
          {value}
        </div>
        <div className="text-sm text-gray-400">{title}</div>
      </div>
    </div>
  );
};

// Assignment Row Component
const AssignmentRow = ({
  assignment,
  onStatusUpdate,
  onViewResponses,
  onReassign,
  onDelete,
}) => {
  const canViewResponses = assignment.status === "Submitted";

  return (
    <tr className="hover:bg-gray-600 hover:bg-opacity-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div>
            <div className="text-sm font-medium text-white">
              {assignment.modelName || "Unknown Model"}
            </div>
            <div className="text-sm text-gray-400">{assignment.modelEmail}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-white">{assignment.templateTitle}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <select
            value={assignment.status}
            onChange={(e) => onStatusUpdate(assignment._id, e.target.value)}
            className="text-xs px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="Not started">Not started</option>
            <option value="In progress">In progress</option>
            <option value="Submitted">Submitted</option>
          </select>
          {assignment.isOverdue && (
            <Badge color="red" className="text-xs">
              Overdue
            </Badge>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
        {assignment.assignedAt}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
        {assignment.submittedAt || "-"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          {canViewResponses && onViewResponses && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onViewResponses(assignment)}
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
          )}
          {onReassign && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReassign(assignment)}
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </Button>
          )}
          <Button size="sm" variant="danger" onClick={onDelete}>
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
      </td>
    </tr>
  );
};

export default AssignmentTracker;
