import { Reply, Edit3, Pin, Copy, Trash2, Plus, PinOff } from "lucide-react";
import Picker from "emoji-picker-react";
import { useEffect, useRef, useState } from "react";

import React from "react";
import { X } from "lucide-react";

const ReactionsModal = ({ reactions, onClose, handleRemoveReaction }) => {
  const [selectedTab, setSelectedTab] = useState("all");
  const user = JSON.parse(localStorage.getItem("auth")).user;
  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {});

  // Get unique emojis
  const uniqueEmojis = Object.keys(groupedReactions);

  // Get reactions to display based on selected tab
  const getDisplayReactions = () => {
    if (selectedTab === "all") {
      return reactions;
    }
    return groupedReactions[selectedTab] || [];
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Reactions
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <X size={20} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-4 py-2 pt-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setSelectedTab("all")}
          className={`px-3 py-2 text-sm font-medium rounded-lg mr-2 transition-colors ${
            selectedTab === "all"
              ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          All {reactions.length}
        </button>

        {uniqueEmojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => setSelectedTab(emoji)}
            className={`px-3 py-2 text-sm font-medium rounded-lg mr-2 transition-colors flex items-center ${
              selectedTab === emoji
                ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <span className="mr-1">{emoji}</span>
            <span>{groupedReactions[emoji].length}</span>
          </button>
        ))}
      </div>

      {/* Reactions List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {getDisplayReactions().map((reaction, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* User Avatar */}
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  {reaction.avatar ? (
                    <img
                      src={reaction.avatar}
                      alt={reaction.fullName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {reaction.fullName?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* User Name */}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {reaction.fullName || "Unknown User"}
                  </p>
                  {reaction.userId === user._id && (
                    <button
                      className="opacity-35 text-xs cursor-pointer"
                      onClick={() => handleRemoveReaction(user._id)}
                    >
                      click to remove
                    </button>
                  )}
                </div>
              </div>

              {/* Emoji */}
              <span className="text-xl">{reaction.emoji}</span>
            </div>
          ))}
        </div>

        {getDisplayReactions().length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No reactions found
          </div>
        )}
      </div>
    </div>
  );
};

export const MessageContextMenu = ({
  isOpen,
  onClose,
  message,
  isOwn,
  onReact,
  onReply,
  onEdit,
  onPin,
  onUnPin,
  onCopyText,
  onDelete,
  handleRemoveReaction,
  type = "messageOptions",
}) => {
  const menuRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Common reaction emojis
  const reactions = ["😂", "👍", "❤️", "🔥", "😢", "👏"];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
        setShowEmojiPicker(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        if (showEmojiPicker) {
          setShowEmojiPicker(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen || showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, showEmojiPicker]);

  if (!isOpen && !showEmojiPicker) return null;

  const handleReaction = (emoji) => {
    onReact(message._id, emoji);
    onClose();
  };

  const handleEmojiSelect = (emojiObject) => {
    onReact(message._id, emojiObject.emoji);
    setShowEmojiPicker(false);
    onClose();
  };

  const handleEmojiPickerOpen = () => {
    setShowEmojiPicker(true);
    // Close the menu when opening emoji picker
  };

  if (type === "messageOptions") {
    return (
      <>
        {/* Main Context Menu */}

        <div className="flex justify-center items-center w-full h-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#00000057]">
          {isOpen && !showEmojiPicker && (
            <div
              ref={menuRef}
              className=" bg-white dark:bg-[#2b2d31] border border-gray-200 dark:border-[#3f4248] rounded-lg  min-w-[180px] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
            >
              {/* Reactions Row - Telegram Style */}
              <div className="flex items-center gap-1 px-2 py-2 bg-gray-50 dark:bg-[#36393f] border-b border-gray-200 dark:border-[#3f4248]">
                {reactions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="text-lg hover:scale-110 transition-transform duration-150 p-1.5 hover:bg-gray-200 dark:hover:bg-[#40444b] rounded-md"
                  >
                    {emoji}
                  </button>
                ))}
                <div className="w-px h-5 bg-gray-300 dark:bg-[#4f545c] mx-1" />
                <button
                  onClick={handleEmojiPickerOpen}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-[#40444b] rounded-md transition-colors duration-150"
                >
                  <Plus
                    size={16}
                    className="text-gray-500 dark:text-gray-400"
                  />
                </button>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <MenuItem
                  icon={<Reply size={16} />}
                  text="Reply"
                  onClick={() => {
                    onReply(message);
                    onClose();
                  }}
                />

                {isOwn && (
                  <MenuItem
                    icon={<Edit3 size={16} />}
                    text="Edit"
                    onClick={() => {
                      onEdit(message);
                      onClose();
                    }}
                  />
                )}

                {!message.pinned ? (
                  <MenuItem
                    icon={<Pin size={16} />}
                    text="Pin"
                    onClick={() => {
                      onPin(message._id);
                      onClose();
                    }}
                  />
                ) : (
                  <MenuItem
                    icon={<PinOff size={16} />}
                    text="UnPin"
                    onClick={() => {
                      onUnPin(message._id);
                      onClose();
                    }}
                  />
                )}

                <MenuItem
                  icon={<Copy size={16} />}
                  text="Copy Text"
                  onClick={() => {
                    onCopyText(message._id);
                    onClose();
                  }}
                />

                {isOwn ? (
                  <>
                    <div className="h-px bg-gray-200 dark:bg-[#3f4248] my-1" />
                    <div className="delete-options flex gap-2">
                      <MenuItem
                        icon={<Trash2 size={16} />}
                        text="Delete For Me"
                        onClick={() => {
                          onDelete(message._id, "forMe");
                          onClose();
                        }}
                        danger
                      />
                      <MenuItem
                        icon={<Trash2 size={16} />}
                        text="Delete For All"
                        onClick={() => {
                          onDelete(message._id, "forAll");
                          onClose();
                        }}
                        danger
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-px bg-gray-200 dark:bg-[rgb(63,66,72)] my-1" />
                    <div className="delete-options flex gap-2">
                      <MenuItem
                        icon={<Trash2 size={16} />}
                        text="Delete For Me"
                        onClick={() => {
                          onDelete(message._id, "forMe");
                          onClose();
                        }}
                        danger
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="z-60 animate-in fade-in-0 zoom-in-95 duration-150">
              <div ref={menuRef}>
                <Picker
                  onEmojiClick={handleEmojiSelect}
                  theme="dark"
                  previewConfig={{
                    showPreview: false,
                  }}
                  skinTonesDisabled
                  searchDisabled
                  height={350}
                  width={300}
                />
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  if (type === "reactionsList") {
    return (
      <div className="flex justify-center items-center w-full h-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#00000057]">
        <ReactionsModal
          onClose={onClose}
          reactions={message.reactions}
          handleRemoveReaction={handleRemoveReaction}
        />
        {console.log(message.reactions)}
      </div>
    );
  }
};

// Clean Menu Item Component
const MenuItem = ({ icon, text, onClick, danger = false }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors duration-150 text-left text-sm ${
      danger
        ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#40444b]"
    }`}
  >
    <span
      className={`${
        danger
          ? "text-red-600 dark:text-red-400"
          : "text-gray-500 dark:text-gray-400"
      }`}
    >
      {icon}
    </span>
    <span className="font-medium">{text}</span>
  </button>
);
