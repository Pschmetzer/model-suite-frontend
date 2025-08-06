import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCheck,
  Download,
  FileText,
  Music,
  Video,
  File,
  Plus,
  Play,
  Pause,
  PinIcon,
  Pin,
} from "lucide-react";
import { formateTime } from "../../utils/functions";

import { X, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useSelector } from "react-redux";

const AttachmentRenderer = ({ attachments, isOwn, activeAudios }) => {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const images = attachments.filter((att) => att.mimeType?.includes("image"));
  const videos = attachments.filter(
    (att) => att.mimeType?.includes("video") && !att.mimeType?.includes("webm"),
  );
  const audios = attachments.filter(
    (att) => att.mimeType?.includes("audio") || att.mimeType?.includes("webm"),
  );
  const otherFiles = attachments.filter(
    (att) =>
      !att.mimeType?.includes("image") &&
      !att.mimeType?.includes("video") &&
      !att.mimeType?.includes("audio"),
  );

  const mediaFiles = [...images, ...videos];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!galleryOpen) return;

      if (e.key === "Escape") {
        setGalleryOpen(false);
      } else if (e.key === "ArrowLeft") {
        navigateGallery("prev");
      } else if (e.key === "ArrowRight") {
        navigateGallery("next");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [galleryOpen]);

  // Handle touch gestures for mobile
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      navigateGallery("next");
    } else if (isRightSwipe) {
      navigateGallery("prev");
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes("pdf")) return <FileText className="w-8 h-8" />;
    if (mimeType?.includes("audio") || mimeType?.includes("webm"))
      return <Music className="w-8 h-8" />;
    if (mimeType?.includes("video") && !mimeType?.includes("webm"))
      return <Video className="w-8 h-8" />;
    return <File className="w-8 h-8" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const openGallery = (index) => {
    setCurrentIndex(index);
    setGalleryOpen(true);
  };

  const navigateGallery = (direction) => {
    if (direction === "next") {
      setCurrentIndex((prev) => (prev + 1) % mediaFiles.length);
    } else {
      setCurrentIndex(
        (prev) => (prev - 1 + mediaFiles.length) % mediaFiles.length,
      );
    }
  };

  const downloadFile = async (file) => {
    const url = file.localUrl || file.cloudinaryUrl;
    const filename = file.name || "download";

    try {
      const response = await fetch(url, { mode: "cors" }); // or "no-cors" if allowed
      if (!response.ok) throw new Error("Failed to fetch file");

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl); // Clean up
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed. File may not be accessible.");
    }
  };

  const SingleMediaPreview = ({ media, openGallery }) => {
    const url = media.localUrl || media.cloudinaryUrl;
    const FIXED_WIDTH = 300;
    const MAX_HEIGHT = 500;

    const [dimensions, setDimensions] = useState({
      width: FIXED_WIDTH,
      height: MAX_HEIGHT, // Default fallback height
      ready: false,
    });

    const calculateDimensions = (originalWidth, originalHeight) => {
      if (!originalWidth || !originalHeight) {
        return { width: FIXED_WIDTH, height: MAX_HEIGHT };
      }

      const aspectRatio = originalWidth / originalHeight;
      const width = FIXED_WIDTH;
      let height = width / aspectRatio;

      // Cap height at maximum
      if (height > MAX_HEIGHT) {
        height = MAX_HEIGHT;
      }

      return {
        width: Math.round(width),
        height: Math.round(height),
      };
    };

    useEffect(() => {
      // If we already have dimensions from media object
      if (media.width && media.height) {
        const dims = calculateDimensions(media.width, media.height);
        setDimensions({ ...dims, ready: true });
        return;
      }

      // For images without dimensions, load to get natural dimensions
      if (media.mimeType.includes("image")) {
        const img = new Image();
        img.src = url;

        img.onload = () => {
          const dims = calculateDimensions(img.naturalWidth, img.naturalHeight);
          setDimensions({ ...dims, ready: true });
        };

        img.onerror = () => {
          // Fallback dimensions if image fails to load
          setDimensions({
            width: FIXED_WIDTH,
            height: MAX_HEIGHT,
            ready: true,
          });
        };
      } else {
        // For videos, set ready to true with default dimensions
        setDimensions({ width: FIXED_WIDTH, height: 200, ready: true });
      }
    }, [media, url]);

    const isLoading =
      media.status === "uploading" || media.status === "pending";

    return (
      <div
        className="relative rounded-lg overflow-hidden cursor-pointer bg-gray-100"
        onClick={() => openGallery(0)}
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        }}
      >
        {media.mimeType.includes("image") ? (
          <img
            src={url}
            alt={media.name || "Image"}
            className={`w-full h-full transition-opacity duration-200 ${
              dimensions.ready ? "opacity-100" : "opacity-0"
            }`}
            style={{
              objectFit: "contain",
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
            }}
            onLoad={(e) => {
              // Double-check dimensions on load if not already set
              if (!dimensions.ready) {
                const dims = calculateDimensions(
                  e.target.naturalWidth,
                  e.target.naturalHeight,
                );
                setDimensions({ ...dims, ready: true });
              }
            }}
          />
        ) : (
          <div className="relative w-full h-full">
            <video
              src={url}
              className="w-full h-full object-contain"
              controls={false}
              preload="metadata"
              onClick={(e) => {
                e.stopPropagation();
                openGallery(0);
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black bg-opacity-50 rounded-full p-3">
                <Play className="w-8 h-8 text-white fill-white" />
              </div>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-black bg-opacity-75 px-3 py-2 rounded-lg">
              <p className="text-white text-sm">
                {media.status === "uploading"
                  ? `Uploading... ${media.progress || 0}%`
                  : "Uploading..."}
                {media.status === "error" ? "Retry" : null}
              </p>
            </div>
          </div>
        )}

        {/* Loading skeleton for images */}
        {!dimensions.ready && media.mimeType.includes("image") && (
          <div
            className="absolute inset-0  bg-gray-200 animate-pulse flex items-center justify-center"
            style={{
              objectFit: "contain",
              width: `${media.width}px`,
              height: `${media.height}px`,
            }}
          >
            <div className="text-gray-400 text-sm text-center">Loading...</div>
          </div>
        )}
      </div>
    );
  };

  const renderMediaGrid = () => {
    if (mediaFiles.length === 0) return null;

    if (mediaFiles.length === 1) {
      return (
        <SingleMediaPreview media={mediaFiles[0]} openGallery={openGallery} />
      );
    }

    if (mediaFiles.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden max-w-xs">
          {mediaFiles.slice(0, 2).map((media, index) => {
            const url = media.localUrl || media.cloudinaryUrl;
            return (
              <div
                key={index}
                className="relative aspect-square cursor-pointer"
                onClick={() => openGallery(index)}
              >
                {media.mimeType.includes("image") ? (
                  <img
                    src={url}
                    alt={media.name || "Image"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video src={url} className="w-full h-full object-cover" />
                )}
                {(media.status === "uploading" ||
                  media.status === "pending") && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-xs">
                      {media.status === "uploading"
                        ? `${media.progress || 0}%`
                        : "..."}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (mediaFiles.length === 3) {
      return (
        <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden max-w-xs">
          <div
            className="relative aspect-square cursor-pointer"
            onClick={() => openGallery(0)}
          >
            {mediaFiles[0].mimeType.includes("image") ? (
              <img
                src={mediaFiles[0].localUrl || mediaFiles[0].cloudinaryUrl}
                alt={mediaFiles[0].name || "Image"}
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                src={mediaFiles[0].localUrl || mediaFiles[0].cloudinaryUrl}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="grid grid-rows-2 gap-1">
            {mediaFiles.slice(1, 3).map((media, index) => {
              const url = media.localUrl || media.cloudinaryUrl;
              return (
                <div
                  key={index}
                  className="relative aspect-square cursor-pointer"
                  onClick={() => openGallery(index + 1)}
                >
                  {media.mimeType.includes("image") ? (
                    <img
                      src={url}
                      alt={media.name || "Image"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video src={url} className="w-full h-full object-cover" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // 4 or more media files
    return (
      <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden max-w-xs">
        {mediaFiles.slice(0, 3).map((media, index) => {
          const url = media.localUrl || media.cloudinaryUrl;
          return (
            <div
              key={index}
              className="relative aspect-square cursor-pointer"
              onClick={() => openGallery(index)}
            >
              {media.mimeType.includes("image") ? (
                <img
                  src={url}
                  alt={media.name || "Image"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video src={url} className="w-full h-full object-cover" />
              )}
            </div>
          );
        })}
        <div
          className="relative aspect-square cursor-pointer"
          onClick={() => openGallery(3)}
        >
          {/* Show 4th image/video as background */}
          {mediaFiles[3].mimeType.includes("image") ? (
            <img
              src={mediaFiles[3].localUrl || mediaFiles[3].cloudinaryUrl}
              alt={mediaFiles[3].name || "Image"}
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              src={mediaFiles[3].localUrl || mediaFiles[3].cloudinaryUrl}
              className="w-full h-full object-cover"
            />
          )}
          {/* Overlay for additional files count */}
          {mediaFiles.length > 4 && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
              <div className="text-center">
                <span className="text-white text-2xl font-bold">
                  +{mediaFiles.length - 4}
                </span>
                <div className="text-white text-sm font-medium mt-1">more</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAudioFiles = () => {
    if (audios.length === 0) return null;

    return (
      <div className="space-y-2 mt-2 max-w-[300px]">
        {audios.map((audio, index) => (
          <AudioPlayer
            key={index}
            audioFile={audio}
            activeAudios={activeAudios}
            isOwn={isOwn}
          />
        ))}
      </div>
    );
  };

  const AudioPlayer = ({ audioFile, isOwn, activeAudios }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const audioRef = useRef(null);
    const isActive = Array.from(activeAudios).some(
      (entry) => entry.audio.isPlaying === true,
    );

    const formatTime = (seconds) => {
      if (!seconds || isNaN(seconds) || !isFinite(seconds)) return "0:00";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      const playerEntry = { audio, setIsPlaying, isPlaying };

      // Add on mount
      activeAudios.add(playerEntry);

      // Remove on unmount
      return () => {
        activeAudios.delete(playerEntry);
      };
    }, []);

    // Initialize audio
    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      const handleLoadedMetadata = () => {
        const audioDuration = audioFile.duration;
        if (isFinite(audioDuration) && !isNaN(audioDuration)) {
          setDuration(audioDuration);
        }
        setIsLoading(false);
      };

      const handleTimeUpdate = () => {
        const audioCurrentTime = audio.currentTime;
        if (isFinite(audioCurrentTime) && !isNaN(audioCurrentTime)) {
          setCurrentTime(audioCurrentTime);
        }
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      const handleCanPlay = () => {
        setIsLoading(false);
      };

      const handleError = () => {
        console.error("Audio load error");
        setIsLoading(false);
      };

      const handleLoadStart = () => {
        setIsLoading(true);
      };

      audio.addEventListener("loadstart", handleLoadStart);
      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("canplay", handleCanPlay);
      audio.addEventListener("error", handleError);

      return () => {
        if (audio) {
          audio.removeEventListener("loadstart", handleLoadStart);
          audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
          audio.removeEventListener("timeupdate", handleTimeUpdate);
          audio.removeEventListener("ended", handleEnded);
          audio.removeEventListener("canplay", handleCanPlay);
          audio.removeEventListener("error", handleError);
        }
      };
    }, [audioFile]);

    const togglePlay = () => {
      const audio = audioRef.current;
      if (!audio) return;

      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        // Pause and reset all other audio players
        activeAudios.forEach((entry) => {
          if (entry.audio !== audio) {
            entry.audio.pause();
            entry.audio.currentTime = 0;
            entry.setIsPlaying(false); // <-- sync pause button
          }
        });

        audio.play().catch(console.error);
        setIsPlaying(true);
      }
    };

    const handleTimelineClick = (e) => {
      const audio = audioRef.current;
      if (!audio || !duration) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const timelineWidth = rect.width;
      const newTime = (clickX / timelineWidth) * duration;

      audio.currentTime = newTime;
      setCurrentTime(newTime);
    };

    const downloadFile = (file) => {
      const url = file.localUrl || file.cloudinaryUrl;
      if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name || "audio.mp3";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    };

    const url = audioFile?.localUrl || audioFile?.cloudinaryUrl;
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
      <div
        className={`flex items-center space-x-3 p-3 rounded-lg max-w-xs transition-all duration-200 ${
          isOwn ? "bg-blue-600 text-white ml-auto" : "bg-gray-700 text-white"
        }`}
        style={{ minWidth: "250px" }}
      >
        {/* Hidden audio element */}
        <audio ref={audioRef} src={url} preload="metadata" />

        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          disabled={isLoading || audioFile?.status === "uploading"}
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
            isOwn
              ? "bg-blue-500 hover:bg-blue-400 text-white"
              : "bg-gray-600 hover:bg-gray-500 text-white"
          } ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}`}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isActive || isPlaying ? (
            <Pause className="w-4 h-4 fill-white" />
          ) : (
            <Play className="w-4 h-4 fill-white ml-0.5" />
          )}
        </button>

        {/* Timeline and Time Display */}
        {audioFile?.status === "uploaded" && (
          <div className="flex-1 min-w-0">
            {/* Timeline Progress Bar */}
            <div
              className="w-full h-1 bg-white bg-opacity-30 rounded-full cursor-pointer mb-2"
              onClick={handleTimelineClick}
            >
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  isOwn ? "bg-blue-200" : "bg-gray-300"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Time Display */}
            <div className="flex justify-between items-center">
              <span className="text-xs opacity-80">
                {formatTime(currentTime)}
              </span>
              <span className="text-xs opacity-60">{formatTime(duration)}</span>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {(audioFile?.status === "uploading" ||
          audioFile?.status === "pending") && (
          <div className="mt-2 w-full">
            <div className="w-full bg-white bg-opacity-20 rounded-full h-1">
              <div
                className="h-1 rounded-full transition-all duration-300 bg-white bg-opacity-60"
                style={{ width: `${audioFile.progress || 0}%` }}
              />
            </div>
            <p className="text-xs mt-1 opacity-70">
              {audioFile.status === "uploading"
                ? `Uploading... ${audioFile.progress || 0}%`
                : "uploading..."}
            </p>
          </div>
        )}

        {/* Download Button */}
        {audioFile?.status === "uploaded" && (
          <button
            onClick={() => downloadFile(audioFile)}
            className="p-2 rounded-full transition-all duration-200 hover:scale-105 hover:bg-white hover:bg-opacity-10"
          >
            <Download className="w-4 h-4 opacity-80" />
          </button>
        )}
      </div>
    );
  };

  const renderOtherFiles = () => {
    if (otherFiles.length === 0) return null;

    return (
      <div className="space-y-2 mt-2 max-w-[300px]">
        {otherFiles.map((file, index) => (
          <div
            key={index}
            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              isOwn
                ? "bg-blue-600 bg-opacity-20 hover:bg-opacity-30"
                : "bg-gray-600 bg-opacity-20 hover:bg-opacity-30"
            }`}
          >
            <div
              className={`flex-shrink-0 ${
                isOwn ? "text-blue-200" : "text-gray-300"
              }`}
            >
              {getFileIcon(file.mimeType)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {file.name || "Unknown file"}
              </p>
              <p
                className={`text-xs ${
                  isOwn ? "text-blue-200" : "text-gray-400"
                }`}
              >
                {formatFileSize(file.size)} • {file.mimeType || "Unknown type"}
              </p>
              {(file.status === "uploading" || file.status === "pending") && (
                <div className="mt-1">
                  <div
                    className={`w-full bg-opacity-30 rounded-full h-1 ${
                      isOwn ? "bg-blue-300" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`h-1 rounded-full transition-all duration-300 ${
                        isOwn ? "bg-blue-200" : "bg-gray-200"
                      }`}
                      style={{ width: `${file.progress || 0}%` }}
                    />
                  </div>
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? "text-blue-200" : "text-gray-400"
                    }`}
                  >
                    {file.status === "uploading"
                      ? `Uploading... ${file.progress || 0}%`
                      : "Processing..."}
                  </p>
                </div>
              )}
            </div>
            {file.status === "uploaded" && (
              <button
                onClick={() => downloadFile(file)}
                className={`p-2 rounded-full transition-colors ${
                  isOwn
                    ? "hover:bg-blue-500 hover:bg-opacity-30"
                    : "hover:bg-gray-500 hover:bg-opacity-30"
                }`}
              >
                <Download
                  className={`w-5 h-5 ${
                    isOwn ? "text-blue-200" : "text-gray-300"
                  }`}
                />
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderGallery = () => {
    if (!galleryOpen || mediaFiles.length === 0) return null;

    const currentMedia = mediaFiles[currentIndex];
    const url = currentMedia.localUrl || currentMedia.cloudinaryUrl;

    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
        {/* Close button */}
        <button
          onClick={() => setGalleryOpen(false)}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-[#424242] bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Save button */}
        <button
          onClick={() => downloadFile(currentMedia)}
          className="absolute top-4 right-16 z-10 p-2 rounded-full bg-black hover:bg-[#424242] bg-opacity-50 text-white hover:bg-opacity-70 transition-colors"
        >
          <Download className="w-6 h-6" />
        </button>

        {/* Navigation buttons */}
        {mediaFiles.length > 1 && (
          <>
            <button
              onClick={() => navigateGallery("prev")}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-colors"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={() => navigateGallery("next")}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-colors"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </>
        )}

        {/* Media content */}
        <div
          className="w-full h-full flex items-center justify-center p-8"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {currentMedia.mimeType.includes("image") ? (
            <img
              src={url}
              alt={currentMedia.name || "Image"}
              className="max-w-[50vw] max-h-[80vh] w-auto h-auto object-contain"
            />
          ) : (
            <video
              src={url}
              className="max-w-[50vw] max-h-[80vh] w-auto h-auto object-contain"
              controls
              autoPlay
            />
          )}
        </div>

        {/* Counter */}
        {mediaFiles.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full">
            {currentIndex + 1} of {mediaFiles.length}
          </div>
        )}

        {/* Media info */}
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg max-w-xs">
          <p className="text-sm font-medium truncate">
            {currentMedia.name || `${currentMedia.mimeType} file`}
          </p>
          {currentMedia.size && (
            <p className="text-xs text-gray-300">
              {formatFileSize(currentMedia.size)}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {renderMediaGrid()}
      {renderAudioFiles()}
      {renderOtherFiles()}
      {renderGallery()}
    </div>
  );
};

const ChatMessage = ({
  msg,
  i,
  id,
  userId,
  isOwn,
  convoId,
  fetchSpecificDmMessages,
  convoType,
  msgType,
  scrollToMsg,
  position,
  expandedMessages = {},
  toggleReadMore,
  handleMessageSeen,
  handleRightClick,
  activeAudios,
  handleReactionsClick,
}) => {
  const messageRef = useRef(null);
  const OwnerSingleMsgStyles = "";
  const OwnerTopMsgStyles = "rounded-br-sm";
  const OwnerCenterMsgStyles = "rounded-tr-md rounded-br-md";
  const OwnerBottomMsgStyles = "rounded-tr-sm";

  const NotOwnerSingleMsgStyles = "";
  const NotOwnerTopMsgStyles = "rounded-bl-sm";
  const NotOwnerCenterMsgStyles = "rounded-tl-md rounded-bl-md";
  const NotOwnerBottomMsgStyles = "rounded-tl-sm";

  let ReplyData = msg.replyTo;

  useEffect(() => {
    if (isOwn || msg.status === "seen") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          handleMessageSeen?.(msg);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
      },
    );

    if (messageRef.current) {
      observer.observe(messageRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const hasText = msg.text && msg.text.trim().length > 0;
  const hasAttachments = msg.attachments && msg.attachments.length > 0;
  const otherFiles =
    msg.attachments.filter(
      (att) =>
        (!att?.mimeType?.includes("image") &&
          !att.mimeType?.includes("video")) ||
        att.mimeType?.includes("webm") ||
        att.mimeType?.includes("audio"),
    ).length > 0;

  return (
    <div
      key={i}
      ref={messageRef}
      className={`flex w-full px-8  my-1 ${
        isOwn ? "justify-end" : "justify-start"
      } ${msg.reactions && msg.reactions.length > 0 ? "mb-4" : ""}`}
      id={id}
    >
      <div
        onContextMenu={(e) => handleRightClick?.(e, msg, isOwn)}
        className={`flex flex-col min-w-[10%]  w-fit max-w-[70%]  rounded-2xl relative shadow-lg ${
          isOwn
            ? `bg-gradient-to-br from-blue-700 to-blue-500 text-white ml-8 ${
                position === "top" ? OwnerTopMsgStyles : ""
              } ${position === "center" ? OwnerCenterMsgStyles : ""} ${
                position === "bottom" ? OwnerBottomMsgStyles : ""
              }`
            : `bg-gradient-to-br from-gray-700 to-gray-700 text-gray-100 mr-2 ${
                position === "top" ? NotOwnerTopMsgStyles : ""
              } ${position === "center" ? NotOwnerCenterMsgStyles : ""} ${
                position === "bottom" ? NotOwnerBottomMsgStyles : ""
              }`
        }`}
        style={{
          boxShadow: isOwn
            ? "0 4px 16px 0 rgba(0, 60, 255, 0.12)"
            : "0 4px 16px 0 rgba(0,0,0,0.12)",
        }}
      >
        {msg.deletedFor?.includes("everyone") ||
        msg.deletedFor?.includes(userId) ? (
          <div className=" text-base text-gray-300 italic  p-3 rounded-xl">
            {msg.deletedFor?.includes("everyone")
              ? "This message was deleted for everyone."
              : "This message was deleted by you."}
          </div>
        ) : (
          <>
            {ReplyData && (
              <div
                className="reply-div-box p-2 hover:cursor-pointer relative"
                onClick={() =>
                  scrollToMsg(ReplyData._id, convoId, fetchSpecificDmMessages)
                }
              >
                <div
                  className={`reply-div w-full h-auto px-3 py-2 border-l-4 rounded-md flex gap-3 items-start ${
                    isOwn
                      ? "bg-blue-900/40 border-blue-400"
                      : "bg-gray-800 border-gray-600"
                  }`}
                >
                  {ReplyData.deletedFor?.includes("everyone") ||
                  ReplyData.deletedFor?.includes(userId) ? (
                    <div className=" text-base text-gray-300 italic rounded-xl">
                      <p
                        className={`font-medium ${
                          isOwn ? "text-blue-300" : "text-gray-300"
                        }`}
                      >
                        {ReplyData.senderName}
                      </p>
                      {ReplyData.deletedFor?.includes("everyone")
                        ? "This message was deleted for everyone."
                        : "This message was deleted by you."}
                    </div>
                  ) : (
                    <>
                      {/* Attachment preview (if replying to attachment) */}
                      {ReplyData.attachments?.length === 1 && (
                        <div
                          className={`w-12 h-12 min-w-12 rounded-md overflow-hidden flex items-center justify-center ${
                            isOwn ? "bg-blue-800" : "bg-gray-700"
                          }`}
                        >
                          {ReplyData.attachments[0].mimeType.includes(
                            "image",
                          ) && (
                            <img
                              src={
                                ReplyData.attachments[0].localUrl ||
                                ReplyData.attachments[0].cloudinaryUrl
                              }
                              alt="attachment"
                              className="w-full h-full object-cover"
                            />
                          )}

                          {(ReplyData.attachments[0].mimeType.includes(
                            "audio",
                          ) ||
                            ReplyData.attachments[0].mimeType.includes(
                              "webm",
                            )) && <Music className="text-blue-400 w-5 h-5" />}

                          {ReplyData.attachments[0].type.includes(
                            "document",
                          ) && <FileText className="text-white w-5 h-5" />}

                          {ReplyData.attachments[0].type.includes("video") &&
                            !ReplyData.attachments[0].type.includes(
                              "video",
                            ) && (
                              <FileImage className="text-purple-400 w-5 h-5" />
                            )}
                        </div>
                      )}

                      {/* Text or File Name */}
                      <div className="flex-1">
                        <p
                          className={`font-medium ${
                            isOwn ? "text-blue-300" : "text-gray-300"
                          }`}
                        >
                          {ReplyData.senderName}
                        </p>

                        {ReplyData.type === "textonly" ||
                        (ReplyData.type === "mixed" && ReplyData.text) ? (
                          <p
                            className={`text-sm opacity-60 text-ellipsis whitespace-nowrap overflow-hidden ${
                              isOwn ? "text-blue-100" : "text-gray-400"
                            }`}
                          >
                            {ReplyData.text}
                          </p>
                        ) : (
                          ReplyData.attachments?.length === 1 && (
                            <p
                              className={`text-sm truncate text-ellipsis max-w-[200px] ${
                                isOwn ? "text-blue-200" : "text-gray-400"
                              }`}
                            >
                              {ReplyData.attachments[0].name !== ""
                                ? ReplyData.attachments[0].name
                                : "File"}
                            </p>
                          )
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Render attachments */}
            {hasAttachments && (
              <div className={`${hasText ? "mb-2" : "mb-0"} p-1`}>
                <AttachmentRenderer
                  attachments={msg.attachments}
                  isOwn={isOwn}
                  activeAudios={activeAudios}
                />
              </div>
            )}

            {/* Message Text */}
            {hasText && (
              <div
                className={`px-3 py-2 ${hasAttachments ? "max-w-[300px]" : ""}`}
              >
                <div className="flex max-w-full flex-wrap items-end">
                  <p className="leading-relaxed text-[1rem] font-medium break-words whitespace-pre-line">
                    {msg.text.length > 500 && !expandedMessages[i] ? (
                      <>
                        {msg.text.slice(0, 500)}...
                        <button
                          onClick={() => toggleReadMore?.(i)}
                          className="text-sm font-medium text-green-300 underline ml-1"
                        >
                          Read more
                        </button>
                      </>
                    ) : (
                      <>
                        {msg.text}
                        {msg.text.length > 500 && (
                          <button
                            onClick={() => toggleReadMore?.(i)}
                            className="text-sm font-medium text-green-300 underline ml-1"
                          >
                            Read less
                          </button>
                        )}
                      </>
                    )}
                  </p>

                  <span
                    className={`text-xs ml-auto pl-2 pt-[2px] flex flex-nowrap items-end gap-1 font-medium ${
                      isOwn ? "text-blue-200" : "text-gray-400"
                    }`}
                  >
                    {msg.pinned && (
                      <span className="opacity-80">
                        <Pin size={14} />
                      </span>
                    )}
                    {formateTime(msg.createdAt, "msg")}{" "}
                    {msg.edited && <span className="opacity-80">edited</span>}
                    {isOwn && msg.status === "sent" ? (
                      <Check className="" size={20} />
                    ) : isOwn && msg.status === "seen" ? (
                      <CheckCheck className="text-white" size={20} />
                    ) : null}
                  </span>
                </div>
              </div>
            )}

            {/* If only image video attachments, show timestamp at bottom */}
            {!hasText && hasAttachments && !otherFiles && (
              <div className="absolute bottom-2 right-2 flex gap-1 items-center justify-center px-3 py-1 pt-0 rounded-3xl bg-[#00000081]">
                <div className="flex justify-end">
                  <span
                    className={`text-xs flex flex-nowrap items-end gap-1 font-medium ${
                      isOwn ? "text-blue-200" : "text-gray-400"
                    }`}
                  >
                    {msg.pinned && (
                      <span className="opacity-80">
                        <Pin size={14} />
                      </span>
                    )}
                    {formateTime(msg.createdAt, "msg")}{" "}
                    {msg.edited && <span className="opacity-80">edited</span>}
                    {isOwn && msg.status === "sent" ? (
                      <Check className="" size={20} />
                    ) : isOwn && msg.status === "seen" ? (
                      <CheckCheck className="text-white" size={20} />
                    ) : null}
                  </span>
                </div>
              </div>
            )}

            {/* If only document attachments, or other files show timestamp below files */}
            {!hasText && hasAttachments && otherFiles && (
              <div className="px-3 py-2 pt-0">
                <div className="flex justify-end">
                  <span
                    className={`text-xs flex flex-nowrap items-end gap-1 font-medium ${
                      isOwn ? "text-blue-200" : "text-gray-400"
                    }`}
                  >
                    {msg.pinned && (
                      <span className="opacity-80">
                        <Pin size={14} />
                      </span>
                    )}
                    {formateTime(msg.createdAt, "msg")}{" "}
                    {msg.edited && <span className="opacity-80">edited</span>}
                    {isOwn && msg.status === "sent" ? (
                      <Check className="" size={20} />
                    ) : isOwn && msg.status === "seen" ? (
                      <CheckCheck className="text-white" size={20} />
                    ) : null}
                  </span>
                </div>
              </div>
            )}

            {/* Reactions Display - WhatsApp Style */}
            {msg.reactions && msg.reactions.length > 0 && (
              <div
                className={`absolute left-4  bottom-2 translate-y-full z-10`}
              >
                <div
                  className={`flex items-center ${
                    isOwn
                      ? " dark:bg-blue-900 border-blue-600"
                      : "dark:bg-gray-800 border-gray-600"
                  }   rounded-full px-2 gap-1 shadow-xl border  cursor-pointer hover:shadow-xl transition-all duration-200`}
                  onClick={(e) => handleReactionsClick(e, msg, isOwn)}
                >
                  {/* Show unique emojis */}
                  {[...new Set(msg.reactions.map((r) => r.emoji))]
                    .slice(0, 3)
                    .map((emoji, index) => (
                      <span key={index} className="text-base">
                        {emoji}
                      </span>
                    ))}
                  {/* Show count */}

                  {msg.reactions.length > 1 && (
                    <span className="text-xs text-gray-600 dark:text-gray-300 font-medium ml-1">
                      {msg.reactions.length}
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(ChatMessage);
