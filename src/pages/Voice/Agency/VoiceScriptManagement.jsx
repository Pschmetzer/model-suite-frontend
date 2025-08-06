import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  Upload,
  Calendar,
  Tag,
  Grid3X3,
  List,
  CheckCircle,
  CheckSquare,
  Square,
  Trash2,
  Users,
  AlertCircle,
  RefreshCw,
  Loader2,
  WifiOff,
  Clock,
  BarChart3,
  Download,
  MessageSquare,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { voiceAPI } from "../../../services/voiceAPI";
import { clearSelection } from "../../../globalstate/questionsUiSlice";
import QuestionSelector from "../../../components/voice/QuestionSelector";
import VoiceErrorBoundary, {
  LoadingSpinner,
  ErrorAlert,
  SuccessAlert,
  useAsyncOperation,
} from "../../../components/voice/VoiceErrorBoundary";

// Import the other voice components
import VoiceReviewCenter from "./VoiceReviewCenter";
import VoiceAnalytics from "./VoiceAnalytics";
import VoiceExportHub from "./VoiceExportHub";

// Enhanced error types for better error handling
const ERROR_TYPES = {
  NETWORK: "network",
  VALIDATION: "validation",
  PERMISSION: "permission",
  SERVER: "server",
  UNKNOWN: "unknown",
};

// Utility function to categorize errors
const categorizeError = (error) => {
  if (!error) return ERROR_TYPES.UNKNOWN;

  const message = error.message?.toLowerCase() || "";
  const status = error.response?.status;

  if (
    message.includes("network") ||
    message.includes("fetch") ||
    !navigator.onLine
  ) {
    return ERROR_TYPES.NETWORK;
  }
  if (status === 401 || status === 403) {
    return ERROR_TYPES.PERMISSION;
  }
  if (status >= 400 && status < 500) {
    return ERROR_TYPES.VALIDATION;
  }
  if (status >= 500) {
    return ERROR_TYPES.SERVER;
  }

  return ERROR_TYPES.UNKNOWN;
};

const VoiceScriptManagement = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState("scripts");

  // Existing state
  const dispatch = useDispatch();
  const { selectedIds } = useSelector((state) => state.questionsUi);

  // Core data state
  const [scripts, setScripts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem("voiceScriptViewMode") || "grid";
  });

  // Modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showQuestionAssignModal, setShowQuestionAssignModal] = useState(false);
  const [selectedScript, setSelectedScript] = useState(null);

  // Loading and error state with enhanced tracking
  const [loading, setLoading] = useState({
    scripts: false,
    assignments: false,
    models: false,
    refreshing: false,
    deleting: null,
    assigning: null,
  });

  const [error, setError] = useState({
    scripts: null,
    assignments: null,
    models: null,
    type: null,
    retryCount: 0,
    lastRetryAt: null,
  });

  // Network status tracking
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncAt, setLastSyncAt] = useState(null);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (error.scripts || error.assignments || error.models) {
        handleRetry();
      }
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [error.scripts, error.assignments, error.models, error.type]);

  // Initial data loading with error recovery
  useEffect(() => {
    if (activeTab === "scripts") {
      // Now this tab shows assignments, not scripts
      fetchAssignments();
    } else if (activeTab === "assignments") {
      fetchAssignments();
    }
  }, [activeTab]);

  const fetchScripts = useCallback(
    async (showRefreshIndicator = false, retryAttempt = 0) => {
      if (!isOnline && retryAttempt === 0) {
        setError((prev) => ({
          ...prev,
          scripts: "No internet connection",
          type: ERROR_TYPES.NETWORK,
        }));
        return;
      }

      setLoading((prev) => ({
        ...prev,
        scripts: true,
        refreshing: showRefreshIndicator,
      }));
      setError((prev) => ({ ...prev, scripts: null }));

      try {
        const response = await voiceAPI.getScripts();
        setScripts(response.data.data?.scripts || []);
        setLastSyncAt(new Date());
        setError((prev) => ({ ...prev, retryCount: 0 }));
      } catch (err) {
        console.error("Error fetching scripts:", err);
        const errorType = categorizeError(err);
        const errorMessage = err.message || "Failed to fetch scripts";

        setError((prev) => ({
          ...prev,
          scripts: errorMessage,
          type: errorType,
          retryCount: retryAttempt + 1,
          lastRetryAt: new Date(),
        }));

        if (retryAttempt < 2 && errorType === ERROR_TYPES.NETWORK) {
          const retryDelay = Math.min(1000 * Math.pow(2, retryAttempt), 5000);
          setTimeout(() => {
            if (isOnline) {
              fetchScripts(showRefreshIndicator, retryAttempt + 1);
            }
          }, retryDelay);
        }
      } finally {
        setLoading((prev) => ({
          ...prev,
          scripts: false,
          refreshing: false,
        }));
      }
    },
    [isOnline],
  );

  const fetchAssignments = useCallback(
    async (showRefreshIndicator = false, retryAttempt = 0) => {
      if (!isOnline && retryAttempt === 0) {
        setError((prev) => ({
          ...prev,
          assignments: "No internet connection",
          type: ERROR_TYPES.NETWORK,
        }));
        return;
      }

      setLoading((prev) => ({
        ...prev,
        assignments: true,
        refreshing: showRefreshIndicator,
      }));
      setError((prev) => ({ ...prev, assignments: null }));

      try {
        const response = await voiceAPI.getAgencyAssignments();
        console.log("🔍 API Response:", response);
        console.log("🔍 Response Data:", response.data);
        console.log("🔍 Assignments:", response.data.data.assignments);
        setAssignments(response.data.data.assignments || []);
        setLastSyncAt(new Date());
        setError((prev) => ({ ...prev, retryCount: 0 }));
      } catch (err) {
        console.error("Error fetching assignments:", err);
        const errorType = categorizeError(err);
        const errorMessage = err.message || "Failed to fetch assignments";

        setError((prev) => ({
          ...prev,
          assignments: errorMessage,
          type: errorType,
          retryCount: retryAttempt + 1,
          lastRetryAt: new Date(),
        }));

        if (retryAttempt < 2 && errorType === ERROR_TYPES.NETWORK) {
          const retryDelay = Math.min(1000 * Math.pow(2, retryAttempt), 5000);
          setTimeout(() => {
            if (isOnline) {
              fetchAssignments(showRefreshIndicator, retryAttempt + 1);
            }
          }, retryDelay);
        }
      } finally {
        setLoading((prev) => ({
          ...prev,
          assignments: false,
          refreshing: false,
        }));
      }
    },
    [isOnline],
  );

  const fetchAvailableModels = useCallback(
    async (retryAttempt = 0) => {
      setLoading((prev) => ({ ...prev, models: true }));
      setError((prev) => ({ ...prev, models: null }));

      try {
        const response = await voiceAPI.getAvailableModels();
        setAvailableModels(response.data.data?.models || []);
      } catch (err) {
        console.error("Error fetching models:", err);
        const errorType = categorizeError(err);
        const errorMessage = err.message || "Failed to fetch available models";

        setError((prev) => ({
          ...prev,
          models: errorMessage,
          type: errorType,
        }));

        if (retryAttempt < 2 && errorType === ERROR_TYPES.NETWORK) {
          setTimeout(
            () => {
              fetchAvailableModels(retryAttempt + 1);
            },
            1000 * (retryAttempt + 1),
          );
        }
      } finally {
        setLoading((prev) => ({ ...prev, models: false }));
      }
    },
    [isOnline],
  );

  // Stable callback functions
  const handleAssignModalClose = useCallback(() => {
    setShowAssignModal(false);
    setSelectedScript(null);
    dispatch(clearSelection());
  }, [dispatch]);

  const handleAssignModalSuccess = useCallback(() => {
    setShowAssignModal(false);
    setSelectedScript(null);
    dispatch(clearSelection());
    if (activeTab === "scripts") {
      fetchScripts();
    } else {
      fetchAssignments();
    }
  }, [fetchScripts, fetchAssignments, activeTab, dispatch]);

  const handleDeleteScript = useCallback(
    async (script) => {
      if (!confirm(`Are you sure you want to delete "${script.title}"?`)) {
        return;
      }

      setLoading((prev) => ({ ...prev, deleting: script._id }));

      try {
        await voiceAPI.deleteScript(script._id);
        toast.success("Script deleted successfully");
        await fetchScripts(true);
      } catch (err) {
        console.error("Error deleting script:", err);
        toast.error(err.message || "Failed to delete script");
      } finally {
        setLoading((prev) => ({ ...prev, deleting: null }));
      }
    },
    [fetchScripts],
  );

  const handleDeleteAssignment = useCallback(
    async (assignment) => {
      if (!confirm(`Are you sure you want to delete this assignment?`)) {
        return;
      }

      setLoading((prev) => ({ ...prev, deleting: assignment._id }));

      try {
        if (assignment.scriptId) {
          await voiceAPI.deleteScript(assignment.scriptId);
        } else {
          await voiceAPI.deleteAssignment(assignment._id);
        }
        toast.success("Assignment deleted successfully");
        await fetchAssignments(true);
      } catch (err) {
        console.error("Error deleting assignment:", err);
        toast.error(err.message || "Failed to delete assignment");
      } finally {
        setLoading((prev) => ({ ...prev, deleting: null }));
      }
    },
    [fetchAssignments],
  );

  // Enhanced retry function with smart recovery
  const handleRetry = useCallback(() => {
    if (error.scripts) {
      fetchScripts();
    }
    if (error.assignments) {
      fetchAssignments();
    }
    if (error.models) {
      fetchAvailableModels();
    }
  }, [
    error.scripts,
    error.assignments,
    error.models,
    fetchScripts,
    fetchAssignments,
    fetchAvailableModels,
  ]);

  // Enhanced manual refresh function
  const handleRefresh = useCallback(() => {
    if (activeTab === "scripts") {
      fetchScripts(true);
      fetchAvailableModels();
    } else if (activeTab === "assignments") {
      fetchAssignments(true);
    }
  }, [activeTab, fetchScripts, fetchAssignments, fetchAvailableModels]);

  const handleAssignModels = (script) => {
    setSelectedScript(script);
    setShowAssignModal(true);
  };

  // Memoized filtered data for performance
  const filteredScripts = useMemo(() => {
    if (!scripts || scripts.length === 0) return [];

    return scripts.filter((script) => {
      const matchesSearch =
        !searchTerm ||
        script.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        script.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || script.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [scripts, searchTerm, filterStatus]);

  const filteredAssignments = useMemo(() => {
    if (!assignments || assignments.length === 0) return [];

    return assignments.filter((assignment) => {
      const matchesSearch =
        !searchTerm ||
        assignment.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || assignment.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [assignments, searchTerm, filterStatus]);

  // Memoized statistics for dashboard
  const scriptStats = useMemo(() => {
    return {
      total: scripts.length,
      active: scripts.filter((s) => s.status === "active").length,
      draft: scripts.filter((s) => s.status === "draft").length,
      completed: scripts.filter((s) => s.status === "completed").length,
      filtered: filteredScripts.length,
    };
  }, [scripts, filteredScripts.length]);

  const assignmentStats = useMemo(() => {
    console.log("🔍 Computing stats for assignments:", assignments);
    return {
      total: assignments.length,
      assigned: assignments.filter((a) => a.status === "assigned").length,
      in_progress: assignments.filter((a) => a.status === "in_progress").length,
      submitted: assignments.filter((a) => a.status === "submitted").length,
      approved: assignments.filter((a) => a.status === "approved").length,
      filtered: filteredAssignments.length,
    };
  }, [assignments, filteredAssignments.length]);

  // Tab configuration
  const tabs = [
    {
      id: "scripts",
      label: "Assignment Management",
      icon: <Grid3X3 className="w-4 h-4" />,
      description: "View and manage voice assignments",
    },
    {
      id: "review",
      label: "Review Center",
      icon: <MessageSquare className="w-4 h-4" />,
      description: "Review submitted recordings",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: <BarChart3 className="w-4 h-4" />,
      description: "View performance metrics",
    },
    {
      id: "export",
      label: "Export Hub",
      icon: <Download className="w-4 h-4" />,
      description: "Export data and reports",
    },
  ];

  // Loading state helpers
  const isInitialLoading =
    (loading.scripts || loading.assignments) &&
    scripts.length === 0 &&
    assignments.length === 0;
  const isRefreshing = loading.refreshing;
  const hasError = error.scripts || error.assignments || error.models;
  const canRetry = hasError && isOnline;

  // Show initial loading state
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Loading Voice Management
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Setting up your voice content management system...
          </p>
        </div>
      </div>
    );
  }

  // Show error state only if no cached data
  if (hasError && scripts.length === 0 && assignments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            {!isOnline ? (
              <WifiOff className="w-12 h-12 text-red-500 mx-auto" />
            ) : (
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {!isOnline ? "No Internet Connection" : "Unable to Load Data"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {!isOnline
              ? "Please check your internet connection and try again."
              : error.scripts ||
                error.assignments ||
                error.models ||
                "Something went wrong while loading your voice management data."}
          </p>
          {canRetry && (
            <button
              onClick={handleRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Voice Content Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Create and manage voice assignments for your models
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!isOnline && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-lg">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm font-medium">Offline</span>
                </div>
              )}
              {isRefreshing && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Refreshing...</span>
                </div>
              )}
              <button
                onClick={handleRefresh}
                disabled={loading.scripts || loading.assignments}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${
                    loading.scripts || loading.assignments ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </button>
              {activeTab === "scripts" && (
                <button
                  onClick={() => setShowQuestionAssignModal(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Assignment
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Assignment Management Tab */}
        {activeTab === "scripts" && (
          <AssignmentManagementContent
            assignments={filteredAssignments}
            loading={loading}
            error={error}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            viewMode={viewMode}
            setViewMode={setViewMode}
            assignmentStats={assignmentStats}
            onDeleteAssignment={handleDeleteAssignment}
          />
        )}

        {/* Review Center Tab */}
        {activeTab === "review" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <VoiceReviewCenter />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <VoiceAnalytics />
          </div>
        )}

        {/* Export Hub Tab */}
        {activeTab === "export" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <VoiceExportHub />
          </div>
        )}
      </div>

      {/* Modals */}
      {showQuestionAssignModal && (
        <CreateQuestionAssignmentModal
          onClose={() => setShowQuestionAssignModal(false)}
          onSuccess={handleAssignModalSuccess}
        />
      )}

      {showAssignModal && selectedScript && (
        <AssignModelsModal
          script={selectedScript}
          onClose={handleAssignModalClose}
          onSuccess={handleAssignModalSuccess}
        />
      )}
    </div>
  );
};

// Script Management Content Component
const AssignmentManagementContent = ({
  assignments,
  loading,
  error,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  viewMode,
  setViewMode,
  assignmentStats,
  onDeleteAssignment,
}) => {
  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Grid3X3 className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Total Assignments
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  {assignmentStats.total}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  In Progress
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  {assignmentStats.in_progress}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Submitted
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  {assignmentStats.submitted}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Pending Review
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  {assignmentStats.submitted}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search scripts and assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg ${
                viewMode === "grid"
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg ${
                viewMode === "list"
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === "grid" ? (
        <AssignmentGridView
          assignments={assignments}
          loading={loading}
          onDeleteAssignment={onDeleteAssignment}
        />
      ) : (
        <AssignmentListView
          assignments={assignments}
          loading={loading}
          onDeleteAssignment={onDeleteAssignment}
        />
      )}
    </div>
  );
};

// Assignment Grid View Component
const AssignmentGridView = ({ assignments, loading, onDeleteAssignment }) => {
  // Show only assignments
  const allItems = assignments.map((assignment) => ({
    ...assignment,
    type: "assignment",
  }));

  if (loading.assignments) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="flex justify-between">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (allItems.length === 0) {
    return (
      <div className="text-center py-12">
        <Grid3X3 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No assignments found
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Get started by creating your first voice assignment.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {allItems.map((item) => (
        <AssignmentCard
          key={`${item.type}-${item._id}`}
          item={item}
          loading={loading}
          onDelete={onDeleteAssignment}
        />
      ))}
    </div>
  );
};

// Assignment List View Component
const AssignmentListView = ({ assignments, loading, onDeleteAssignment }) => {
  // Show only assignments
  const allItems = assignments.map((assignment) => ({
    ...assignment,
    type: "assignment",
  }));

  if (loading.assignments) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700"
            >
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (allItems.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="text-center py-12">
          <List className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No scripts or assignments
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating your first voice assignment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        {allItems.map((item) => (
          <div
            key={`${item.type}-${item._id}`}
            className="flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {item.title}
                </h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.type === "script"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                  }`}
                >
                  {item.type === "script" ? "Script" : "Assignment"}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {item.description}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    item.status,
                  )}`}
                >
                  {item.status}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {item.type === "script" && (
                <button
                  onClick={() => onAssign(item)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  <Users className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() =>
                  item.type === "script"
                    ? onDelete(item)
                    : onDeleteAssignment(item)
                }
                disabled={loading.deleting === item._id}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 disabled:opacity-50"
              >
                {loading.deleting === item._id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Assignment Card Component
const AssignmentCard = ({ item, loading, onDelete }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
              {item.title}
            </h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              Assignment
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {item.description}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Status:</span>
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              item.status,
            )}`}
          >
            {item.status}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Model:</span>
          <span className="text-gray-900 dark:text-white">
            {item.modelId?.fullName || item.modelId?.username || "N/A"}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Questions:</span>
          <span className="text-gray-900 dark:text-white">
            {item.questionIds?.length || 0}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Created:</span>
          <span className="text-gray-900 dark:text-white">
            {new Date(item.assignedAt || item.createdAt).toLocaleDateString()}
          </span>
        </div>

        {item.deadline && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Deadline:</span>
            <span className="text-gray-900 dark:text-white">
              {new Date(item.deadline).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onDelete(item)}
          disabled={loading.deleting === item._id}
          className="flex items-center gap-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 text-sm disabled:opacity-50"
        >
          {loading.deleting === item._id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Delete
        </button>
      </div>
    </div>
  );
};

// Utility function to get status colors
const getStatusColor = (status) => {
  const colors = {
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    assigned:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    in_progress:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    submitted:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    approved:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };
  return colors[status] || colors.draft;
};

// Create Question Assignment Modal Component
const CreateQuestionAssignmentModal = ({ onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [assignmentData, setAssignmentData] = useState({
    title: "",
    description: "",
    modelIds: [],
    deadline: "",
    priority: "medium",
  });
  const [availableModels, setAvailableModels] = useState([]);

  // Fetch available models when component mounts
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await voiceAPI.getAvailableModels();
        setAvailableModels(response.data.data?.models || []);
      } catch (error) {
        console.error("Error fetching models:", error);
        toast.error("Failed to load available models");
      }
    };
    fetchModels();
  }, []);

  const handleQuestionSelectionChange = (questionIds) => {
    setSelectedQuestions(questionIds);
  };

  const handleNextStep = () => {
    if (currentStep === 1 && selectedQuestions.length === 0) {
      toast.error("Please select at least one question");
      return;
    }
    setCurrentStep(2);
  };

  const handlePreviousStep = () => {
    setCurrentStep(1);
  };

  const handleAssignmentDataChange = (field, value) => {
    setAssignmentData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleModelToggle = (modelId) => {
    setAssignmentData((prev) => ({
      ...prev,
      modelIds: prev.modelIds.includes(modelId)
        ? prev.modelIds.filter((id) => id !== modelId)
        : [...prev.modelIds, modelId],
    }));
  };

  const handleSubmit = async () => {
    if (!assignmentData.title.trim()) {
      toast.error("Please enter an assignment title");
      return;
    }
    if (assignmentData.modelIds.length === 0) {
      toast.error("Please select at least one model");
      return;
    }

    setLoading(true);
    try {
      await voiceAPI.createAssignment({
        ...assignmentData,
        questionIds: selectedQuestions,
      });
      toast.success("Assignment created successfully");
      onSuccess();
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast.error(error.message || "Failed to create assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Create Voice Assignment
              </h3>
              <div className="flex items-center mt-2 space-x-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= 1
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  1
                </div>
                <div
                  className={`w-12 h-0.5 ${
                    currentStep >= 2 ? "bg-blue-600" : "bg-gray-200"
                  }`}
                ></div>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= 2
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  2
                </div>
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  {currentStep === 1
                    ? "Select Questions"
                    : "Assignment Details"}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ×
            </button>
          </div>

          {currentStep === 1 ? (
            <div>
              <QuestionSelector
                onSelectionChange={handleQuestionSelectionChange}
              />

              {/* Step 1 Footer */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedQuestions.length} question
                  {selectedQuestions.length !== 1 ? "s" : ""} selected
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNextStep}
                    disabled={selectedQuestions.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Assignment Details →
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <AssignmentDetailsForm
              assignmentData={assignmentData}
              availableModels={availableModels}
              selectedQuestions={selectedQuestions}
              onDataChange={handleAssignmentDataChange}
              onModelToggle={handleModelToggle}
              onPrevious={handlePreviousStep}
              onSubmit={handleSubmit}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Assignment Details Form Component
const AssignmentDetailsForm = ({
  assignmentData,
  availableModels,
  selectedQuestions,
  onDataChange,
  onModelToggle,
  onPrevious,
  onSubmit,
  loading,
}) => {
  return (
    <div className="space-y-6">
      {/* Assignment Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Assignment Summary
        </h4>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          You have selected <strong>{selectedQuestions.length}</strong> question
          {selectedQuestions.length !== 1 ? "s" : ""} for this voice assignment.
        </p>
      </div>

      {/* Assignment Details Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Title */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Assignment Title *
          </label>
          <input
            type="text"
            value={assignmentData.title}
            onChange={(e) => onDataChange("title", e.target.value)}
            placeholder="Enter assignment title..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={assignmentData.description}
            onChange={(e) => onDataChange("description", e.target.value)}
            placeholder="Enter assignment description..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Deadline
          </label>
          <input
            type="datetime-local"
            value={assignmentData.deadline}
            onChange={(e) => onDataChange("deadline", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Priority
          </label>
          <select
            value={assignmentData.priority}
            onChange={(e) => onDataChange("priority", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Select Models *
        </label>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto">
          {availableModels.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No models available
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableModels.map((model) => (
                <div
                  key={model._id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    assignmentData.modelIds.includes(model._id)
                      ? "border-blue-300 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300"
                  }`}
                  onClick={() => onModelToggle(model._id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {assignmentData.modelIds.includes(model._id) ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {model.fullName || model.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        @{model.username}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {assignmentData.modelIds.length} model
          {assignmentData.modelIds.length !== 1 ? "s" : ""} selected
        </p>
      </div>

      {/* Form Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
        <button
          onClick={onPrevious}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          ← Back to Questions
        </button>
        <div className="flex gap-3">
          <button
            onClick={onSubmit}
            disabled={
              loading ||
              !assignmentData.title.trim() ||
              assignmentData.modelIds.length === 0
            }
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Assignment...
              </>
            ) : (
              "Create Assignment"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Assign Models Modal Component
const AssignModelsModal = ({ script, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [selectedModels, setSelectedModels] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await voiceAPI.getAvailableModels();
        setAvailableModels(response.data.data?.models || []);
      } catch (error) {
        console.error("Error fetching models:", error);
        toast.error("Failed to load available models");
      }
    };
    fetchModels();
  }, []);

  const handleSubmit = async () => {
    if (selectedModels.length === 0) {
      toast.error("Please select at least one model");
      return;
    }

    setLoading(true);
    try {
      await voiceAPI.assignScriptToModels(script._id, {
        modelIds: selectedModels,
      });
      toast.success("Script assigned successfully");
      onSuccess();
    } catch (error) {
      console.error("Error assigning script:", error);
      toast.error(error.message || "Failed to assign script");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Assign Script: {script.title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Models
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableModels.map((model) => (
                  <label
                    key={model._id}
                    className="flex items-center space-x-3"
                  >
                    <input
                      type="checkbox"
                      checked={selectedModels.includes(model._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedModels([...selectedModels, model._id]);
                        } else {
                          setSelectedModels(
                            selectedModels.filter((id) => id !== model._id),
                          );
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {model.fullName || model.username}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || selectedModels.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Assigning...
                  </>
                ) : (
                  "Assign Script"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap the component with error boundary
const VoiceScriptManagementWithErrorBoundary = () => (
  <VoiceErrorBoundary>
    <VoiceScriptManagement />
  </VoiceErrorBoundary>
);

export default VoiceScriptManagementWithErrorBoundary;
