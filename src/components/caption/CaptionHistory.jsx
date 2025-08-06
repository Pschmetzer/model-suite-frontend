import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  History,
  Clock,
  Bot,
  Eye,
  Copy,
  CopyCheck,
  Image,
  Video,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { fetchCaptionHistory } from "../../globalstate/captionSlice.jsx";
import { captionUtils } from "../../services/captionService.js";
import Button from "../ui/Button.jsx";

const CaptionHistory = () => {
  const dispatch = useDispatch();
  const { history, historyLoading, historyError, historyPagination } =
    useSelector((state) => state.caption);

  const [currentPage, setCurrentPage] = useState(1);
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(() => {
    dispatch(fetchCaptionHistory({ page: currentPage, limit: 10 }));
  }, [dispatch, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleCopyCaption = async (caption, index) => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopiedIndex(index);
      toast.success("Caption copied to clipboard!");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error("Failed to copy caption:", error);
      toast.error("Failed to copy caption");
    }
  };

  const handleRefresh = () => {
    dispatch(fetchCaptionHistory({ page: currentPage, limit: 10 }));
  };

  if (historyLoading && history.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-500 mr-3" />
          <span className="text-gray-500 dark:text-gray-400">
            Loading caption history...
          </span>
        </div>
      </div>
    );
  }

  if (historyError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
              Failed to Load History
            </h4>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {historyError}
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="sm"
            className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800/30"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4">
            <History className="w-8 h-8 text-gray-500 dark:text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Caption History
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Your generated captions will appear here. Start creating some
            captions to build your history!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <History className="w-5 h-5 mr-2 text-blue-600" />
          Caption History
        </h3>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={historyLoading}
          className="flex items-center space-x-2"
        >
          <RefreshCw
            className={`w-4 h-4 ${historyLoading ? "animate-spin" : ""}`}
          />
          <span>Refresh</span>
        </Button>
      </div>

      {/* History Items */}
      <div className="space-y-4">
        {history.map((item, index) => (
          <div
            key={item._id || index}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            {/* Item Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  {item.mediaType === "video" ? (
                    <Video className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <Image className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.mediaType === "video" ? "Video" : "Image"} Caption
                    Generation
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString()} at{" "}
                    {new Date(item.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <Bot className="w-3 h-3 mr-1" />
                  <span>{item.aiService}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>
                    {captionUtils.formatProcessingTime(item.processingTime)}
                  </span>
                </div>
                {item.isNsfw && (
                  <div className="flex items-center text-orange-500">
                    <Eye className="w-3 h-3 mr-1" />
                    <span>NSFW</span>
                  </div>
                )}
              </div>
            </div>

            {/* Media Preview */}
            {item.mediaUrl && (
              <div className="mb-4">
                <div className="w-full max-w-md">
                  {item.mediaType === "video" ? (
                    <video
                      src={item.mediaUrl}
                      className="w-full aspect-video object-cover rounded-lg bg-gray-100 dark:bg-gray-700"
                      controls={false}
                      muted
                    />
                  ) : (
                    <img
                      src={item.mediaUrl}
                      alt="Generated caption media"
                      className="w-full aspect-video object-cover rounded-lg bg-gray-100 dark:bg-gray-700"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Generated Captions */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Generated Captions ({item.captions?.length || 0})
              </h4>
              <div className="space-y-2">
                {item.captions?.map((caption, captionIndex) => (
                  <div
                    key={captionIndex}
                    className="group flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <p className="text-sm text-gray-900 dark:text-white leading-relaxed pr-4 flex-1">
                      {caption}
                    </p>
                    <Button
                      onClick={() =>
                        handleCopyCaption(caption, `${index}-${captionIndex}`)
                      }
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-white hover:bg-blue-600 dark:text-gray-400 dark:hover:text-white dark:hover:bg-blue-600"
                    >
                      {copiedIndex === `${index}-${captionIndex}` ? (
                        <CopyCheck className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )) || (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No captions available
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {historyPagination.total > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing{" "}
            {(historyPagination.current - 1) * historyPagination.limit + 1} to{" "}
            {Math.min(
              historyPagination.current * historyPagination.limit,
              historyPagination.totalRecords,
            )}{" "}
            of {historyPagination.totalRecords} results
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={() => handlePageChange(historyPagination.current - 1)}
              disabled={historyPagination.current === 1}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <span className="text-sm text-gray-900 dark:text-white px-3">
              Page {historyPagination.current} of {historyPagination.total}
            </span>

            <Button
              onClick={() => handlePageChange(historyPagination.current + 1)}
              disabled={!historyPagination.hasNext}
              variant="outline"
              size="sm"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptionHistory;
