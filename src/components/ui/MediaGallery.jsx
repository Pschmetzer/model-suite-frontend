import React, { useState, useEffect, useCallback, useRef } from "react";
import { Image, Video, FileText, Calendar, User } from "lucide-react";
import { useScrollToMsg } from "../../utils/functions";

const MediaGallery = ({
  convoId,
  onClose,
  onCloseDetails,
  fetchSpecificDmMessages,
}) => {
  const [activeTab, setActiveTab] = useState("photos");
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [counts, setCounts] = useState({ photos: 0, videos: 0, docs: 0 });
  const [pagination, setPagination] = useState({});

  const scrollContainerRef = useRef(null);
  const observerRef = useRef(null);
  const loadMoreTriggerRef = useRef(null);
  const scrollToMsg = useScrollToMsg();

  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const token = JSON.parse(localStorage.getItem("auth"))?.token;

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes) || bytes === 0) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
    return `${size} ${sizes[i]}`;
  };

  const formatDate = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffTime = Math.abs(now - messageDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays - 1}d ago`;

    return messageDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const fetchMedia = useCallback(
    async (type = "photos", pageNum = 1, append = false) => {
      if (append) setLoadingMore(true);
      else {
        setLoading(true);
        setMediaItems([]);
      }

      try {
        const params = new URLSearchParams({
          type,
          page: pageNum,
          limit: 20,
        });

        const response = await fetch(
          `${baseURL}/messanger/dm/fetchDmMedia/${convoId}?${params}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        const result = await response.json();

        if (result.success) {
          setMediaItems((prev) =>
            append
              ? [...prev, ...result.data.mediaItems]
              : result.data.mediaItems,
          );
          setCounts(result.data.counts);
          setPagination(result.data.pagination);
        }
      } catch (error) {
        console.error("Error fetching media:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [convoId, baseURL, token],
  );

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const currentTrigger = loadMoreTriggerRef.current;
    if (!currentTrigger) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          pagination.hasNext &&
          !loadingMore &&
          !loading
        ) {
          fetchMedia(activeTab, pagination.currentPage + 1, true);
        }
      },
      { threshold: 0.1 },
    );

    observerRef.current.observe(currentTrigger);
    return () => observerRef.current?.disconnect();
  }, [pagination, loadingMore, loading, activeTab, fetchMedia]);

  // Fetch media when tab changes
  useEffect(() => {
    if (convoId) fetchMedia(activeTab, 1, false);
  }, [convoId, activeTab, fetchMedia]);

  const handleMediaClick = (messageId) => {
    scrollToMsg(messageId, convoId, fetchSpecificDmMessages);
    if (onClose) onClose();
    if (onCloseDetails) onCloseDetails();
  };

  const tabData = [
    { key: "photos", label: "Photos", icon: Image },
    { key: "videos", label: "Videos", icon: Video },
    { key: "docs", label: "Docs", icon: FileText },
  ];

  const renderPhotoGrid = () => (
    <div className="grid grid-cols-3 gap-1">
      {mediaItems.map((item) => (
        <div
          key={item.id}
          onClick={() => handleMediaClick(item.messageId)}
          className="relative aspect-square bg-slate-800/50 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity group"
        >
          <img
            src={item.url}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute bottom-1 right-1 text-xs text-white/80 bg-black/50 px-1 py-0.5 rounded">
            {formatDate(item.createdAt)}
          </div>
          {item.name?.toLowerCase().endsWith(".gif") && (
            <div className="absolute top-1 left-1 text-xs text-white bg-black/70 px-1 py-0.5 rounded">
              GIF
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderVideoGrid = () => (
    <div className="grid grid-cols-2 gap-2">
      {mediaItems.map((item) => (
        <div
          key={item.id}
          onClick={() => handleMediaClick(item.messageId)}
          className="relative aspect-video bg-slate-800/50 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity group"
        >
          {item.url.includes("video") ? (
            <video
              src={item.url}
              className="w-full h-full object-cover"
              preload="metadata"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="w-8 h-8 text-slate-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <div className="w-0 h-0 border-l-[8px] border-l-white border-y-[6px] border-y-transparent ml-1"></div>
            </div>
          </div>
          <div className="absolute bottom-1 right-1 text-xs text-white bg-black/70 px-1 py-0.5 rounded">
            {item.duration
              ? `${Math.floor(item.duration / 60)}:${String(Math.floor(item.duration % 60)).padStart(2, "0")}`
              : formatDate(item.createdAt)}
          </div>
        </div>
      ))}
    </div>
  );

  const renderDocsList = () => (
    <div className="space-y-2">
      {mediaItems.map((item) => (
        <div
          key={item.id}
          onClick={() => handleMediaClick(item.messageId)}
          className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors border border-slate-700/50"
        >
          {/* File type preview */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: item.fileTypeColor || "#6b7280" }}
          >
            {item.fileExtension.split(0, 4)[0] || "FILE"}
          </div>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <h3
              className="text-sm font-medium text-white truncate"
              title={item.name}
            >
              {item.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <span>{formatFileSize(item.size)}</span>
              <span>•</span>
              <span>{formatDate(item.createdAt)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full  h-full bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Media</h2>
          <div className="text-sm text-slate-400">
            {counts[activeTab] || 0} items
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-800/50 gap-1 rounded-lg p-1">
          {tabData.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === key
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-slate-300 hover:bg-slate-700/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              <span className="text-xs opacity-75">({counts[key] || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4" ref={scrollContainerRef}>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : mediaItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500">
            {activeTab === "photos" && (
              <Image className="w-12 h-12 mb-3 opacity-50" />
            )}
            {activeTab === "videos" && (
              <Video className="w-12 h-12 mb-3 opacity-50" />
            )}
            {activeTab === "docs" && (
              <FileText className="w-12 h-12 mb-3 opacity-50" />
            )}
            <p className="text-sm">No {activeTab} found</p>
          </div>
        ) : (
          <>
            {activeTab === "photos" && renderPhotoGrid()}
            {activeTab === "videos" && renderVideoGrid()}
            {activeTab === "docs" && renderDocsList()}
          </>
        )}

        {/* Load more trigger */}
        {pagination.hasNext && (
          <div ref={loadMoreTriggerRef} className="h-4 mt-4">
            {loadingMore && (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaGallery;
