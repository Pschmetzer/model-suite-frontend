import React, { useState, useTransition, useMemo } from "react";
import ChatWindow from "./ChatWindow";
import { useSelector } from "react-redux";
import {
  Check,
  CheckCheckIcon,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  File,
  Search,
  MessageSquare,
  Users,
  Hash,
  Loader2,
} from "lucide-react";
import { formateTime } from "../utils/functions";

// Dummy data for demonstration
const conversations = [];
const user = JSON.parse(localStorage.getItem("auth"))?.user;

const tabOptions = [
  { key: "all", label: "All Chats", icon: MessageSquare },
  { key: "dm", label: "Direct Messages", icon: MessageSquare },
  { key: "group", label: "Groups", icon: Users },
  { key: "channel", label: "Channels", icon: Hash },
];

function getUnreadCount(type) {
  if (type === "all") return conversations.reduce((a, c) => a + c.unread, 0);
  return conversations
    .filter((c) => c.type === type)
    .reduce((a, c) => a + c.unread, 0);
}

function renderLastMessage(c) {
  const lastMessage = c.messages[c.messages.length - 1];
  const attachments = lastMessage?.attachments || [];
  const text = lastMessage?.text?.trim();

  if (!lastMessage) return;
  if (
    lastMessage?.deletedFor?.includes(user?._id) ||
    lastMessage?.deletedFor?.includes("everyone")
  ) {
    return <span> 🚫 deleted message</span>;
  }

  if (attachments.length === 0) {
    return text || "Attachment";
  }

  const counts = {
    image: 0,
    video: 0,
    audio: 0,
    document: 0,
    other: 0,
  };

  attachments.forEach((att) => {
    if (att.mimeType?.includes("image")) counts.image++;
    else if (att.mimeType?.includes("video")) counts.video++;
    else if (att.mimeType?.includes("audio")) counts.audio++;
    else if (
      ["pdf", "doc", "docx", "text", "txt"].includes(att.fileExtension)
    ) {
      counts.document++;
    } else {
      counts.other++;
    }
  });

  const parts = [];

  if (counts.image > 0) {
    parts.push(
      <span
        key="img"
        className="inline-flex items-center gap-1  px-2 py-1 text-xs "
      >
        <FileImage className="w-3 h-3 text-blue-400" />
        {counts.image} {counts.image === 1 ? "image" : "images"}
      </span>,
    );
  }

  if (counts.video > 0) {
    parts.push(
      <span
        key="vid"
        className="inline-flex items-center gap-1  px-2 py-1 text-xs "
      >
        <FileVideo className="w-3 h-3 text-purple-400" />
        {counts.video} {counts.video === 1 ? "video" : "videos"}
      </span>,
    );
  }

  if (counts.audio > 0) {
    parts.push(
      <span
        key="aud"
        className="inline-flex items-center gap-1  px-2 py-1 text-xs "
      >
        <FileAudio className="w-3 h-3 text-green-400" />
        {counts.audio} {counts.audio === 1 ? "audio" : "audios"}
      </span>,
    );
  }

  if (counts.document > 0) {
    parts.push(
      <span
        key="doc"
        className="inline-flex items-center gap-1 px-2 py-1 text-xs "
      >
        <FileText className="w-3 h-3 text-orange-400" />
        {counts.document} {counts.document === 1 ? "document" : "documents"}
      </span>,
    );
  }

  if (counts.other > 0) {
    parts.push(
      <span
        key="other"
        className="inline-flex items-center gap-1  px-2 py-1 text-xs "
      >
        <File className="w-3 h-3 text-gray-400" />
        {counts.other} {counts.other === 1 ? "file" : "files"}
      </span>,
    );
  }

  return <div className="flex flex-wrap gap-1">{parts}</div>;
}

function ModelMessanger() {
  const user = JSON.parse(localStorage.getItem("auth")).user;
  const [selectedTab, setSelectedTab] = useState("all");
  const [search, setSearch] = useState("");
  const [activeChat, setActiveChat] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const dmConversations = useSelector((state) => state.dm.conversations);

  // Memoize the filtered conversations to prevent unnecessary re-calculations
  const filteredConvos = useMemo(() => {
    if (!dmConversations) return [];

    return dmConversations.filter((c) => {
      const matchesTab = selectedTab === "all" || c.type == selectedTab;
      const opponentName =
        c?.members[0]?.userId !== user._id
          ? c.members[0]?.name
          : c.members[1]?.name;
      const matchesSearch = opponentName
        ?.toLowerCase()
        .includes(search.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [dmConversations, selectedTab, search, user._id]);

  const handleTabChange = (tabKey) => {
    startTransition(() => {
      setSelectedTab(tabKey);
    });
  };

  // Remove startTransition from search - handle it synchronously
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleChatSelect = (chat) => {
    setIsLoading(true);
    // Simulate loading
    setTimeout(() => {
      setActiveChat(chat);
      setIsLoading(false);
    }, 150);
  };

  if (activeChat) {
    return (
      <ChatWindow
        convoId={activeChat.convoId}
        type={activeChat.type}
        onBack={() => setActiveChat(null)}
      />
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white font-inter flex flex-col h-full shadow-2xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-blue-900 to-slate-800 px-6 py-4 border-b border-slate-700/50 shadow-lg sticky top-0 z-20 backdrop-blur-sm bg-opacity-95">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white tracking-tight">
            Messages
          </h1>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 animate-pulse"></div>
            <span className="text-xs text-slate-300">Online</span>
          </div>
        </div>
      </div>

      <div className="w-full flex-col gap-4">
        {/* Enhanced Tabs */}
        <div className="flex border-b border-slate-700/50 bg-gradient-to-r from-slate-800/90 via-slate-700/90 to-slate-800/90   backdrop-blur-sm">
          {tabOptions.map((tab) => {
            const IconComponent = tab.icon;
            const unreadCount = getUnreadCount(tab.key);
            const isActive = selectedTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                disabled={isPending}
                className={`group relative px-4 py-3 cursor-pointer flex items-center font-medium text-sm transition-all duration-200 hover:bg-slate-700/30 disabled:opacity-50
                ${
                  isActive
                    ? "text-blue-300 bg-slate-700/40"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <IconComponent
                  className={`w-4 h-4 mr-2 transition-colors ${
                    isActive
                      ? "text-blue-400"
                      : "text-slate-400 group-hover:text-slate-300"
                  }`}
                />
                <span className="whitespace-nowrap">{tab.label}</span>

                {unreadCount > 0 && (
                  <span className="ml-2 bg-blue-500 text-white text-xs font-medium px-2 py-0.5 min-w-[18px] text-center animate-pulse">
                    {unreadCount}
                  </span>
                )}

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Enhanced Search Bar */}
        <div className="px-6 py-3 bg-gradient-to-r from-slate-800/50 via-slate-700/50 to-slate-800/50 border-b border-slate-700/30  z-10 backdrop-blur-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-600/50 text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-800/30 to-slate-900/50">
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin mr-2" />
            <span className="text-slate-300">Loading chat...</span>
          </div>
        )}

        {!isLoading && filteredConvos.length === 0 && (
          <div className="text-center p-12">
            <MessageSquare className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 text-base font-medium">
              No conversations found
            </p>
            <p className="text-slate-500 text-sm mt-1">
              Start a new conversation to get started
            </p>
          </div>
        )}

        {!isLoading &&
          filteredConvos.map((c) => {
            const opponent =
              c?.members[0]?.userId !== user._id ? c.members[0] : c.members[1];
            const unreadCount = c?.messages?.filter(
              (m) => m.status !== "seen" && m.senderId !== user._id,
            ).length;

            return (
              <div
                key={c.convoId}
                onClick={() =>
                  handleChatSelect({ type: "dm", convoId: c.convoId })
                }
                className="group flex items-center w-full px-6 py-4 border-b border-slate-700/30 bg-slate-800/20 cursor-pointer transition-all duration-200 hover:bg-slate-700/30 hover:border-slate-600/50 relative"
              >
                {/* Avatar Section */}
                <div className="relative mr-4 flex-shrink-0">
                  <div
                    className={`relative w-11 h-11 flex items-center overflow-hidden justify-center rounded-full border-2 transition-colors ${
                      unreadCount > 0
                        ? "border-blue-400"
                        : "border-slate-600/50 group-hover:border-slate-500"
                    } bg-slate-700`}
                  >
                    <img
                      src={opponent?.avatar}
                      alt={opponent?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {opponent?.status?.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-slate-800 animate-pulse"></div>
                  )}
                </div>

                {/* Content Section */}
                <div className="flex flex-col flex-grow min-w-0">
                  <div className="flex justify-between items-start w-full mb-1">
                    <h3
                      className={`font-semibold truncate transition-colors ${
                        unreadCount > 0
                          ? "text-white"
                          : "text-slate-200 group-hover:text-white"
                      }`}
                    >
                      {opponent?.name}
                    </h3>
                    <span className="text-xs text-slate-400 ml-3 flex-shrink-0 font-medium">
                      {c.messages.length > 0
                        ? formateTime(
                            c?.messages[c.messages.length - 1]?.createdAt,
                          )
                        : formateTime(c.createdAt)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400 text-sm w-full">
                    <div className="truncate flex items-center min-w-0 flex-grow">
                      {/* Message status indicators */}
                      {c?.messages[c.messages.length - 1]?.senderId ===
                        user._id && (
                        <div className="mr-2 flex-shrink-0">
                          {c?.messages[c.messages.length - 1]?.status ===
                          "sent" ? (
                            <Check className="w-4 h-4 text-slate-500" />
                          ) : c?.messages[c.messages.length - 1]?.status ===
                            "seen" ? (
                            <CheckCheckIcon className="w-4 h-4 text-blue-400" />
                          ) : null}
                        </div>
                      )}

                      <div className="truncate text-slate-400 group-hover:text-slate-300">
                        {renderLastMessage(c)}
                      </div>
                    </div>

                    {/* Unread count */}
                    {unreadCount > 0 && (
                      <div className="ml-3 flex-shrink-0">
                        <span className="bg-green-500 rounded-full text-white text-xs font-medium  w-5 h-5 flex items-center justify-center  text-center animate-pulse">
                          {unreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default ModelMessanger;
