import React, { useState, useRef, useEffect } from "react";
import { Pin, PinOff, File, X, Loader2 } from "lucide-react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { updatePinnedMessagesList } from "../../globalstate/dmSlice";

const PinnedMessagesUI = ({
  convoId,
  onUnpin,
  scrollToMsg,
  fetchSpecificDmMessages,
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const menuRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const token = JSON.parse(localStorage.getItem("auth"))?.token;
  const conversation = useSelector((state) =>
    state.dm.conversations.find((c) => c.convoId === convoId),
  );
  const pinnedMessages = conversation?.pinnedMessages || [];
  const dispatch = useDispatch();
  // Get the last pinned message for preview
  const lastPinnedMessage = pinnedMessages[pinnedMessages.length - 1];
  // Fetch pinned messages with user details when context menu opens
  const fetchPinnedMessagesWithDetails = async () => {
    if (!convoId || !token) return;

    setIsLoading(true);
    try {
      const response = await axios.get(
        `${baseURL}/messanger/dm/pinnedMessagesWithUserDetails?convoId=${convoId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        },
      );

      dispatch(
        updatePinnedMessagesList({ convoId, pinnedMessages: response.data }),
      );
    } catch (error) {
      console.error("Failed to fetch pinned messages with details:", error);
      // Fallback to original pinned messages
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowContextMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showContextMenu]);

  const handlePinnedClick = async () => {
    setShowContextMenu(true);
    // Fetch fresh data when opening the context menu
    await fetchPinnedMessagesWithDetails();
  };

  const handleMessageClick = (messageId) => {
    scrollToMsg(messageId, convoId, fetchSpecificDmMessages);
    setShowContextMenu(false);
  };

  const handleUnpinClick = (e, messageId) => {
    e.stopPropagation();
    onUnpin(messageId);
  };

  // Close context menu if all pinned messages are gone
  useEffect(() => {
    if (showContextMenu && pinnedMessages.length === 0) {
      setShowContextMenu(false);
    }
  }, [pinnedMessages.length, showContextMenu]);

  if (!pinnedMessages || pinnedMessages.length === 0) {
    return null;
  }

  return (
    <>
      {/* Pinned Message Preview Bar */}
      <div
        className="pinned-msg z-20 absolute flex items-center gap-3 px-4 py-3 bg-gray-800/90 backdrop-blur-sm left-0 top-0 w-full border-b border-gray-700 cursor-pointer hover:bg-gray-700/90 transition-colors"
        onClick={handlePinnedClick}
      >
        <Pin size={16} className="text-yellow-400 flex-shrink-0" />
        <span className="text-gray-300 font-medium text-sm">Pinned</span>
        <div className="w-px h-4 bg-gray-600" />

        <div className="pinned-msg-preview flex items-center gap-2 flex-1 min-w-0">
          {lastPinnedMessage.attachments?.length > 0 && (
            <File size={14} className="text-gray-400 flex-shrink-0" />
          )}
          <p className="text-gray-200 text-sm truncate">
            {lastPinnedMessage.text || "Media message"}
          </p>
        </div>

        {pinnedMessages.length > 1 && (
          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded-full">
            +{pinnedMessages.length - 1}
          </span>
        )}
      </div>

      {/* Context Menu - Pinned Messages List */}
      {showContextMenu && (
        <div className="absolute w-full h-full z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            ref={menuRef}
            className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md max-h-[70vh] flex flex-col shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Pin size={18} className="text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">
                  Pinned Messages
                </h3>
                <span className="text-sm text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
                  {pinnedMessages.length}
                </span>
              </div>
              <button
                onClick={() => setShowContextMenu(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-400">
                    Loading messages...
                  </span>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {(pinnedMessages.length > 0 && pinnedMessages).map(
                    (message, index) => (
                      <div
                        key={message._id || index}
                        className="group flex items-start gap-3 p-3 hover:bg-gray-800/50 rounded-lg cursor-pointer transition-colors"
                        onClick={() => handleMessageClick(message._id)}
                      >
                        {/* Sender Avatar */}
                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                          {message.senderAvatar ? (
                            <img
                              src={message.senderAvatar}
                              alt={message.senderName}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-medium text-gray-300">
                              {message.senderName?.charAt(0).toUpperCase() ||
                                "U"}
                            </span>
                          )}
                        </div>

                        {/* Message Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white">
                              {message.senderName || "Unknown User"}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(message.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-start gap-2">
                            {message.attachments?.length > 0 && (
                              <File
                                size={14}
                                className="text-gray-400 mt-0.5 flex-shrink-0"
                              />
                            )}
                            <p className="text-sm text-gray-300 line-clamp-2">
                              {message.text ||
                                (message.attachments?.length > 0
                                  ? "Media message"
                                  : "No content")}
                            </p>
                          </div>
                        </div>

                        {/* Unpin Button */}
                        <button
                          onClick={(e) => handleUnpinClick(e, message._id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-700 rounded-md transition-all"
                          title="Unpin message"
                        >
                          <PinOff
                            size={14}
                            className="text-gray-400 hover:text-red-400"
                          />
                        </button>
                      </div>
                    ),
                  )}

                  {!isLoading && pinnedMessages.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      No pinned messages
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PinnedMessagesUI;
