/* eslint-disable no-unused-vars */
import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import ChatWindow from "../../components/ChatWindow";
import ModelTaskList from "../../components/task/TaskList";
import ModelBilling from "./ModelDashboard";
import { useDispatch } from "react-redux";
import { logout as logoutAction } from "../../globalstate/authSlice";
import RewardWidget from "../../components/rewards/RewardWidget";
import DetailedRewardCard from "../../components/rewards/DetailedRewardCard";

import {
  LogOut,
  MessageSquare,
  Users,
  Calendar,
  Settings,
  Plus,
  TrendingUp,
  CalendarCheck,
  CircleUser,
  Search,
  HelpCircle,
  X,
  Upload,
  FileText,
  ClipboardList,
  Ban,
  ChevronDown,
  Mic,
  Trophy,
  Sparkles,
  ChevronUp,
} from "lucide-react";
import BoardsView from "../../components/task/board/BoardsView";
import MyProfile from "../../components/MyProfile/components";
import { formateTime, useTypingIndicator } from "../../utils/functions";
import socket from "../../utils/socket";
import ContentUpload from "../../components/contentUpload/main";
import {
  Button,
  Avatar,
  Badge,
  Modal,
  SearchInput,
  Tooltip,
} from "../../components/ui";

import ModelMessanger from "../../components/modelMessanger";

import AssignedQuestionnaires from "../../components/questionnaire/model/AssignedQuestionnaires";
import Supportteam from "../../components/supportteam/Supportteam";
import CalendarView from "../../components/Calendar/Calendar";
import ModelAbsencePanel from "../../components/Calendar/ModelAbsencePanel";
import VoiceAssignments from "../Voice/Model/VoiceAssignments";
import SmartCaptionGenerator from "../../components/caption/SmartCaptionGenerator.jsx";

export default function ModelDashboard() {
  const user = JSON.parse(localStorage.getItem("auth"))?.user;
  const token = JSON.parse(localStorage.getItem("auth"))?.token;
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const [activeTab, setActiveTab] = useState("Messenger");
  const [groupList, setGroupList] = useState([]);
  const [topicsMap, setTopicsMap] = useState({});
  const [agencyInfo, setAgencyInfo] = useState("");
  const [agencyStatus, setAgencyStatus] = useState({
    isOnline: null,
    isTyping: null,
    lastOnline: null,
  });
  const [selectedChat, setSelectedChat] = useState(null);
  const [showAbsencesTab, setShowAbsencesTab] = useState(false);

  // Additional state from second file
  const [models, setModels] = useState([]);
  const [isAddModalOpen, setIsAddModelOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showLyraDropdown, setShowLyraDropdown] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const handleTyping = useTypingIndicator(socket, user._id);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  //new states for reward system
  const [allRewards, setRewards] = useState(null);

  useEffect(() => {
    fetchAllRewards();
  }, []);

  const fetchAllRewards = async () => {
    try {
      const response = await axios.get(`${baseURL}/rewards/my-rewards`, {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ Required for protected routes
        },
      });

      console.log("Rewards fetched:", response.data);
      const fetchedRewards = response.data.data.rewards;
      const rewardsWithMockData = {
        ...fetchedRewards,
        post_count: {
          totalPoints: 100,
          currentValue: 15,
          level: 2,
          badges: [
            {
              name: "First Post",
              icon: "📝",
              description: "Created your first post",
            },
          ],
        },
      };

      setRewards(rewardsWithMockData);
    } catch (error) {
      console.error("Failed to fetch rewards:", error);

      // ✅ Handle different error cases
      if (error.response?.status === 401) {
        console.error("Unauthorized - token may be expired");
        // Optionally redirect to login
      } else if (error.response?.status === 404) {
        console.error("Rewards endpoint not found");
      } else {
        console.error("Network or server error");
      }

      // ✅ Set empty state on error
      setRewards(null);
    }
  };

  // Check if we're on the questionnaires route
  const isQuestionnairesRoute = location.pathname === "/model/questionnaires";
  const logout = async () => {
    setIsLoggingOut(true);

    try {
      // ✅ Call backend logout endpoint
      const response = await axios.post(
        `${baseURL}/logout`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
          timeout: 5000,
        },
      );

      console.log(
        "Backend logout successful:",
        response.data?.message || "Logged out",
      );
    } catch (error) {
      console.error("Backend logout failed:", error);

      if (error.code === "ECONNABORTED") {
        console.log("Logout request timed out");
      } else if (error.response?.status === 401) {
        console.log("Already logged out on backend");
      } else {
        console.log("Network error during logout");
      }
    } finally {
      // ✅ Show loading for minimum 3 seconds
      setTimeout(() => {
        // Clear frontend data
        localStorage.removeItem("auth");
        localStorage.removeItem("token");
        localStorage.removeItem("tokenExpiry");

        // Clear Redux state
        dispatch(logoutAction());

        setIsLoggingOut(false);

        // Navigate to home page
        navigate("/");

        console.log("Frontend logout completed");
      }, 3000);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const fetchGroupsAndTopics = useCallback(async () => {
    try {
      const res = await axios.get(
        `${baseURL}/messages/group?modelId=${user._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setGroupList(res.data);

      const topicMap = {};
      for (const group of res.data) {
        const topicRes = await axios.get(
          `${baseURL}/topic/group/${group._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        topicMap[group._id] = topicRes.data;
      }
      setTopicsMap(topicMap);
    } catch (err) {
      console.error("❌ Failed to fetch groups/topics:", err);
    }
  }, [baseURL, user._id, token]);

  const fetchAgencyStatus = useCallback(async () => {
    socket.emit("fetch_isUserOnline", { userId: user.agencyId });
  }, [user.agencyId]);

  const fetchAgencyAvatar = useCallback(async () => {
    try {
      const res = await axios.get(
        `${baseURL}/messages/agency-to-model/${user.agencyId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setAgencyInfo(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch agency avatar:", err);
      return null;
    }
  }, [baseURL, user.agencyId, token]);

  const fetchAgencyModels = useCallback(async () => {
    try {
      const res = await axios.get(`${baseURL}/agency/agency-models`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.data.models;
    } catch (err) {
      console.error("Failed to fetch agency models:", err);
      return [];
    }
  }, [baseURL, token]);

  const handleSearchAgencyModels = useCallback(
    (query) => {
      setSearchQuery(query);

      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      const filtered = models.filter((model) => {
        const fullNameMatch = model.fullName
          .toLowerCase()
          .includes(query.toLowerCase());
        const usernameMatch = model.username
          .toLowerCase()
          .includes(query.toLowerCase());
        return fullNameMatch || usernameMatch;
      });

      setSearchResults(filtered);
    },
    [models],
  );

  const handleModelClick = (id) => {
    navigate(`/agency/model-view/${id}`);
    setIsSearchOpen(false);
  };

  const handleGlobalModelSearch = async (query) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await axios.get(`${baseURL}/agency/models?search=${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSearchResults(res.data);
    } catch (err) {
      console.error("Global model search failed:", err);
      setSearchResults([]);
    }
  };

  const handleAddModelToAgency = async () => {
    if (!selectedUser) return;

    try {
      const res = await axios.post(
        `${baseURL}/agency/add-model`,
        {
          modelId: selectedUser._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      alert(`✅ ${selectedUser.fullName} has been added to your agency`);
      setSelectedUser(null);
      setSearchQuery("");
      setSearchResults([]);
      setIsAddModelOpen(false);

      const updatedModels = await fetchAgencyModels();
      setModels(updatedModels);
    } catch (err) {
      console.error("Add to agency failed:", err);
      alert("❌ Failed to add model to agency");
    }
  };

  const openModal = () => {
    setIsAddModelOpen(true);
    setSearchQuery("");
    setSelectedUser(null);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setSearchQuery("");
    setSearchResults([]);
    setIsAddModelOpen(false);
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  useEffect(() => {
    socket.on("update_isUserOnline", (data) => {
      console.log("got agency astatus", data);
      if (data.userId != user.agencyId) return;

      const formattedLastOnline = formateTime(data.lastOnline);

      setAgencyStatus((prev) => ({
        ...prev,
        isOnline: data.status,
        lastOnline: formattedLastOnline,
      }));
    });

    socket.on("update_typing_status", (data) => {
      console.log("typing reached frontend");
      if (data.userId != user.agencyId) return;
      setAgencyStatus((prev) => ({ ...prev, isTyping: data.isTyping }));
    });

    fetchGroupsAndTopics();
    fetchAgencyStatus();
    fetchAgencyAvatar();

    const getModels = async () => {
      const data = await fetchAgencyModels();
      setModels(data);
    };
    getModels();

    return () => {
      socket.off("update_isUserOnline");
      socket.off("update_typing_status");
    };
  }, [
    fetchAgencyAvatar,
    fetchAgencyModels,
    fetchAgencyStatus,
    fetchGroupsAndTopics,
    user.agencyId,
  ]);

  useEffect(() => {
    handleSearchAgencyModels(searchQuery);
  }, [handleSearchAgencyModels, searchQuery]);

  // Reset activeTab when on questionnaires route
  useEffect(() => {
    if (isQuestionnairesRoute) {
      setActiveTab("");
    }
  }, [isQuestionnairesRoute]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedChat(null);

    // If we're on questionnaires route, navigate back to dashboard
    if (isQuestionnairesRoute) {
      navigate("/model/dashboard");
    }
  };

  return (
    <>
      {/* Unified Sidebar from second file */}
      <div className="fixed left-0 top-0 h-full w-20 bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex flex-col items-center py-6 space-y-4 shadow-xl border-r border-gray-200 dark:border-gray-800 z-30">
        <Tooltip text="Search">
          <Button
            variant="ghost"
            size="icon"
            className="mb-2 hover:bg-blue-600/20"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-5 w-5 text-blue-400" />
          </Button>
        </Tooltip>
        <Tooltip text="Add Model">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-green-600/20"
            onClick={openModal}
          >
            <Plus className="h-5 w-5 text-green-400" />
          </Button>
        </Tooltip>
        <div className="flex-1 space-y-4 mt-10">
          {models.map((model, index) => (
            <Tooltip key={model._id} text={model.fullName}>
              <div className="relative flex flex-col items-center">
                <Link to={`/agency/model-view/${model._id}`}>
                  <Avatar
                    src={model.profilePhoto}
                    alt={model.fullName}
                    fallback={`U${index + 1}`}
                    className="h-12 w-12 border-2 border-blue-600 shadow"
                  />
                </Link>
                {index === 3 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full"
                    color="red"
                  >
                    4
                  </Badge>
                )}
              </div>
            </Tooltip>
          ))}
        </div>
        <div className="space-y-4 mb-2">
          <Tooltip text="Help">
            <Link to="/support/faqs">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-yellow-600/20"
              >
                <HelpCircle className="h-5 w-5 text-yellow-400" />
              </Button>
            </Link>
          </Tooltip>
          <Tooltip text="Settings">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-gray-600/20"
              onClick={() => setShowMenu(!showMenu)}
            >
              <Settings className="h-5 w-5 text-gray-400" />
            </Button>
          </Tooltip>
        </div>
        {showMenu && (
          <div className="absolute bottom-20 left-20 w-36 bg-white text-gray-900 rounded-xl shadow-lg z-50 border border-gray-200 animate-fade-in overflow-hidden">
            <button
              onClick={logout}
              disabled={isLoggingOut}
              className={`flex items-center justify-center w-full px-4 py-3 mt-8 rounded-xl font-semibold shadow transition-colors ${
                isLoggingOut
                  ? "bg-red-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isLoggingOut ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="w-5 h-5 mr-2" /> Logout
                </>
              )}
            </button>
            <button
              onClick={() => setShowMenu(false)}
              className="block w-full text-left px-4 py-3 hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Main Dashboard Content */}
      <div
        className="h-screen overflow-hidden bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white"
        style={{ paddingLeft: "80px" }}
      >
        <div className="flex w-full h-full">
          {/* Unified Sidebar for Model Dashboard */}
          <aside className="w-64 h-full overflow-y-auto bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-lg p-6 flex flex-col justify-between">
            <div className="">
              <h1 className="text-2xl font-bold mb-8 tracking-tight text-gray-900 dark:text-white">
                Model Dashboard
              </h1>
              <nav className="space-y-2">
                <button
                  onClick={() => handleTabChange("Messenger")}
                  className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${
                    activeTab === "Messenger"
                      ? "bg-blue-600 text-white shadow"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <MessageSquare className="w-5 h-5 mr-3" /> Messenger
                </button>

                <button
                  onClick={() => handleTabChange("Rewards")}
                  className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${
                    activeTab === "Rewards"
                      ? "bg-blue-600 text-white shadow"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <Trophy className="w-5 h-5 mr-3" /> Your Achievements
                </button>
                <button
                  onClick={() => handleTabChange("Billing & Finance")}
                  className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${
                    activeTab === "Billing & Finance"
                      ? "bg-blue-600 text-white shadow"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <Calendar className="w-5 h-5 mr-3" /> Billing & Finance
                </button>
                <button
                  onClick={() => handleTabChange("Tasks")}
                  className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${
                    activeTab === "Tasks"
                      ? "bg-blue-600 text-white shadow"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <CalendarCheck className="w-5 h-5 mr-3" /> Tasks
                </button>
                <button
                  onClick={() => handleTabChange("Traffic & Analytics")}
                  className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${
                    activeTab === "Traffic & Analytics"
                      ? "bg-blue-600 text-white shadow"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <TrendingUp className="w-5 h-5 mr-3" /> Traffic & Analytics
                </button>
                <div className="relative">
                  <button
                    onClick={() => {
                      handleTabChange("Events");
                      setExpandedMenu(
                        expandedMenu === "Calendar" ? null : "Calendar",
                      );
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-colors ${
                      activeTab === "Events" || activeTab === "Absences"
                        ? "bg-blue-600 text-white shadow"
                        : "hover:bg-gray-800 text-gray-300"
                    }`}
                  >
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 mr-3" /> Calendar
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        expandedMenu === "Calendar"
                          ? "transform rotate-180"
                          : ""
                      }`}
                    />
                  </button>
                  {expandedMenu === "Calendar" && (
                    <div className="pl-6 mt-1 space-y-1">
                      <button
                        onClick={() => handleTabChange("Events")}
                        className={`w-full flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === "Events"
                            ? "bg-blue-500/40 text-white"
                            : "hover:bg-gray-700 text-gray-300"
                        }`}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Your Events
                      </button>
                      <button
                        onClick={() => handleTabChange("Absences")}
                        className={`w-full flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === "Absences"
                            ? "bg-blue-500/40 text-white"
                            : "hover:bg-gray-700 text-gray-300"
                        }`}
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Your Absences
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleTabChange("uploadcontent")}
                  className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${
                    activeTab === "uploadcontent"
                      ? "bg-blue-600 text-white shadow"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <Upload className="w-5 h-5 mr-3" />
                  Upload Content
                </button>
                <button
                  onClick={() => {
                    setActiveTab(""); // Clear active tab when navigating to questionnaires
                    navigate("/model/questionnaires");
                  }}
                  className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${
                    isQuestionnairesRoute
                      ? "bg-blue-600 text-white shadow"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <FileText className="w-5 h-5 mr-3" /> Questionnaires
                </button>
                <button
                  onClick={() => handleTabChange("Voice Assignments")}
                  className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${
                    activeTab === "Voice Assignments"
                      ? "bg-blue-600 text-white shadow"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <Mic className="w-5 h-5 mr-3" /> Voice Assignments
                </button>

                {/* Lyra AI Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowLyraDropdown(!showLyraDropdown)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-colors ${
                      activeTab === "Smart Caption Generator"
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center">
                      <Sparkles className="w-5 h-5 mr-3" />
                      <span>Lyra AI</span>
                    </div>
                    {showLyraDropdown ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {showLyraDropdown && (
                    <div className="mt-2 ml-4 space-y-1">
                      <button
                        onClick={() => {
                          handleTabChange("Smart Caption Generator");
                          setShowLyraDropdown(false);
                        }}
                        className={`w-full flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === "Smart Caption Generator"
                            ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Smart Caption Generator
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleTabChange("MyProfile")}
                  className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${
                    activeTab === "MyProfile"
                      ? "bg-blue-600 text-white shadow"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <CircleUser className="w-5 h-5 mr-3" /> MyProfile
                </button>
                <button
                  onClick={() => handleTabChange("My Support Team")}
                  className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${
                    activeTab === "My Support Team"
                      ? "bg-blue-600 text-white shadow"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <Settings className="w-5 h-5 mr-3" /> My Support Team
                </button>
                <button
                  onClick={() => handleTabChange("Settings")}
                  className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${
                    activeTab === "Settings"
                      ? "bg-blue-600 text-white shadow"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <Settings className="w-5 h-5 mr-3" /> Settings
                </button>
                <button
                  onClick={logout}
                  disabled={isLoggingOut}
                  className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-colors mt-4 ${
                    isLoggingOut
                      ? "bg-red-400 cursor-not-allowed text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  {isLoggingOut ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"></div>
                      Logging out...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-5 h-5 mr-3" />
                      Logout
                    </>
                  )}
                </button>
              </nav>
            </div>
            {showMenu && (
              <div className="absolute bottom-20 left-20 w-36 bg-white text-gray-900 rounded-xl shadow-lg z-50 border border-gray-200 animate-fade-in overflow-hidden">
                <button
                  onClick={logout}
                  disabled={isLoggingOut}
                  className={`block w-full text-left px-4 py-3 font-medium border-b border-gray-200 transition-colors ${
                    isLoggingOut
                      ? "bg-gray-100 cursor-not-allowed text-gray-400"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </button>
                <button
                  onClick={() => setShowMenu(false)}
                  className="block w-full text-left px-4 py-3 hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            )}
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 h-full overflow-y-auto">
            {isQuestionnairesRoute ? (
              <AssignedQuestionnaires
                key={location.pathname + location.search} // Force remount when URL changes
                modelId={user._id}
                onStartQuestionnaire={(assignment) => {
                  // Navigate to questionnaire form
                  navigate(`/model/questionnaire/${assignment._id}`);
                }}
              />
            ) : activeTab === "Messenger" ? (
              <ModelMessanger />
            ) : activeTab === "Rewards" ? (
              /* ✅ ADD REWARDS TAB CONTENT HERE */
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                  Rewards & Achievements
                </h2>
                {allRewards ? (
                  <RewardWidget
                    allRewards={allRewards}
                    onViewAllRewards={() => {
                      // Could navigate to a detailed rewards page later
                      setActiveTab("Rewards-Detailed");
                      console.log("View all rewards clicked");
                    }}
                  />
                ) : (
                  <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                    <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      Loading Rewards...
                    </h3>
                    <p className="text-gray-500">
                      Fetching your achievement data...
                    </p>
                  </div>
                )}
              </div>
            ) : activeTab === "Rewards-Detailed" ? (
              // ✅ ADD DETAILED REWARDS VIEW
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Detailed Achievements
                  </h2>
                  <button
                    onClick={() => setActiveTab("Rewards")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ← Back to Summary
                  </button>
                </div>

                {allRewards ? (
                  <div className="space-y-6">
                    {/* Render each reward type in detail */}
                    {Object.entries(allRewards).map(
                      ([rewardType, rewardData]) => (
                        <DetailedRewardCard
                          key={rewardType}
                          rewardType={rewardType}
                          rewardData={rewardData}
                        />
                      ),
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    No detailed rewards data available
                  </div>
                )}
              </div>
            ) : activeTab === "Tasks" ? (
              <BoardsView modelId={user._id} />
            ) : activeTab === "Traffic & Analytics" ? (
              <InstagramDashboard Id={user._id} role={user.role} />
            ) : activeTab === "Events" ? (
              <CalendarView modelId={user._id} />
            ) : activeTab === "Absences" ? (
              <ModelAbsencePanel ModelId={user._id} role="model" />
            ) : // <ModelCalender modelId={user._id} isModel={true} />
            activeTab === "uploadcontent" ? (
              <div>
                <ContentUpload modelId={user._id} isModel={true} />
              </div>
            ) : activeTab === "MyProfile" ? (
              <MyProfile modelId={user._id} isModel={true} />
            ) : activeTab === "My Support Team" ? (
              <Supportteam />
            ) : activeTab === "Voice Assignments" ? (
              <VoiceAssignments />
            ) : activeTab === "Smart Caption Generator" ? (
              <SmartCaptionGenerator />
            ) : activeTab === "Settings" ? (
              <Settings modelId={user._id} isModel={true} />
            ) : activeTab === "Billing & Finance" ? (
              <ModelBilling modelId={user._id} isModel={true} />
            ) : (
              <div className="space-y-6">
                <div className="text-gray-400 text-xl font-medium">
                  Coming Soon: {activeTab}
                </div>

                {allRewards && activeTab !== "Rewards" && (
                  <div className="bg-white rounded-lg shadow p-4">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">
                      Quick Stats
                    </h4>
                    <div className="flex space-x-4 text-sm">
                      <span className="text-blue-600">
                        🏆{" "}
                        {Object.values(allRewards).reduce(
                          (sum, r) => sum + (r.badges?.length || 0),
                          0,
                        )}{" "}
                        badges
                      </span>
                      <span className="text-green-600">
                        ⭐{" "}
                        {Object.values(allRewards).reduce(
                          (sum, r) => sum + (r.totalPoints || 0),
                          0,
                        )}{" "}
                        points
                      </span>
                      <button
                        onClick={() => handleTabChange("Rewards")}
                        className="text-purple-600 hover:underline"
                      >
                        View all →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
      {isLoggingOut && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 w-full max-w-md border border-gray-600 shadow-2xl text-center">
            <div className="flex flex-col items-center space-y-6">
              {/* ✅ Animated Logout Icon */}
              <div className="relative">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
                  <LogOut size={40} className="text-red-400" />
                </div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-red-400 border-r-red-400 rounded-full animate-spin"></div>
                {/* ✅ Outer Ring */}
                <div
                  className="absolute -inset-2 w-24 h-24 border-2 border-transparent border-t-red-300/30 rounded-full animate-spin"
                  style={{
                    animationDirection: "reverse",
                    animationDuration: "3s",
                  }}
                ></div>
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

              {/* ✅ Animated Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-500 via-red-400 to-red-300 rounded-full animate-pulse transition-all duration-1000"></div>
              </div>

              {/* ✅ Floating Particles Effect */}
              <div className="relative w-full h-8 overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-2 bg-red-400 rounded-full animate-ping"></div>
                <div
                  className="absolute top-2 right-4 w-1 h-1 bg-red-300 rounded-full animate-ping"
                  style={{ animationDelay: "0.5s" }}
                ></div>
                <div
                  className="absolute bottom-0 left-1/3 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"
                  style={{ animationDelay: "1s" }}
                ></div>
                <div
                  className="absolute top-1 right-1/4 w-1 h-1 bg-red-200 rounded-full animate-ping"
                  style={{ animationDelay: "1.5s" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal Overlay */}
      <Modal open={isSearchOpen} onClose={closeSearch}>
        <div className="flex justify-end p-4 pb-2">
          <Button variant="ghost" size="icon" onClick={closeSearch}>
            <X size={18} />
          </Button>
        </div>
        <div className="px-6 pb-6">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search models and users..."
            autoFocus
          />
          <div className="mb-4 max-h-64 overflow-y-auto">
            {searchResults.length > 0 ? (
              <div className="space-y-1">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    onClick={() => handleModelClick(result._id)}
                    className="flex items-center p-3 rounded-lg cursor-pointer transition-colors hover:bg-blue-600/30 group"
                  >
                    <Avatar
                      src={result.profilePhoto}
                      alt={result.fullName}
                      fallback={result.fullName?.[0] || "U"}
                      className="w-10 h-10 mr-3 border-2 border-blue-600 shadow"
                    />
                    <div className="flex-1">
                      <span className="text-white font-medium block">
                        {result.fullName}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="text-gray-400 text-center py-8">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No results found for "{searchQuery}"</p>
              </div>
            ) : (
              <div className="text-gray-400 text-center py-8">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Start typing to search models and users</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Add Model Modal Overlay */}
      <Modal open={isAddModalOpen} onClose={closeModal}>
        <div className="flex justify-end p-4 pb-2">
          <Button variant="ghost" size="icon" onClick={closeModal}>
            <X size={18} />
          </Button>
        </div>
        <div className="px-6 pb-6">
          <SearchInput
            value={searchQuery}
            onChange={(e) => handleGlobalModelSearch(e.target.value)}
            placeholder="Search for models..."
          />
          <div className="mb-6 max-h-48 overflow-y-auto">
            {searchResults.map((user) => (
              <div
                key={user._id}
                onClick={() => setSelectedUser(user)}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedUser?._id === user._id
                    ? "bg-blue-600/80"
                    : "hover:bg-blue-600/30"
                }`}
              >
                <Avatar
                  src={user.profilePhoto}
                  alt={user.fullName}
                  fallback={user.fullName?.[0] || "U"}
                  className="w-10 h-10 mr-3 border-2 border-blue-600 shadow"
                />
                <span className="text-white font-medium">{user.fullName}</span>
              </div>
            ))}
            {searchResults.length === 0 && (
              <div className="text-gray-400 text-center py-4">
                No users found
              </div>
            )}
          </div>
          <Button
            onClick={handleAddModelToAgency}
            disabled={!selectedUser}
            className="w-full py-3 mt-2"
          >
            Add Model
          </Button>
        </div>
      </Modal>
    </>
  );
}
