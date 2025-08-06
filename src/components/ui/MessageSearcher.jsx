import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Search,
  X,
  FileText,
  Image,
  Video,
  Music,
  File,
  ChevronLeft,
} from "lucide-react";
import { throttle } from "lodash";

const MessageSearcher = ({
  isOpen,
  onClose,
  convoId,
  scrollToMsg,
  fetchSpecificDmMessages,
  baseURL,
  token,
  type = "dm", // 'dm', 'group', or 'channel'
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasMore, sethasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const scrollContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSearchResults([]);
      setOffset(0);
      sethasMore(false);
      setTotalResults(0);
    }
  }, [isOpen]);

  const searchMessages = useCallback(
    async (query, offsetValue = 0, isLoadMore = false) => {
      if (!query.trim()) {
        setSearchResults([]);
        sethasMore(false);
        setTotalResults(0);
        return;
      }

      setIsSearching(true);

      try {
        const searchParams = new URLSearchParams({
          convoId,
          query: query.trim(),
          offset: offsetValue,
          limit: 20,
        });

        const response = await fetch(
          `${baseURL}/messanger/${type}/searchMessages?${searchParams}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Search request failed");
        }

        const data = await response.json();
        const { messages, total, hasMore: moreResults } = data;

        if (isLoadMore) {
          setSearchResults((prev) => [...prev, ...messages]);
        } else {
          setSearchResults(messages);
        }

        sethasMore(moreResults);
        setTotalResults(total);
        setOffset(offsetValue + messages.length);
      } catch (error) {
        console.error("Search failed:", error);
        if (!isLoadMore) {
          setSearchResults([]);
          sethasMore(false);
          setTotalResults(0);
        }
      } finally {
        setIsSearching(false);
      }
    },
    [convoId, baseURL, token, type],
  );

  // Debounced search
  const debouncedSearch = useCallback(
    throttle((query) => {
      searchMessages(query, 0, false);
    }, 500),
    [searchMessages],
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim()) {
      debouncedSearch(query);
    } else {
      setSearchResults([]);
      sethasMore(false);
      setTotalResults(0);
    }
  };

  // Handle scroll for loading more results
  const handleScroll = useCallback(
    throttle(() => {
      const container = scrollContainerRef.current;
      if (!container || !hasMore || isSearching) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

      if (isNearBottom) {
        searchMessages(searchQuery, offset, true);
      }
    }, 200),
    [hasMore, isSearching, searchQuery, offset, searchMessages],
  );

  // Handle message click
  const handleMessageClick = (messageId) => {
    scrollToMsg(messageId, convoId, fetchSpecificDmMessages);

    onClose();
  };

  // Get attachment icon and label
  const getAttachmentInfo = (attachments) => {
    if (!attachments || attachments.length === 0) return null;

    const types = attachments.map((att) => att.type?.toLowerCase());
    const hasImage = types?.some((t) => t?.includes("image") || t === "image");
    const hasVideo = types?.some((t) => t?.includes("video") || t === "video");
    const hasAudio = types?.some((t) => t?.includes("audio") || t === "audio");
    const hasFile = types?.some(
      (t) => !["image", "video", "audio"].includes(t),
    );

    let icon = File;
    let label = "File";

    if (hasImage && !hasVideo && !hasAudio && !hasFile) {
      icon = Image;
      label =
        attachments.length === 1 ? "Image" : `${attachments.length} Images`;
    } else if (hasVideo && !hasImage && !hasAudio && !hasFile) {
      icon = Video;
      label =
        attachments.length === 1 ? "Video" : `${attachments.length} Videos`;
    } else if (hasAudio && !hasImage && !hasVideo && !hasFile) {
      icon = Music;
      label =
        attachments.length === 1
          ? "Audio"
          : `${attachments.length} Audio files`;
    } else {
      icon = FileText;
      label = `${attachments.length} ${attachments.length === 1 ? "Attachment" : "Attachments"}`;
    }

    return { icon, label };
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );

    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (messageDate.getTime() === today.getTime() - 86400000) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  // Highlight search terms in text
  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm || !text) return text;

    const regex = new RegExp(
      `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span
          key={index}
          className="bg-yellow-500 bg-opacity-30 text-yellow-200 px-1 rounded"
        >
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a2332] rounded-xl shadow-2xl w-[60%] h-full  flex flex-col overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-700 bg-[#232e3c]">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-white">Search Messages</h2>
          {totalResults > 0 && (
            <span className="text-sm text-gray-400 ml-auto">
              {totalResults} result{totalResults !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search for messages..."
              className="w-full pl-10 pr-4 py-3 bg-[#2a3441] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  sethasMore(false);
                  setTotalResults(0);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto custom-scrollbar"
          onScroll={handleScroll}
        >
          {isSearching && searchResults.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>Searching...</span>
              </div>
            </div>
          ) : searchResults.length === 0 && searchQuery ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <Search className="w-8 h-8 mb-2 opacity-50" />
              <p>No messages found for "{searchQuery}"</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <Search className="w-8 h-8 mb-2 opacity-50" />
              <p>Start typing to search messages</p>
            </div>
          ) : (
            <div className="p-2">
              {searchResults.map((message, index) => {
                const attachmentInfo = getAttachmentInfo(message.attachments);
                const IconComponent = attachmentInfo?.icon;

                return (
                  <div
                    key={`${message._id}-${index}`}
                    onClick={() => handleMessageClick(message._id)}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#2a3441] cursor-pointer transition-colors group"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden">
                      {message.senderAvatar ? (
                        <img
                          src={message.senderAvatar}
                          alt={message.senderName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-medium">
                          {message.senderName?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white text-sm truncate">
                          {message.senderName || "Unknown User"}
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatTimestamp(message.createdAt)}
                        </span>
                      </div>

                      {/* Attachments indicator */}
                      {attachmentInfo && (
                        <div className="flex items-center gap-1 mb-1">
                          <IconComponent className="w-3 h-3 text-blue-400" />
                          <span className="text-xs text-blue-400">
                            {attachmentInfo.label}
                          </span>
                        </div>
                      )}

                      {/* Message text */}
                      {message.text && (
                        <p className="text-gray-300 text-sm line-clamp-2 group-hover:text-white transition-colors">
                          {highlightSearchTerm(message.text, searchQuery)}
                        </p>
                      )}

                      {!message.text && attachmentInfo && (
                        <p className="text-gray-400 text-sm italic">
                          {attachmentInfo.label}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Load more indicator */}
              {isSearching && searchResults.length > 0 && (
                <div className="flex items-center justify-center py-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Loading more...</span>
                  </div>
                </div>
              )}

              {!hasMore &&
                searchResults.length > 0 &&
                searchResults.length >= 20 && (
                  <div className="text-center py-4">
                    <span className="text-xs text-gray-500">
                      End of results
                    </span>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageSearcher;
