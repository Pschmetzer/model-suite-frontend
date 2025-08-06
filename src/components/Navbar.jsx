import { Bell, Moon, Sun } from "lucide-react";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, Badge, Button, Tooltip } from "./ui";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "../context/ThemeContext";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { logout } from "../globalstate/authSlice";

const Navbar = () => {
  const userInfo = JSON.parse(localStorage.getItem("auth"))?.user;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showMenu, setShowMenu] = useState(false);
  const [profileData, setProfileData] = useState(null);

  // Fetch profile data for models to get the latest avatar_url
  useEffect(() => {
    const fetchProfileData = async () => {
      if (userInfo?.role === "model") {
        try {
          const token = JSON.parse(localStorage.getItem("auth"))?.token;
          const baseURL = import.meta.env.VITE_API_BASE_URL;
          const res = await fetch(`${baseURL}/profile/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setProfileData(data);
          }
        } catch (error) {
          console.error("Error fetching profile data:", error);
        }
      }
    };

    fetchProfileData();
  }, [userInfo?.role]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <header
      className={`w-full z-20 flex items-center justify-between px-8 py-2 bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-white shadow border-b border-gray-200 dark:border-gray-800`}
    >
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
          <span className="text-white font-bold text-lg tracking-wide">MS</span>
        </div>
        <Link to={"/agency/dashboard"}>
          <img
            className="object-contain h-12"
            src="/AgencyDashboardLogo.webp"
            alt="Agency Dashboard Logo"
          ></img>
        </Link>
      </div>
      <div className="flex-1 flex justify-center hidden md:flex">
        {/* Centered search bar placeholder for future use */}
      </div>
      <div className="flex items-center space-x-3 md:space-x-6 relative">
        <Tooltip text="Notifications">
          <div className="relative cursor-pointer">
            <Bell className="h-6 w-6 text-gray-400 hover:text-blue-400 transition-colors duration-200" />
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full"
              color="red"
            >
              2
            </Badge>
          </div>
        </Tooltip>
        <div
          className="flex items-center space-x-2 cursor-pointer group"
          onClick={() => setShowMenu(!showMenu)}
        >
          <div className="text-right">
            <p className="text-sm font-semibold leading-tight dark:text-white text-gray-600">
              {userInfo?.agencyName}
            </p>
            <p className="text-xs text-gray-400 leading-tight">
              Agency Manager
            </p>
          </div>
          <Avatar
            src={
              userInfo?.role === "model"
                ? profileData?.avatar_url || userInfo?.avatar_url
                : userInfo?.profilePhoto
            }
            alt={
              userInfo?.role === "model"
                ? userInfo?.display_name || userInfo?.fullName
                : userInfo?.agencyName
            }
            fallback={
              userInfo?.role === "model"
                ? userInfo?.display_name?.[0] || userInfo?.fullName?.[0] || "M"
                : "AM"
            }
            className="h-8 w-8 md:h-10 md:w-10"
          />
        </div>
        <ThemeToggle />
        {showMenu && (
          <div className="absolute right-0 top-14 mt-2 w-44 bg-white text-gray-900 rounded-xl shadow-lg z-50 border border-gray-200 animate-fade-in overflow-hidden">
            <button
              onClick={() =>
                navigate(`/agency/dashboard/profile/${userInfo.agencyName}`)
              }
              className="block w-full text-left px-4 py-3 hover:bg-gray-100 font-medium border-b border-gray-200"
            >
              Profile
            </button>
            <button
              onClick={() => navigate("/agency/dashboard/profile/settings")}
              className="block w-full text-left px-4 py-3 hover:bg-gray-100 font-medium border-b border-gray-200"
            >
              Setting
            </button>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-3 hover:bg-gray-100 font-medium border-b border-gray-200"
            >
              Logout
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
    </header>
  );
};

export default Navbar;
