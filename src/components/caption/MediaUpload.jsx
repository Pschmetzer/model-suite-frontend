import React, { useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Upload,
  X,
  Image,
  Video,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  setCurrentMedia,
  clearCurrentMedia,
  uploadMedia,
} from "../../globalstate/captionSlice.jsx";
import { captionUtils } from "../../services/captionService.js";
import Button from "../ui/Button.jsx";

const MediaUpload = ({ onUploadComplete }) => {
  const dispatch = useDispatch();
  const { isUploading, uploadProgress, uploadError, currentMedia } =
    useSelector((state) => state.caption);

  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = useCallback(
    async (file) => {
      // Reset previous errors
      setValidationError(null);

      // Validate file
      const validation = captionUtils.validateFile(file);
      if (!validation.isValid) {
        setValidationError(validation.error);
        return;
      }

      // First, set the preview data immediately for UI feedback
      const filePreview = {
        name: file.name,
        size: captionUtils.formatFileSize(file.size),
        type: captionUtils.getFileCategory(file.type),
        preview: URL.createObjectURL(file),
      };
      dispatch(setCurrentMedia(filePreview));

      // Then upload the file to get the mediaUrl
      try {
        const uploadResult = await dispatch(uploadMedia(file)).unwrap();

        if (onUploadComplete) {
          // Don't pass the File object to avoid Redux serialization issues
          onUploadComplete(uploadResult);
        }
      } catch (error) {
        console.error("Upload failed:", error);
        // The upload error will be handled by Redux state
      }
    },
    [dispatch, onUploadComplete],
  );

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile],
  );

  const handleFileInput = useCallback(
    (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile],
  );

  const clearMedia = useCallback(() => {
    dispatch(clearCurrentMedia());
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [dispatch]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  if (currentMedia) {
    return (
      <div className="space-y-4">
        {/* Current Media Display */}
        <div className="relative bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          {/* Upload New Media Button - Moved to top right corner */}
          <div className="absolute top-2 right-12 z-10">
            <Button
              onClick={triggerFileInput}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 p-2"
              title="Upload new media"
            >
              <Upload className="w-4 h-4" />
            </Button>
          </div>

          <button
            onClick={clearMedia}
            className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors z-10"
            disabled={isUploading}
            title="Remove current media"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start space-x-4">
            {/* File Preview */}
            <div className="flex-shrink-0">
              {currentMedia.type === "video" ? (
                <div className="relative w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <Video className="w-8 h-8 text-gray-500" />
                  <video
                    src={currentMedia.preview}
                    className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-50"
                    muted
                  />
                </div>
              ) : (
                <img
                  src={currentMedia.preview}
                  alt={currentMedia.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {currentMedia.name}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentMedia.size} • {currentMedia.type}
              </p>

              {/* Upload Progress with AI Processing Message */}
              {isUploading && (
                <div className="mt-3">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      AI is processing your{" "}
                      {currentMedia.type === "video" ? "video" : "image"}...
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {uploadProgress}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Please wait while we analyze your media for optimal caption
                    generation
                  </p>
                </div>
              )}

              {/* Upload Success */}
              {!isUploading && currentMedia.mediaUrl && (
                <div className="flex items-center mt-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">
                    Ready for caption generation
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Upload Error */}
          {uploadError && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" />
                <span className="text-sm text-red-600 dark:text-red-400">
                  {uploadError}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*"
          onChange={handleFileInput}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Drag & Drop Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*"
          onChange={handleFileInput}
        />

        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
              <Upload className="w-8 h-8 text-gray-500 dark:text-gray-400" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Upload your media
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Drag and drop your image or video here, or click to browse
            </p>
          </div>

          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <Image className="w-4 h-4 mr-1" />
              Images
            </div>
            <div className="flex items-center">
              <Video className="w-4 h-4 mr-1" />
              Videos
            </div>
          </div>

          <Button
            onClick={triggerFileInput}
            variant="outline"
            className="mx-auto"
          >
            Browse Files
          </Button>
        </div>
      </div>

      {/* File Requirements */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>• Supported formats: JPEG, PNG, GIF, WebP, MP4, MOV, AVI, WebM</p>
        <p>• Maximum file size: 20MB</p>
        <p>• Best results with high-quality, clear images and videos</p>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" />
            <span className="text-sm text-red-600 dark:text-red-400">
              {validationError}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
