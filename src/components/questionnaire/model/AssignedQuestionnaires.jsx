import React, { useState, useEffect } from "react";
import {
  assignmentAPI,
  questionnaireUtils,
} from "../../../utils/questionnaireApi";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import Button from "../../ui/Button";
import Badge from "../../ui/Badge";

const AssignedQuestionnaires = ({ onStartQuestionnaire }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // 'all', 'not-started', 'in-progress', 'submitted'

  // Load model assignments on component mount
  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    setLoading(true);
    setError(null);

    const result = await assignmentAPI.getModelAssignments();

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

  // Filter assignments based on status
  const filteredAssignments = assignments.filter((assignment) => {
    switch (filter) {
      case "not-started":
        return assignment.status === "Not started";
      case "in-progress":
        return assignment.status === "In progress";
      case "submitted":
        return assignment.status === "Submitted";
      default:
        return true;
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
        <LoadingSpinner size="lg" text="Loading your questionnaires..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">My Questionnaires</h2>
          <p className="text-gray-400 mt-1">
            Complete your assigned questionnaires
          </p>
        </div>
      </div>

      {/* Error Message */}
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

      {/* Filter Tabs */}
      <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg p-4 border border-gray-600">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          <FilterTab
            label="All"
            count={stats.total}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <FilterTab
            label="Not Started"
            count={stats.notStarted}
            active={filter === "not-started"}
            onClick={() => setFilter("not-started")}
            color="gray"
          />
          <FilterTab
            label="In Progress"
            count={stats.inProgress}
            active={filter === "in-progress"}
            onClick={() => setFilter("in-progress")}
            color="yellow"
          />
          <FilterTab
            label="Submitted"
            count={stats.submitted}
            active={filter === "submitted"}
            onClick={() => setFilter("submitted")}
            color="green"
          />
        </div>
      </div>

      {/* Questionnaires List */}
      {filteredAssignments.length === 0 ? (
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-300">
            {filter === "all"
              ? "No questionnaires assigned"
              : `No ${filter.replace("-", " ")} questionnaires`}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === "all"
              ? "You have no questionnaires assigned at the moment."
              : `You have no questionnaires with ${filter.replace(
                  "-",
                  " ",
                )} status.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((assignment) => (
            <QuestionnaireCard
              key={assignment._id}
              assignment={assignment}
              onStart={() => onStartQuestionnaire(assignment)}
            />
          ))}
        </div>
      )}
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

// Filter Tab Component
const FilterTab = ({ label, count, active, onClick, color = "blue" }) => {
  const colorClasses = {
    blue: active
      ? "bg-blue-600 text-white"
      : "text-blue-400 hover:bg-blue-600 hover:bg-opacity-20",
    gray: active
      ? "bg-gray-600 text-white"
      : "text-gray-400 hover:bg-gray-600 hover:bg-opacity-20",
    yellow: active
      ? "bg-yellow-600 text-white"
      : "text-yellow-400 hover:bg-yellow-600 hover:bg-opacity-20",
    green: active
      ? "bg-green-600 text-white"
      : "text-green-400 hover:bg-green-600 hover:bg-opacity-20",
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 sm:py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] touch-manipulation ${colorClasses[color]}`}
    >
      {label} ({count})
    </button>
  );
};

// Questionnaire Card Component
const QuestionnaireCard = ({ assignment, onStart }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "Not started":
        return "gray";
      case "In progress":
        return "yellow";
      case "Submitted":
        return "green";
      default:
        return "gray";
    }
  };

  const getProgressPercentage = () => {
    // This would be calculated based on answered questions
    // For now, we'll use a simple mapping
    switch (assignment.status) {
      case "Not started":
        return 0;
      case "In progress":
        return 45; // This would come from actual progress data
      case "Submitted":
        return 100;
      default:
        return 0;
    }
  };

  const canStart = assignment.status === "Not started";
  const canContinue = assignment.status === "In progress";
  const isSubmitted = assignment.status === "Submitted";

  return (
    <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg p-6 border border-gray-600 hover:border-gray-500 transition-colors flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-white truncate">
            {assignment.templateTitle}
          </h3>
          {assignment.templateDescription && (
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">
              {assignment.templateDescription}
            </p>
          )}
        </div>
        <div className="ml-3 flex-shrink-0">
          <Badge color={getStatusColor(assignment.status)}>
            {assignment.status}
          </Badge>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">Progress</span>
          <span className="text-gray-300">{getProgressPercentage()}%</span>
        </div>
        <div className="w-full bg-gray-600 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isSubmitted
                ? "bg-green-500"
                : canContinue
                  ? "bg-yellow-500"
                  : "bg-gray-500"
            }`}
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Metadata */}
      <div className="space-y-2 mb-4 flex-grow">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Assigned</span>
          <span className="text-gray-300">{assignment.assignedAt}</span>
        </div>
        {assignment.submittedAt && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Submitted</span>
            <span className="text-gray-300">{assignment.submittedAt}</span>
          </div>
        )}
        {assignment.isOverdue && (
          <div className="flex items-center text-sm text-red-400">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Overdue
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex space-x-2 mt-auto">
        {canStart && (
          <Button
            onClick={onStart}
            className="flex-1 min-h-[44px] touch-manipulation bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
          >
            Start Questionnaire
          </Button>
        )}

        {canContinue && (
          <Button
            onClick={onStart}
            className="flex-1 min-h-[44px] touch-manipulation bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
          >
            Continue Questionnaire
          </Button>
        )}

        {isSubmitted && (
          <Button
            onClick={onStart}
            className="flex-1 min-h-[44px] touch-manipulation bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center border-0"
          >
            View Submission
          </Button>
        )}
      </div>
    </div>
  );
};

export default AssignedQuestionnaires;
