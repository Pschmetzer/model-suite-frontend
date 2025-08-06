/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import AddModelModal from "./ui/AddModelModal";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchModels } from "../globalstate/modelsSlice.jsx";
import { usePermissions } from "../hooks/usePermissions";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileSignature,
  FileText,
  MessageCircle,
  BarChart2,
  Settings,
  Menu,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  LogOut,
  X,
  MessageCircleDashedIcon,
  Popsicle,
  Target,
  Mic,
  Sparkles,
} from "lucide-react";

export default function Sidebar({ className = "" }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const openModal = () => {
    setIsAddModalOpen(true);
    setSearchQuery("");
    setSelectedUser(null);
  };
  const closeModal = () => {
    setSelectedUser(null);
    setSearchQuery("");
    setSearchResults([]);
    setIsAddModalOpen(false);
  };

  const handleGlobalModelSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem("auth"))?.token;
      if (!token) {
        throw new Error("No authentication token found");
      }
      const response = await axios.get(`${baseUrl}/agency/models`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: query },
      });
      setSearchResults(response.data);
    } catch (err) {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddModelToAgency = async (modelToAdd) => {
    if (!modelToAdd) return;
    setIsAddingModel(true);
    try {
      const token = JSON.parse(localStorage.getItem("auth"))?.token;
      if (!token) {
        throw new Error("Authentication token not found. Please log in.");
      }
      await axios.post(
        `${baseUrl}/agency/add-model`,
        { modelId: modelToAdd._id },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      closeModal();
      setToast({
        show: true,
        message: `✨ ${modelToAdd.fullName} has been added to your agency`,
        type: "success",
      });
      setTimeout(
        () => setToast({ show: false, message: "", type: "success" }),
        3000,
      );
      // Refresh models in Redux after successful add
      dispatch(fetchModels());
    } catch (err) {
      setToast({
        show: true,
        message: `Failed to add ${modelToAdd.fullName}: ${err.message}`,
        type: "error",
      });
    } finally {
      setIsAddingModel(false);
    }
  };

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const { hasPermission, hasFullAccess, isEmployee } = usePermissions();

  const allNavigation = [
    {
      name: "Dashboard",
      href: "/agency/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Models",
      icon: Users,
      permission: "model.view",
      children: [
        { name: "View All Models", href: "/models", permission: "model.view" },
        {
          name: "Add New Model",
          href: "/models/add",
          permission: "model.create",
        },
      ],
    },
    {
      name: "Team",
      href: "/agency/team",
      icon: Users,
      permission: "employee.view",
    },
    {
      name: "Skill Matrix",
      href: "/agency/skill-matrix",
      icon: Target,
    },
    {
      name: "Calendar",
      href: "/calendar/success",
      icon: CalendarDays,
      permission: "calendar.view",
    },
    {
      name: "Contracts",
      icon: FileSignature,
      permission: "contracts.view",
      children: [
        {
          name: "Active Contracts",
          href: "/contracts/active",
          permission: "contracts.view",
        },
        {
          name: "Pending Approvals",
          href: "/contracts/pending",
          permission: "contracts.manage",
        },
      ],
    },
    {
      name: "Invoices",
      icon: FileText,
      permission: "earnings.view",
      children: [
        {
          name: "Sent Invoices",
          href: "/invoices/sent",
          permission: "earnings.view",
        },
        {
          name: "Received Invoices",
          href: "/invoices/received",
          permission: "earnings.view",
        },
      ],
    },
    {
      name: "Messages",
      href: "/messages",
      icon: MessageCircle,
      permission: "messages.view",
    },
    {
      name: "Voice Content",
      href: "/agency/voice",
      icon: Mic,
    },
    {
      name: "Lyra AI",
      icon: Sparkles,
      children: [
        {
          name: "Smart Caption Generator",
          href: "/agency/caption-generator",
        },
        {
          name: "Persona Builder",
          href: "/agency/lyra/persona-builder",
        },
      ],
    },
    {
      name: "Support Contact Manager",
      href: "/support-contact-manager",
      icon: MessageCircleDashedIcon,
    },
    {
      name: "Insights",
      icon: BarChart2,
      permission: "performance.view",
      children: [
        {
          name: "Performance",
          href: "/insights/performance",
          permission: "performance.view",
        },
        {
          name: "Engagement",
          href: "/insights/engagement",
          permission: "performance.view",
        },
      ],
    },
  ];

  // Filter navigation items based on permissions
  const navigation = allNavigation
    .filter((item) => {
      // If user has full access (agency/model), show all items
      if (hasFullAccess) {
        return true;
      }

      // For employees, check permissions
      if (isEmployee) {
        // If no permission specified, show item (fallback)
        if (!item.permission) {
          return true;
        }

        const hasMainPermission = hasPermission(item.permission);

        // If item has children, check if user has access to any children
        if (item.children) {
          const accessibleChildren = item.children.filter(
            (child) => !child.permission || hasPermission(child.permission),
          );

          // Show parent if user has main permission OR has access to any children
          return hasMainPermission || accessibleChildren.length > 0;
        }

        return hasMainPermission;
      }

      // Default: show item if no specific employee restrictions
      return true;
    })
    .map((item) => {
      // Handle filtering of children for items that passed the main filter
      if (item.children && isEmployee) {
        const filteredChildren = item.children.filter(
          (child) => !child.permission || hasPermission(child.permission),
        );
        return { ...item, children: filteredChildren };
      }
      return item;
    });

  const toggleSubmenu = (itemName) => {
    if (isCollapsed) return;
    setOpenSubmenu(openSubmenu === itemName ? null : itemName);
  };

  const handleLogout = () => {
    // Handle logout logic here
    console.log("Logout clicked");
  };

  const dispatch = useDispatch();
  const {
    list: models,
    loading: isLoading,
    error,
  } = useSelector((state) => state.models);

  useEffect(() => {
    dispatch(fetchModels());
  }, [dispatch]);

  return (
    <>
      {/* Add Model Modal */}
      <AddModelModal
        open={isAddModalOpen}
        onClose={closeModal}
        onAdd={handleAddModelToAgency}
        onSearch={handleGlobalModelSearch}
        searchLoading={searchLoading}
        searchResults={searchResults}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-10 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-10 p-2 rounded-md bg-gray-900 text-white lg:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          width: isCollapsed ? "4rem" : "16rem",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`fixed left-0 top-0 z-10 h-full dark:bg-gray-900 bg-white dark:text-white text-gray-600 shadow-xl lg:relative lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${className}`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-[18px] border-b border-gray-800">
            <motion.div
              initial={false}
              animate={{ opacity: isCollapsed ? 0 : 1 }}
              transition={{ duration: 0.2 }}
              className="flex items-center space-x-2"
            >
              {!isCollapsed && (
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  ModelSuite
                </h1>
              )}
            </motion.div>

            {/* Close button for mobile */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-1 rounded-md hover:bg-gray-800 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Collapse button for desktop */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:block p-1 rounded-md dark:hover:bg-gray-800 hover:bg-gray-300/20 transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  {item.children ? (
                    <div>
                      <button
                        onClick={() => toggleSubmenu(item.name)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-gray-300/20 dark:hover:bg-gray-800 ${
                          openSubmenu === item.name
                            ? "dark:bg-gray-800 bg-gray-300/20"
                            : ""
                        }`}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          <motion.span
                            initial={false}
                            animate={{ opacity: isCollapsed ? 0 : 1 }}
                            transition={{ duration: 0.2 }}
                            className={isCollapsed ? "sr-only" : ""}
                          >
                            {item.name}
                          </motion.span>
                        </div>
                        {!isCollapsed && (
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              openSubmenu === item.name ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </button>

                      <AnimatePresence>
                        {openSubmenu === item.name && !isCollapsed && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-1 space-y-1 overflow-hidden"
                          >
                            {item.children.map((child) => (
                              <li key={child.name}>
                                {child.action === "openAddModelModal" ? (
                                  <button
                                    onClick={() => {
                                      // child.onClick();
                                      setIsMobileOpen(false);
                                      openModal();
                                    }}
                                    className="block w-full text-left px-3 py-2 ml-8 text-sm rounded-md transition-colors dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white hover:bg-gray-300/20 hover:text-gray-600 text-gray-600 font-medium"
                                  >
                                    {child.name}
                                  </button>
                                ) : (
                                  <NavLink
                                    to={child.href}
                                    className={({ isActive }) =>
                                      `block px-3 py-2 ml-8 text-sm rounded-md transition-colors ${
                                        isActive
                                          ? "dark:bg-blue-600 dark:text-white bg-gray-300/20 text-gray-600"
                                          : "dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white hover:bg-gray-300/20 hover:text-gray-600 text-gray-600 font-medium"
                                      }`
                                    }
                                    onClick={() => setIsMobileOpen(false)}
                                  >
                                    {child.name}
                                  </NavLink>
                                )}
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 px-3 py-2 dark:hover:bg-blue-600 hover:bg-gray-300/20 hover:text-gray-600 text-sm dark:text-white text-gray-600 font-medium rounded-md transition-colors ${
                          isActive
                            ? "dark:bg-blue-600 dark:text-white bg-gray-300/20 text-gray-600"
                            : "dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                        }`
                      }
                      title={isCollapsed ? item.name : undefined}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <motion.span
                        initial={false}
                        animate={{ opacity: isCollapsed ? 0 : 1 }}
                        transition={{ duration: 0.2 }}
                        className={isCollapsed ? "sr-only" : ""}
                      >
                        {item.name}
                      </motion.span>
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </motion.div>
    </>
  );
}
