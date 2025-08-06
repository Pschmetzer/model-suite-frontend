import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../pages/Sidebar/Sidebar";
import Navbar from "../components/Navbar";
import socket from "../utils/socket";
import { useEffect, useState } from "react";
import SocketEventsListener from "../utils/socketListeners";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { setAllDmCoversations } from "../globalstate/dmSlice";
import { logout } from "../globalstate/authSlice";
import AgencyMenu from "../components/AgencyMenu";

const Layout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useSelector((state) => state.auth);
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/agency/login");
  };

  const getAllDmconversations = async () => {
    const baseURL = import.meta.env.VITE_API_BASE_URL;

    try {
      const res = await axios.get(
        `${baseURL}/messanger/dm/getAllDmconversations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      console.log(res.data);
      dispatch(setAllDmCoversations(res.data));
      fetchAllUsersStatus(res.data);
    } catch (err) {
      console.error("failed to fetch all dm conversations", err);
    }
  };

  const fetchAllUsersStatus = (dmconversations) => {
    const userIds = [];
    dmconversations.forEach((c) => {
      c.members.forEach((m) => {
        if (m.userId !== user._id) {
          userIds.push(m.userId);
        }
      });
    });

    socket.emit("fetch_user_status", userIds);
  };

  useEffect(() => {
    getAllDmconversations();
  }, [token]);

  useEffect(() => {
    if (user?._id) {
      socket.emit("register", { userId: user._id });
    }
  }, [user]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-950 to-gray-900">
      {user._id && <SocketEventsListener />}
      {/* Sidebar */}
      <div className="w-20 shrink-0">
        <Sidebar setShowMenu={setShowMenu} showMenu={showMenu} />
      </div>

      {/* AgencyMenu */}
      <div className="shrink-0 border-l border-gray-800">
        <AgencyMenu />
      </div>

      {/* Main content: Navbar + Outlet */}
      <div className="flex flex-col flex-grow overflow-hidden">
        <Navbar />
        <main className="flex-grow overflow-y-auto scrollBar">
          <Outlet />
        </main>
      </div>

      {/* Floating Menu */}
      {showMenu && (
        <div className="fixed bottom-20 left-20 w-36 bg-white text-gray-900 rounded-xl shadow-lg border border-gray-200 z-[9999] animate-fade-in overflow-hidden">
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
  );
};

export default Layout;
