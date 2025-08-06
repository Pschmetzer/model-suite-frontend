/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { usePermissions } from "../../hooks/usePermissions";
import {
  MessageSquare,
  UploadCloud,
  Flame,
  ShieldAlert,
  Users,
  Gift,
  Trophy,
  Film,
  Calendar,
  TrendingUp,
  Plus,
  Trash2,
  Settings,
  EarthLock,
  ChartNoAxesColumn,
  CalendarCheck,
  UserPen,
  User,
  MessageCircleQuestion,
  Ban,
  Settings2,
  MessageSquareDiffIcon,
} from "lucide-react";
// import ChatWindow from "../../components/ChatWindow";
// import TaskList from "../../components/task/TaskList";
import BillingDashboard from "../../components/Billing/Billing";
// import { GiProtectionGlasses } from "react-icons/gi";
// import TypingIndicator from "../../components/ui/TypingIndicator";
import AgencyMessanger from "../../components/agencyMessanger";
import BoardsView from "../../components/task/board/BoardsView";
import CalendarView from "../../components/Calendar/Calendar";
import ModelAbsencePanel from "../../components/Calendar/ModelAbsencePanel";

import Agencyform from "../../components/supportteam/agency/Agencyform";
export default function CreatorInsightsDashboard() {
  const { id } = useParams();
  const user = JSON.parse(localStorage.getItem("auth"))?.user;
  const token = JSON.parse(localStorage.getItem("auth"))?.token;
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const { hasPermission, hasFullAccess, isEmployee } = usePermissions();

  const allSidebarItems = [
    {
      icon: MessageSquare,
      label: "Messenger",
      active: true,
      permission: "messages.view",
    },
    {
      icon: MessageSquareDiffIcon,
      label: "Support Contact Manager",
      permission: "support_team.view",
    },
    {
      icon: Calendar,
      label: "Calendar",
      permission: "calendar.view",
      subMenu: [
        {
          label: "Events",
          icon: Calendar,
          id: "Events",
          permission: "calendar.view",
        },
        {
          label: "Absences",
          icon: Ban,
          id: "Absences",
          permission: "calendar.view",
        },
      ],
    },
    { icon: CalendarCheck, label: "Tasks", permission: "tasks.view" },
    {
      icon: TrendingUp,
      label: "Traffic & Analytics",
      permission: "performance.view",
    },
    {
      icon: UploadCloud,
      label: "Postings & Content Upload",
      permission: "uploads.view",
    },
    {
      icon: ChartNoAxesColumn,
      label: "Viral Trends & Inspiration",
      permission: "viral_trends.view",
    },
    { icon: User, label: "Team Members", permission: "employee.view" },
    {
      icon: ShieldAlert,
      label: "Leak Protection",
      permission: "security.view",
    },
    { icon: Calendar, label: "Billing & Finance", permission: "earnings.view" },
    { icon: Gift, label: "Paid Platforms", permission: "platform.view" },
    {
      icon: Trophy,
      label: "Rewards & Gamification",
      permission: "rewards.view",
    },
    { icon: Flame, label: "Content Library", permission: "content.view" },
    { icon: Users, label: "Fan Management", permission: "fan.view" },
    {
      icon: MessageCircleQuestion,
      label: "Support & Help",
      permission: "support.view",
    },
  ];

  // Filter sidebar items based on permissions
  const getFilteredSidebarItems = () => {
    if (hasFullAccess) {
      return allSidebarItems;
    }

    return allSidebarItems.filter((item) => {
      // Check main item permission
      const hasMainPermission =
        !item.permission || hasPermission(item.permission);

      if (!hasMainPermission) {
        return false;
      }

      // If item has submenu, filter submenu items
      if (item.subMenu) {
        const filteredSubMenu = item.subMenu.filter(
          (subItem) => !subItem.permission || hasPermission(subItem.permission),
        );

        // Only show parent if it has accessible submenu items
        if (filteredSubMenu.length > 0) {
          item.subMenu = filteredSubMenu;
          return true;
        }
        return false;
      }

      return true;
    });
  };

  const [sidebarItems, setSidebarItems] = useState([]);

  const [modelInfo, setModelInfo] = useState({});
  const [selectedChat, setSelectedChat] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [groupList, setGroupList] = useState([]);
  const [topicsMap, setTopicsMap] = useState({});
  const [newTopic, setNewTopic] = useState("");
  const [activeGroupForTopic, setActiveGroupForTopic] = useState(null);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [selectedSubMenu, setSelectedSubMenu] = useState("Your Events"); // Default to Events

  const activeMenu = sidebarItems.find((item) => item.active)?.label;

  const handleTabClick = (label) => {
    // Check if the clicked item has a submenu
    const clickedItem = sidebarItems.find((item) => item.label === label);

    if (clickedItem?.subMenu) {
      // If the item has a submenu, toggle the expanded state
      if (expandedMenu === label) {
        setExpandedMenu(null);
      } else {
        setExpandedMenu(label);
        // If newly expanded, set the selected submenu to the first item
        if (clickedItem.subMenu.length > 0) {
          setSelectedSubMenu(clickedItem.subMenu[0].id);
        }
      }
    } else {
      // If no submenu, collapse any expanded menu
      setExpandedMenu(null);
    }

    const updatedItems = sidebarItems.map((item) => ({
      ...item,
      active: item.label === label,
    }));
    setSidebarItems(updatedItems);
    setSelectedChat(null);
  };

  const fetchModel = async () => {
    try {
      const res = await axios.get(`${baseURL}/model/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setModelInfo(res.data);
    } catch (err) {
      console.error("Failed to fetch model:", err);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await axios.get(`${baseURL}/messages/group?modelId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroupList(res.data);

      const topicsObj = {};
      for (const group of res.data) {
        const topicRes = await axios.get(
          `${baseURL}/topic/group/${group._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        topicsObj[group._id] = topicRes.data;
      }
      setTopicsMap(topicsObj);
    } catch (err) {
      console.error("Failed to fetch groups/topics:", err);
    }
  };

  // const handleCreateGroup = async () => {
  //   if (!groupName.trim()) return;
  //   try {
  //     await axios.post(
  //       `${baseURL}/messages/group/create`,
  //       {
  //         title: groupName,
  //         modelId: id,
  //         creatorModel: "Agency",
  //       },
  //       { headers: { Authorization: `Bearer ${token}` } }
  //     );
  //     setGroupName("");
  //     fetchGroups();
  //   } catch (err) {
  //     console.error("Failed to create group:", err);
  //   }
  // };

  // const handleCreateTopic = async (groupId) => {
  //   if (!newTopic.trim()) return;
  //   try {
  //     await axios.post(
  //       `${baseURL}/topic/create`,
  //       {
  //         title: newTopic,
  //         groupId,
  //       },
  //       { headers: { Authorization: `Bearer ${token}` } }
  //     );
  //     setNewTopic("");
  //     setActiveGroupForTopic(null);
  //     fetchGroups();
  //   } catch (err) {
  //     console.error("Failed to create topic:", err);
  //   }
  // };

  // const handleDeleteTopic = async (topicId) => {
  //   if (!confirm("Are you sure you want to delete this topic?")) return;
  //   try {
  //     await axios.delete(`${baseURL}/api/v1/topic/${topicId}`, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
  //     fetchGroups();
  //   } catch (err) {
  //     console.error("Failed to delete topic:", err);
  //   }
  // };

  // const handleDeleteGroup = async (groupId) => {
  //   if (!confirm("Are you sure you want to delete this group?")) return;
  //   try {
  //     await axios.delete(`${baseURL}/messages/group/${groupId}`, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
  //     fetchGroups();
  //     setSelectedChat(null);
  //   } catch (err) {
  //     console.error("Failed to delete group:", err);
  //   }
  // };

  useEffect(() => {
    fetchModel();
    fetchGroups();
  }, [id]);

  // Update sidebar items when permissions change
  useEffect(() => {
    const filteredItems = getFilteredSidebarItems();
    setSidebarItems(filteredItems);
  }, [hasFullAccess, isEmployee]);

  return (
    <div className="flex h-[100%] bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-200">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-colors duration-200">
        <div className="p-6">
          <div
            onClick={() => {
              const reset = sidebarItems.map((item) => ({
                ...item,
                active: false,
              }));
              setSidebarItems(reset);
              setSelectedChat(null);
            }}
            className="cursor-pointer"
          >
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 shadow flex items-center gap-3 transition-colors duration-200">
              <img
                className="w-10 h-10 rounded-full object-cover border-2 border-blue-600"
                alt="AM"
                src={modelInfo.profilePhoto}
              />
              <div>
                <span className="font-semibold text-lg block">
                  {modelInfo.fullName || "Loading..."}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Model
                </span>
              </div>
            </div>
          </div>
          <div className="border-b border-gray-800 my-4"></div>
        </div>
        <nav className="flex-1 overflow-y-auto px-6 pb-6">
          {sidebarItems.map((item, index) => (
            <div key={index}>
              <div
                onClick={() => handleTabClick(item.label)}
                tabIndex={0}
                role="button"
                aria-selected={item.active}
                className={`flex gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-150 font-medium text-base items-center select-none outline-none focus:ring-2 focus:ring-blue-400 ${
                  item.active
                    ? "bg-blue-600 shadow text-white border-l-4 border-blue-300"
                    : "hover:bg-gray-800 text-gray-300"
                } overflow-hidden mb-1`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate block max-w-[140px] overflow-hidden text-ellipsis">
                  {item.label}
                </span>
                {item.subMenu && (
                  <div
                    className={`ml-auto transform transition-transform ${expandedMenu === item.label ? "rotate-180" : ""}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                )}
              </div>

              {/* Submenu items */}
              {item.subMenu && expandedMenu === item.label && (
                <div className="pl-6 mt-1 space-y-1 overflow-hidden">
                  {item.subMenu.map((subItem, subIndex) => (
                    <div
                      key={subIndex}
                      onClick={() => {
                        setSelectedSubMenu(subItem.id);
                        // Keep the parent menu active
                        const updatedItems = sidebarItems.map((menuItem) => ({
                          ...menuItem,
                          active: menuItem.label === item.label,
                        }));
                        setSidebarItems(updatedItems);
                      }}
                      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                        selectedSubMenu === subItem.id
                          ? "bg-blue-500/40 text-white"
                          : "hover:bg-gray-700 text-gray-300"
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
                      {subItem.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeMenu === "Tasks" ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
            <BoardsView modelId={id} />
          </div>
        ) : activeMenu === "Messenger" ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <AgencyMessanger/>
          </div>
        ) : activeMenu === "Traffic & Analytics" ? (
          <div className="flex-1 overflow-y-auto">
              <span>under construction</span>
          </div>
        ) : activeMenu === "Viral Trends & Inspiration" ? (
          <div className="flex-1 overflow-y-auto">
            <span>under construction</span>
          </div>
        ) : activeMenu === "Billing & Finance" ? (
          <div className="flex-1 overflow-y-auto">
            <BillingDashboard modelInfo={modelInfo} />
          </div>
        ) : activeMenu === "Calendar" ? (
          <div className="flex-1 overflow-y-auto">
            {selectedSubMenu === "Events" ? (
              <CalendarView modelId={id} />
            ) : (
              <ModelAbsencePanel ModelId={id} role="agency" />
            )}
          </div>
        ) : activeMenu === "Support Contact Manager" ? (
          <div className="flex-1 overflow-y-auto">
            <Agencyform />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                Creator Insights Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Select a menu item to begin.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
