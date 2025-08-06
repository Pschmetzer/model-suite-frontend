import {
  Search,
  Bell,
  Plus,
  Settings,
  X,
  Users,
  TrendingUp,
  Globe2,
  AlertCircle,
  FileText,
  ClipboardList,
  BookOpen,
  PenTool,
  Star,
  LogOut,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import DashboardSkeleton from "./DashboardSkeleton";
import ShiftReportWidget from "../../components/ShiftReport/ShiftReport";
import { usePermissions } from "../../hooks/usePermissions";
import PermissionGuard from "../../components/common/PermissionGuard";

const Avatar = ({ src, alt, fallback, className = "" }) => (
  <div
    className={`relative inline-flex items-center justify-center overflow-hidden bg-gray-700 border-2 border-gray-800 shadow-sm rounded-full ${className}`}
  >
    {src ? (
      <img
        src={src || "/placeholder.svg"}
        alt={alt}
        className="w-full h-full object-cover"
      />
    ) : (
      <span className="text-sm font-medium text-white">{fallback}</span>
    )}
  </div>
);

const Button = ({
  children,
  variant = "default",
  size = "default",
  className = "",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background shadow-sm";

  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    ghost:
      "dark:hover:bg-gray-700 dark:text-gray-300 hover:bg-gray-300/20 text-gray-600",
    outline:
      "border border-gray-600 bg-gray-800 hover:bg-gray-700 text-gray-200",
  };

  const sizes = {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3 rounded-md text-sm",
    icon: "h-10 w-10",
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-xl border dark:border-gray-700 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 dark:text-white text-gray-400 text-card-foreground shadow-lg ${className}`}
  >
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }) => (
  <div
    className={`flex flex-col space-y-1.5 p-6 border-b border-gray-700 ${className}`}
  >
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3
    className={`text-xl font-bold leading-tight tracking-tight flex items-center gap-2 ${className}`}
  >
    {children}
  </h3>
);
const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 pt-4 ${className}`}>{children}</div>
);

const Badge = ({ children, className = "" }) => (
  <div
    className={`inline-flex items-center rounded-full border border-blue-600 bg-blue-900/40 px-2.5 py-0.5 text-xs font-semibold text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
  >
    {children}
  </div>
);

export default function AgencyDashboard() {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem("auth"))?.user;
  const token = JSON.parse(localStorage.getItem("auth"))?.token;
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const dropdownRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [questionnaireStats, setQuestionnaireStats] = useState({
    totalTemplates: 0,
    activeAssignments: 0,
    pendingResponses: 0,
    completedResponses: 0,
  });
  const [notesStats, setNotesStats] = useState({
    totalNotes: 0,
    pinnedNotes: 0,
    recentNotes: 0,
  });
  const [showNotesManager, setShowNotesManager] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Permission checks
  const { hasPermission, isEmployee, hasFullAccess } = usePermissions();

  // Check if employee has access to any dashboard sections
  const hasAnyDashboardAccess =
    !isEmployee ||
    hasFullAccess ||
    hasPermission("questionnaire.view") ||
    hasPermission("notes.view") ||
    hasPermission("tasks.view") ||
    hasPermission("uploads.view") ||
    hasPermission("calendar.view") ||
    hasPermission("messages.view");

  const [hasNoPermissions, setHasNoPermissions] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest(".settings-dropdown")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Fetch questionnaire stats
  const fetchQuestionnaireStats = useCallback(async () => {
    try {
      const [templatesRes, assignmentsRes] = await Promise.all([
        axios.get(`${baseURL}/questionnaire/templates`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${baseURL}/questionnaire/assignments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const templates = templatesRes.data || [];
      const assignments = assignmentsRes.data || [];

      const activeAssignments = assignments.filter(
        (a) => a.status === "Not started" || a.status === "In progress",
      ).length;
      const pendingResponses = assignments.filter(
        (a) => a.status === "In progress",
      ).length;
      const completedResponses = assignments.filter(
        (a) => a.status === "Submitted",
      ).length;

      setQuestionnaireStats({
        totalTemplates: templates.length,
        activeAssignments,
        pendingResponses,
        completedResponses,
      });
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch questionnaire stats:", error);
      // Set loading to false even on error to prevent infinite skeleton
      setLoading(false);
      // Set default stats on error
      setQuestionnaireStats({
        totalTemplates: 0,
        activeAssignments: 0,
        pendingResponses: 0,
        completedResponses: 0,
      });
    }
  }, [baseURL, token]);

  // Fetch notes stats
  const fetchNotesStats = useCallback(
    async (modelId = null) => {
      try {
        if (!modelId) {
          setNotesStats({
            totalNotes: 0,
            pinnedNotes: 0,
            recentNotes: 0,
          });
          return;
        }

        const response = await axios.get(
          `${baseURL}/notes/model/${modelId}/stats`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.data.success) {
          setNotesStats(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch notes stats:", error);
        setNotesStats({
          totalNotes: 0,
          pinnedNotes: 0,
          recentNotes: 0,
        });
      }
    },
    [baseURL, token],
  );

  useEffect(() => {
    if (token) {
      // If user has full access or questionnaire permissions, fetch stats
      if (hasFullAccess || hasPermission("questionnaire.view")) {
        fetchQuestionnaireStats();
      } else {
        // If no questionnaire permissions, just set loading to false
        setLoading(false);
        // Check if user has no permissions at all
        if (isEmployee && !hasAnyDashboardAccess) {
          setHasNoPermissions(true);
        }
      }
    }
  }, [
    fetchQuestionnaireStats,
    token,
    hasFullAccess,
    // Remove hasPermission from dependencies as it's a function from usePermissions hook
    // that doesn't need to trigger re-renders
    isEmployee,
    hasAnyDashboardAccess,
  ]);

  useEffect(() => {
    if (selectedModel?._id) {
      fetchNotesStats(selectedModel._id);
    } else {
      fetchNotesStats(null);
    }
  }, [selectedModel, fetchNotesStats]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  // Show no permissions message for employees without access
  if (hasNoPermissions) {
    return (
      <div className="min-h-screen px-6 bg-gradient-to-br from-gray-950 to-gray-900 text-white">
        <div className="max-w-8xl py-8">
          <header className="flex items-center justify-between mb-10 border-b border-gray-800 pb-6">
            <div className="flex items-center gap-4">
              <Avatar
                src={userInfo?.avatar}
                alt={userInfo?.name}
                fallback={userInfo?.name?.[0] || "E"}
                className="h-12 w-12 lg:block hidden"
              />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Welcome, {userInfo?.name || "Employee"}!
                </h1>
                <p className="text-gray-400 mt-1">Employee Dashboard</p>
              </div>
            </div>
          </header>

          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">
                No Dashboard Access
              </h2>
              <p className="text-gray-400 max-w-md">
                You don't have permission to access any dashboard sections.
                Please contact your administrator to request access.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  const logout = async () => {
    setIsLoggingOut(true);

    try {
      const response = await axios.post(
        `${baseURL}/agency/logout`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
          timeout: 5000, // 5 second timeout
        },
      );
      console.log(
        "Backend logout successful:",
        response.data?.message || "Logged out",
      );
    } catch (error) {
      console.error("Backend logout failed:", error);

      // Log specific error details
      if (error.code === "ECONNABORTED") {
        console.log("Logout request timed out");
      } else if (error.response?.status === 401) {
        console.log("Already logged out on backend");
      } else {
        console.log("Network error during logout");
      }
    } finally {
      setTimeout(() => {
        // Clear frontend data
        localStorage.removeItem("auth");
        localStorage.removeItem("token");
        localStorage.removeItem("tokenExpiry");

        setIsLoggingOut(false);

        // Navigate to home page
        navigate("/");

        console.log("Frontend logout completed");
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen px-6 bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:to-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
      {/* Main Content */}
      <div className="max-w-8xl py-8">
        {/* Header */}
        <header className="flex items-center justify-between  mb-10 border-b border-gray-800 pb-6">
          <div className="flex  items-center gap-4 ">
            <Avatar
              src={userInfo?.avatar}
              alt={userInfo?.name}
              fallback={userInfo?.name?.[0] || "A"}
              className="h-12 w-12 lg:block hidden"
            />
            <div>
              <h1 className="text-2xl  font-bold tracking-tight dark:text-white">
                Welcome, {userInfo?.agencyName || "Agency"}!
              </h1>
              <p className="text-gray-600 dark:text-white text-sm">
                Manage your models and performance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/agency/questionnaires">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-purple-900/40"
                title="Questionnaires"
              >
                <FileText size={20} className="text-purple-400" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-blue-900/40"
              title="Notes"
              onClick={() => setShowNotesManager(true)}
            >
              <BookOpen size={20} className="text-blue-400" />
            </Button>
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  navigate("/agency/dashboard/customize");
                }}
              >
                <Settings className="dark:text-white text-gray-600" size={20} />
              </Button>

              {/* {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-xl shadow-lg z-50 border border-gray-700 overflow-hidden">
                  <button
                    onClick={(e) => {
                      navigate("/agency/dashboard/customize");
                      e.stopPropagation();
                      setIsOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-800 text-gray-300 border-t border-gray-700"
                  >
                    <span className="flex items-center justify-center w-4 h-4 mr-2 bg-blue-500 rounded-sm">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M15 3H9V5H15V3Z" fill="white" />
                        <path
                          d="M21 5H19V3C19 1.9 18.1 1 17 1H7C5.9 1 5 1.9 5 3V5H3C1.9 5 1 5.9 1 7V9C1 11.55 2.92 13.63 5.39 13.94C6.02 16.44 8.23 18.29 11 18.87V21H7C6.45 21 6 21.45 6 22C6 22.55 6.45 23 7 23H17C17.55 23 18 22.55 18 22C18 21.45 17.55 21 17 21H13V18.87C15.77 18.29 17.98 16.44 18.61 13.94C21.08 13.63 23 11.55 23 9V7C23 5.9 22.1 5 21 5ZM3 9V7H5V10.82C3.84 10.4 3 9.3 3 9ZM12 17C9.24 17 7 14.76 7 12V5H17V12C17 14.76 14.76 17 12 17ZM21 9C21 9.3 20.16 10.4 19 10.82V7H21V9Z"
                          fill="white"
                        />
                      </svg>
                    </span>
                    Customize
                  </button>
                </div>
              )} */}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              disabled={isLoggingOut}
              className="hover:bg-red-900/40 ml-2"
              title={isLoggingOut ? "Logging out..." : "Logout"}
            >
              {isLoggingOut ? (
                <div className="animate-spin w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full"></div>
              ) : (
                <LogOut size={20} className="text-red-400 hover:text-red-300" />
              )}
            </Button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex">
          {/* <AgencyMenu className="mr-5" /> */}

          <main>
            {/* <div className="grid grid-cols-1 md:grid-cols-1 gap-8 mb-10"> */}
            {/* Top Row Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              <Card>
                <CardContent className="p-8 flex flex-col gap-4 items-start justify-center h-full">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-gray-300 dark:bg-blue-900/40 rounded-full p-3 flex items-center justify-center">
                      <Users
                        size={28}
                        className="dark:text-blue-400 text-gray-600"
                      />
                    </span>
                    <h3 className="text-base font-medium text-gray-600 dark:text-gray-300">
                      Total Models
                    </h3>
                  </div>
                  <p className="text-4xl font-extrabold tracking-tight ml-1 dark:text-white text-gray-600">
                    135
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-8 flex flex-col gap-4 items-start justify-center h-full">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="dark:bg-blue-900/40 bg-gray-300 rounded-full p-3 flex items-center justify-center">
                      <TrendingUp
                        size={28}
                        className="dark:text-green-400 text-green-500"
                      />
                    </span>
                    <h3 className="text-base font-medium text-gray-600 dark:text-gray-300">
                      Top Performing Model
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 mt-2 w-full">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={"https://randomuser.me/api/portraits/women/44.jpg"}
                        alt="Victoria Adams"
                        fallback="VA"
                        className="h-12 w-12"
                      />
                      <span className="font-medium truncate text-lg dark:text-white text-gray-600">
                        Victoria Adams
                      </span>
                    </div>
                    <span className="ml-auto text-2xl font-extrabold text-green-400">
                      7.2%
                    </span>
                  </div>
                </CardContent>
              </Card>
              <div className="widget-container">
                <ShiftReportWidget />
              </div>
              <Card>
                <CardContent className="p-8 flex flex-col gap-4 items-start justify-center h-full">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-gray-300 dark:bg-blue-900/40 rounded-full p-3 flex items-center justify-center">
                      <Globe2 size={28} className="text-blue-300" />
                    </span>
                    <h3 className="text-base font-medium text-gray-600 dark:text-gray-300">
                      Most active platform
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="w-10 h-10 p-3 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      52%
                    </span>
                    <span className="font-medium text-gray-600 dark:text-white text-lg">
                      Instagram
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="border-b border-gray-800 mb-10"></div>

            {/* Questionnaire Overview Section */}
            <PermissionGuard permission="questionnaire.view">
              <div className="mb-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <FileText size={24} className="text-purple-400" />
                    Questionnaire Overview
                  </h2>
                  <Link to="/agency/questionnaires">
                    <Button variant="outline" size="sm">
                      <ClipboardList size={16} className="mr-2" />
                      Manage Questionnaires
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <Card>
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="bg-purple-900/40 rounded-full p-3 mb-3">
                        <FileText size={24} className="text-purple-400" />
                      </div>
                      <p className="text-2xl font-bold">
                        {questionnaireStats.totalTemplates}
                      </p>
                      <p className="text-gray-400 text-sm">Templates Created</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="bg-blue-900/40 rounded-full p-3 mb-3">
                        <ClipboardList size={24} className="text-blue-400" />
                      </div>
                      <p className="text-2xl font-bold">
                        {questionnaireStats.activeAssignments}
                      </p>
                      <p className="text-gray-400 text-sm">
                        Active Assignments
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="bg-yellow-900/40 rounded-full p-3 mb-3">
                        <AlertCircle size={24} className="text-yellow-400" />
                      </div>
                      <p className="text-2xl font-bold">
                        {questionnaireStats.pendingResponses}
                      </p>
                      <p className="text-gray-400 text-sm">Pending Responses</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="bg-green-900/40 rounded-full p-3 mb-3">
                        <TrendingUp size={24} className="text-green-400" />
                      </div>
                      <p className="text-2xl font-bold">
                        {questionnaireStats.completedResponses}
                      </p>
                      <p className="text-gray-400 text-sm">
                        Completed Responses
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </PermissionGuard>

            <div className="border-b border-gray-800 mb-10"></div>

            {/* Notes Overview Section */}
            <PermissionGuard permission="notes.view">
              <div className="mb-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <BookOpen size={24} className="text-blue-400" />
                    Notes Overview
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNotesManager(true)}
                    disabled={!selectedModel}
                    className={
                      !selectedModel ? "opacity-50 cursor-not-allowed" : ""
                    }
                  >
                    <PenTool size={16} className="mr-2" />
                    Manage Notes
                  </Button>
                </div>

                {/* Model Selector */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-300">
                      Select Model for Notes
                    </label>
                    {selectedModel && (
                      <span className="text-xs text-blue-400">
                        Viewing notes for{" "}
                        {selectedModel.fullName || selectedModel.username}
                      </span>
                    )}
                  </div>
                  {/* <ModelSelector
                    selectedModelId={selectedModel?._id}
                    onModelSelect={setSelectedModel}
                    className="max-w-md"
                  /> */}
                </div>

                {selectedModel ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                      <CardContent className="p-6 flex flex-col items-center text-center">
                        <div className="bg-blue-900/40 rounded-full p-3 mb-3">
                          <BookOpen size={24} className="text-blue-400" />
                        </div>
                        <p className="text-2xl font-bold">
                          {notesStats.totalNotes}
                        </p>
                        <p className="text-gray-400 text-sm">Total Notes</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6 flex flex-col items-center text-center">
                        <div className="bg-yellow-900/40 rounded-full p-3 mb-3">
                          <Star size={24} className="text-yellow-400" />
                        </div>
                        <p className="text-2xl font-bold">
                          {notesStats.pinnedNotes}
                        </p>
                        <p className="text-gray-400 text-sm">Pinned Notes</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6 flex flex-col items-center text-center">
                        <div className="bg-green-900/40 rounded-full p-3 mb-3">
                          <PenTool size={24} className="text-green-400" />
                        </div>
                        <p className="text-2xl font-bold">
                          {notesStats.recentNotes}
                        </p>
                        <p className="text-gray-400 text-sm">Recent Notes</p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-gray-800/30 to-gray-700/30 border border-gray-600 rounded-2xl p-12 text-center backdrop-blur-sm">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-3xl"></div>
                      <div className="relative bg-gray-800/50 rounded-2xl p-6 border border-gray-600">
                        <BookOpen
                          size={64}
                          className="text-blue-400 mx-auto mb-6"
                        />
                        <h3 className="text-2xl font-bold text-white mb-4 flex items-center justify-center gap-2">
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                          Select a Model to View Notes
                        </h3>
                        <p className="text-gray-300 text-base mb-6 max-w-md mx-auto leading-relaxed">
                          Choose a model from the dropdown above to view their
                          notes statistics, manage their notes, and track their
                          progress.
                        </p>
                        <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span>Notes Management</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span>Statistics</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                            <span>Analytics</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </PermissionGuard>

            <div className="border-b border-gray-800 mb-10"></div>

            {/* Middle Row */}
            <PermissionGuard
              permissions={["performance.view", "analytics.view"]}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-gray-600 dark:text-white">
                      <TrendingUp
                        size={20}
                        className="dark:text-green-400 text-green-600"
                      />{" "}
                      Engagement Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="dark:text-white text-gray-600">
                        <p className="text-3xl font-bold">625.6K</p>
                        <p className="text-gray-400 text-sm">
                          Total engagement
                        </p>
                      </div>
                      <div className="dark:text-white text-gray-600">
                        <p className="text-3xl font-bold">48</p>
                        <p className="text-gray-400 text-sm">Stories today</p>
                      </div>
                      <div className="dark:text-white text-gray-600">
                        <p className="text-3xl font-bold">932</p>
                        <p className="text-gray-400 text-sm">
                          Avg. likes per post
                        </p>
                      </div>
                      <div className="dark:text-white text-gray-600">
                        <p className="text-3xl font-bold">87</p>
                        <p className="text-gray-400 text-sm">
                          Avg. comments pt
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="dark:text-white text-gray-600">
                      <Globe2
                        size={20}
                        className="dark:text-blue-300 text-blue-600"
                      />{" "}
                      Platform Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-800">
                            <th
                              scope="col"
                              className="text-left dark:text-gray-400 text-gray-600 font-medium py-2 px-2"
                            >
                              Platform
                            </th>
                            <th
                              scope="col"
                              className="text-left dark:text-gray-400 text-gray-600 font-medium py-2 px-2"
                            >
                              Views
                            </th>
                            <th
                              scope="col"
                              className="text-left dark:text-gray-400 text-gray-600 font-medium py-2 px-2"
                            >
                              Followers
                            </th>
                            <th
                              scope="col"
                              className="text-left dark:text-gray-400 text-gray-600 font-medium py-2 px-2"
                            >
                              Posts
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-800 last:border-0">
                            <td className="flex items-center gap-2 py-3 px-2 font-medium">
                              <span className="w-4 h-4 flex items-center justify-center rounded bg-blue-600">
                                {/* Facebook icon */}
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <path
                                    d="M17 2.1V5.1C17 5.59706 17.4029 6 17.9 6H20.9C21.3971 6 21.8 6.40294 21.8 6.9V20.1C21.8 20.5971 21.3971 21 20.9 21H3.1C2.60294 21 2.2 20.5971 2.2 20.1V6.9C2.2 6.40294 2.60294 6 3.1 6H6.1C6.59706 6 7 5.59706 7 5.1V2.1C7 1.60294 7.40294 1.2 7.9 1.2H16.1C16.5971 1.2 17 1.60294 17 2.1ZM12 8.4C10.2327 8.4 8.8 9.8327 8.8 11.6C8.8 13.3673 10.2327 14.8 12 14.8C13.7673 14.8 15.2 13.3673 15.2 11.6C15.2 9.8327 13.7673 8.4 12 8.4Z"
                                    fill="#fff"
                                  />
                                </svg>
                              </span>
                              <span className="dark:text-white text-gray-600">
                                Facebook
                              </span>
                            </td>
                            <td className="py-3 px-2 dark:text-white text-gray-600">
                              3.5K
                            </td>
                            <td className="py-3 px-2 dark:text-white text-gray-600">
                              900k
                            </td>
                            <td className="py-3 px-2 dark:text-white text-gray-600">
                              2K
                            </td>
                          </tr>
                          <tr className="border-b border-gray-800 last:border-0">
                            <td className="flex items-center gap-2 py-3 px-2 font-medium">
                              <span className="w-4 h-4 flex items-center justify-center rounded bg-pink-600">
                                {/* Instagram icon */}
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <path
                                    d="M7.75 2C4.67893 2 2 4.67893 2 7.75V16.25C2 19.3211 4.67893 22 7.75 22H16.25C19.3211 22 22 19.3211 22 16.25V7.75C22 4.67893 19.3211 2 16.25 2H7.75ZM12 7.25C14.6234 7.25 16.75 9.37665 16.75 12C16.75 14.6234 14.6234 16.75 12 16.75C9.37665 16.75 7.25 14.6234 7.25 12C7.25 9.37665 9.37665 7.25 12 7.25ZM18.25 6.25C18.9404 6.25 19.5 6.80964 19.5 7.5C19.5 8.19036 18.9404 8.75 18.25 8.75C17.5596 8.75 17 8.19036 17 7.5C17 6.80964 17.5596 6.25 18.25 6.25Z"
                                    fill="#fff"
                                  />
                                </svg>
                              </span>
                              <span className="dark:text-white text-gray-600">
                                Instagram
                              </span>
                            </td>
                            <td className="py-3 px-2 dark:text-white text-gray-600">
                              12.5K
                            </td>
                            <td className="py-3 px-2 dark:text-white text-gray-600">
                              1180K
                            </td>
                            <td className="py-3 px-2 dark:text-white text-gray-600">
                              3.8K
                            </td>
                          </tr>
                          <tr>
                            <td className="flex items-center gap-2 py-3 px-2 font-medium">
                              <span className="w-4 h-4 flex items-center justify-center rounded bg-blue-400">
                                {/* Twitter icon */}
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <path
                                    d="M22.46 6.011c-.793.352-1.645.59-2.54.697a4.48 4.48 0 0 0 1.965-2.475 8.94 8.94 0 0 1-2.828 1.082A4.48 4.48 0 0 0 16.11 4c-2.485 0-4.5 2.015-4.5 4.5 0 .353.04.697.116 1.025C7.728 9.37 4.1 7.6 1.67 4.905c-.387.664-.61 1.437-.61 2.26 0 1.56.794 2.936 2.003 3.744-.737-.023-1.43-.226-2.037-.563v.057c0 2.18 1.55 4.002 3.604 4.418-.377.103-.775.158-1.185.158-.29 0-.567-.028-.84-.08.568 1.772 2.217 3.06 4.175 3.095A8.98 8.98 0 0 1 2 19.54a12.68 12.68 0 0 0 6.88 2.017c8.26 0 12.78-6.84 12.78-12.78 0-.195-.004-.39-.013-.583A9.14 9.14 0 0 0 24 4.59a8.98 8.98 0 0 1-2.54.697z"
                                    fill="#fff"
                                  />
                                </svg>
                              </span>
                              <span className="dark:text-white text-gray-600">
                                Twitter
                              </span>
                            </td>
                            <td className="py-3 px-2 dark:text-white text-gray-600">
                              9.4K
                            </td>
                            <td className="py-3 px-2 dark:text-white text-gray-600">
                              513K
                            </td>
                            <td className="py-3 px-2 dark:text-white text-gray-600">
                              1.3K
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="border-b border-gray-800 mb-10"></div>

              {/* World Map */}
              <Card className="mb-10">
                <CardHeader>
                  <CardTitle className="dark:text-white text-gray-600">
                    <Globe2
                      size={20}
                      className="dark:text-blue-300 text-blue-600"
                    />{" "}
                    Model By Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
                    <p className="text-gray-400">World Map Visualization</p>
                  </div>
                </CardContent>
              </Card>

              {/* Bottom Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="dark:text-white text-gray-600">
                      <TrendingUp
                        size={20}
                        className="dark:text-green-400 text-green-600"
                      />{" "}
                      Story Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 mb-6">
                      <Button variant="outline" size="sm">
                        All
                      </Button>
                      <Button variant="ghost" size="sm">
                        Instagram
                      </Button>
                      <Button variant="ghost" size="sm">
                        Facebook
                      </Button>
                      <Button variant="ghost" size="sm">
                        Twitter
                      </Button>
                    </div>
                    <div className="space-y-4 divide-y divide-gray-800">
                      <div className="flex justify-between py-2">
                        <span className="dark:text-gray-400 text-gray-600">
                          Total Models
                        </span>
                        <div className="flex gap-8">
                          <span className="dark:text-gray-400 text-gray-600">
                            1.2K
                          </span>
                          <span className="dark:text-gray-400 text-gray-600">
                            1.2M
                          </span>
                          <span className="dark:text-gray-400 text-gray-600">
                            6.4%
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="dark:text-gray-400 text-gray-600">
                          Total Followers
                        </span>
                        <div className="flex gap-8">
                          <span className="dark:text-gray-400 text-gray-600">
                            932
                          </span>
                          <span className="dark:text-gray-400 text-gray-600">
                            3.5K
                          </span>
                          <span className="dark:text-gray-400 text-gray-600">
                            4.2%
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="dark:text-gray-400 text-gray-600">
                          Avg Engagement
                        </span>
                        <div className="flex gap-8">
                          <span className="dark:text-gray-400 text-gray-600">
                            82
                          </span>
                          <span className="dark:text-gray-400 text-gray-600">
                            1.3K
                          </span>
                          <span className="dark:text-gray-400 text-gray-600">
                            2.1%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="dark:text-gray-400 text-gray-600">
                      <AlertCircle
                        size={20}
                        className="dark:text-yellow-400 text-yellow-600"
                      />{" "}
                      Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 divide-y divide-gray-800">
                      <div className="flex items-start gap-3 py-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium dark:text-gray-400 text-gray-600">
                            3 Models
                          </p>
                          <p className="text-gray-400 text-sm">
                            Signed up today
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 py-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium dark:text-gray-400 text-gray-600">
                            Mia uploaded 3 stories
                          </p>
                          <p className="text-gray-400 text-sm">on Instagram</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 py-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium dark:text-gray-400 text-gray-600">
                            {"Lena's post on X has"}
                          </p>
                          <p className="text-gray-400 text-sm">2.4K likes</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </PermissionGuard>
          </main>
        </div>
      </div>
      {isLoggingOut && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 w-full max-w-md border border-gray-600 shadow-2xl text-center">
            <div className="flex flex-col items-center space-y-6">
              {/* ✅ Animated Logout Icon */}
              <div className="relative">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                  <LogOut size={32} className="text-red-400" />
                </div>
                {/* ✅ Spinning Border */}
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-red-400 rounded-full animate-spin"></div>
              </div>

              {/* ✅ Loading Text */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Logging Out...
                </h3>
                <p className="text-gray-400 text-sm">
                  Securing your session and clearing data
                </p>
              </div>

              {/* ✅ Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full animate-pulse"></div>
              </div>

              {/* ✅ Animated Dots */}
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-red-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-red-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Notes Manager Modal */}
      {showNotesManager && selectedModel && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="dbg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl w-full max-w-7xl min-h-[92vh] max-h-none border border-gray-600 shadow-2xl my-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-600 bg-gradient-to-r from-gray-800/50 to-gray-700/50 sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <BookOpen size={24} className="text-blue-400" />
                  </div>
                  Notes Manager
                </h2>
                <div className="text-sm text-gray-300 mt-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  Managing notes for{" "}
                  <span className="font-medium text-blue-300">
                    {selectedModel.fullName || selectedModel.username}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotesManager(false)}
                className="text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
              >
                <X size={20} />
              </Button>
            </div>
            <div className="bg-gradient-to-b from-gray-900/50 to-gray-800/50">
              <NotesManager
                modelId={selectedModel._id}
                agencyId={userInfo?._id}
                userRole="agency"
                onStatsUpdate={() => fetchNotesStats(selectedModel._id)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
