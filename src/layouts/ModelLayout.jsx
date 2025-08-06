// /layouts/ModelLayout.jsx
import { Outlet } from "react-router-dom";
import socket from "../utils/socket";
import { useEffect, useCallback } from "react";
import SocketEventsListener from "../utils/socketListeners";
import { useDispatch } from "react-redux";
import axios from "axios";
import { setAllDmCoversations } from "../globalstate/dmSlice.jsx";

const ModelLayout = () => {
  const user = JSON.parse(localStorage.getItem("auth"))?.user;
  const dispatch = useDispatch();
  const token = JSON.parse(localStorage.getItem("auth"))?.token;

  console.log(user._id, "thissssssssssssssss");

  const getAllDmconversations = useCallback(async () => {
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
  }, [token, dispatch]);

  const fetchAllUsersStatus = useCallback(
    (dmconversations) => {
      const userIds = [];
      dmconversations.forEach((c) => {
        c.members.forEach((m) => {
          if (m.userId !== user._id) {
            userIds.push(m.userId);
          }
        });
      });

      socket.emit("fetch_user_status", userIds);
    },
    [user._id],
  );

  useEffect(() => {
    getAllDmconversations();
  }, [token, getAllDmconversations]);

  useEffect(() => {
    if (user?._id) {
      socket.emit("register", { userId: user._id });
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-white overflow-y-auto">
      {user._id && <SocketEventsListener />}

      {/* Optional: Add model-specific navbar */}
      <div className="h-full">
        <Outlet />
      </div>
    </div>
  );
};

export default ModelLayout;
