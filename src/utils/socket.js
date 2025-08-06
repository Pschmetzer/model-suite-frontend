import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

// Create socket instance
const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: false, // Don't connect automatically
});

// temorary fix becuse initializeActivityTracking not working correctly
socket.connect();

// Function to initialize activity tracking
export const initializeActivityTracking = () => {
  const auth = JSON.parse(localStorage.getItem("auth"));
  if (!auth?.user?._id) return;

  // Connect socket if not connected
  if (!socket.connected) {
    socket.connect();
  }

  // Emit initial connection
  socket.emit("user:connect", { userId: auth.user._id });

  // Set up periodic activity updates
  const activityInterval = setInterval(() => {
    if (socket.connected) {
      socket.emit("user:activity");
    }
  }, 60000); // Every minute

  // Return cleanup function
  return () => {
    clearInterval(activityInterval);
    if (socket.connected) {
      socket.disconnect();
    }
  };
};

// Function to start tracking when user logs in
export const startActivityTracking = () => {
  return initializeActivityTracking();
};

// Function to stop tracking when user logs out
export const stopActivityTracking = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;
