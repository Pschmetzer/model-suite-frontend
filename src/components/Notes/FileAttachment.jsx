import React, { useState, useRef } from "react";
import {
  Paperclip,
  Upload,
  File,
  Image,
  FileText,
  Download,
  X,
  Eye,
  AlertCircle,
  Check,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

/**
 * File attachment component for notes
 * Handles file uploads, previews, and management
 */
const FileAttachment = ({
  noteId,
  attachments = [],
  onAttachmentsUpdate,
  maxFileSize = 10 * 1024 * 1024,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const fileInputRef = useRef(null);

  // Allowed file types
  const allowedTypes = {
    image: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ],
    document: [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    spreadsheet: [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    presentation: [
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    archive: [
      "application/zip",
      "application/x-rar-compressed",
      "application/x-7z-compressed",
    ],
    other: ["application/json", "text/csv", "text/xml"],
  };

  // Get file type category
  const getFileCategory = (mimeType) => {
    for (const [category, types] of Object.entries(allowedTypes)) {
      if (types.includes(mimeType)) {
        return category;
      }
    }
    return "other";
  };

  // Get file icon based on type
  const getFileIcon = (mimeType) => {
    const category = getFileCategory(mimeType);

    switch (category) {
      case "image":
        return <Image className="h-5 w-5" />;
      case "document":
      case "spreadsheet":
      case "presentation":
        return <FileText className="h-5 w-5" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Validate file
  const validateFile = (file) => {
    // Check file size
    if (file.size > maxFileSize) {
      toast.error(`File size must be less than ${formatFileSize(maxFileSize)}`);
      return false;
    }

    // Check file type
    const allAllowedTypes = Object.values(allowedTypes).flat();
    if (!allAllowedTypes.includes(file.type)) {
      toast.error("File type not supported");
      return false;
    }

    // Check if file already exists
    const existingFile = attachments.find(
      (att) => att.name === file.name && att.size === file.size,
    );
    if (existingFile) {
      toast.error("File already attached");
      return false;
    }

    return true;
  };

  // Handle file upload
  const handleFileUpload = async (files) => {
    const fileList = Array.from(files);
    const validFiles = fileList.filter(validateFile);

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      const newAttachments = [];

      for (const file of validFiles) {
        // Create file object
        const attachment = {
          id: Date.now() + Math.random(),
          noteId,
          name: file.name,
          size: file.size,
          type: file.type,
          category: getFileCategory(file.type),
          uploadedAt: new Date().toISOString(),
          url: URL.createObjectURL(file), // For preview purposes
          file: file, // Store actual file for upload
        };

        newAttachments.push(attachment);
      }

      // Update attachments
      const updatedAttachments = [...attachments, ...newAttachments];
      onAttachmentsUpdate?.(updatedAttachments);

      toast.success(`${newAttachments.length} file(s) attached successfully`);
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
    // Reset input
    e.target.value = "";
  };

  // Remove attachment
  const removeAttachment = (attachmentId) => {
    const attachment = attachments.find((att) => att.id === attachmentId);
    if (attachment && attachment.url) {
      URL.revokeObjectURL(attachment.url);
    }

    const updatedAttachments = attachments.filter(
      (att) => att.id !== attachmentId,
    );
    onAttachmentsUpdate?.(updatedAttachments);
    toast.success("Attachment removed");
  };

  // Download attachment
  const downloadAttachment = (attachment) => {
    if (attachment.url) {
      const link = document.createElement("a");
      link.href = attachment.url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Preview attachment
  const previewAttachment = (attachment) => {
    if (attachment.category === "image") {
      setPreviewFile(attachment);
    } else {
      // For non-image files, try to open in new tab
      if (attachment.url) {
        window.open(attachment.url, "_blank");
      }
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Paperclip className="h-5 w-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Attachments</h3>
          <span className="bg-green-900/20 text-green-400 text-xs px-2 py-1 rounded-full">
            {attachments.length}
          </span>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "Uploading..." : "Upload Files"}
        </button>
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
        accept={Object.values(allowedTypes).flat().join(",")}
      />

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors mb-6 ${
          dragOver
            ? "border-green-400 bg-green-900/10"
            : "border-gray-600 hover:border-gray-500"
        }`}
      >
        <Upload
          className={`h-12 w-12 mx-auto mb-4 ${
            dragOver ? "text-green-400" : "text-gray-400"
          }`}
        />
        <p className="text-white font-medium mb-2">
          {dragOver ? "Drop files here" : "Drag & drop files here"}
        </p>
        <p className="text-sm text-gray-400">
          or{" "}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-green-400 hover:text-green-300 underline"
          >
            browse files
          </button>
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Max file size: {formatFileSize(maxFileSize)}
        </p>
      </div>

      {/* Attachments List */}
      <div className="space-y-3">
        {attachments.length === 0 ? (
          <div className="text-center py-8">
            <Paperclip className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No attachments</p>
            <p className="text-sm text-gray-500 mt-1">
              Upload files to attach them to this note
            </p>
          </div>
        ) : (
          attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="bg-gray-900 border border-gray-600 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-green-400">
                  {getFileIcon(attachment.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <h5 className="text-white font-medium truncate">
                    {attachment.name}
                  </h5>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                    <span>{formatFileSize(attachment.size)}</span>
                    <span className="capitalize">{attachment.category}</span>
                    <span>
                      {new Date(attachment.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                {attachment.category === "image" && (
                  <button
                    onClick={() => previewAttachment(attachment)}
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded transition-colors"
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}

                <button
                  onClick={() => downloadAttachment(attachment)}
                  className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded transition-colors"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>

                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                  title="Remove"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Image Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h4 className="text-white font-medium truncate">
                {previewFile.name}
              </h4>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <img
                src={previewFile.url}
                alt={previewFile.name}
                className="max-w-full max-h-[70vh] object-contain mx-auto"
              />
            </div>

            <div className="flex justify-center gap-3 p-4 border-t border-gray-700">
              <button
                onClick={() => downloadAttachment(previewFile)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
              <button
                onClick={() => setPreviewFile(null)}
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Type Info */}
      <div className="mt-6 p-4 bg-gray-900 border border-gray-600 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-white">
            Supported File Types
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-green-400 font-medium">Images:</span>
            <span className="text-gray-400 ml-2">
              JPEG, PNG, GIF, WebP, SVG
            </span>
          </div>
          <div>
            <span className="text-blue-400 font-medium">Documents:</span>
            <span className="text-gray-400 ml-2">PDF, DOC, DOCX, TXT</span>
          </div>
          <div>
            <span className="text-purple-400 font-medium">Spreadsheets:</span>
            <span className="text-gray-400 ml-2">XLS, XLSX</span>
          </div>
          <div>
            <span className="text-yellow-400 font-medium">Presentations:</span>
            <span className="text-gray-400 ml-2">PPT, PPTX</span>
          </div>
          <div>
            <span className="text-red-400 font-medium">Archives:</span>
            <span className="text-gray-400 ml-2">ZIP, RAR, 7Z</span>
          </div>
          <div>
            <span className="text-gray-400 font-medium">Other:</span>
            <span className="text-gray-400 ml-2">JSON, CSV, XML</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileAttachment;
