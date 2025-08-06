import { useState, useRef } from "react";
import { Upload, X, File, Image, Video, FileText } from "lucide-react";

const AttachmentUpload = ({ onUpload, onCancel }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    setSelectedFile(file);

    // Create preview for images and videos
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("video/")) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const getFileIcon = (file) => {
    if (!file) return <File />;
    if (file.type.startsWith("image/")) return <Image />;
    if (file.type.startsWith("video/")) return <Video />;
    if (file.type.includes("pdf")) return <FileText />;
    return <File />;
  };

  const getFilePreview = () => {
    if (!selectedFile) return null;

    if (selectedFile.type.startsWith("image/")) {
      return (
        <img
          src={preview}
          alt="Preview"
          className="max-h-48 rounded-lg object-contain"
        />
      );
    }

    if (selectedFile.type.startsWith("video/")) {
      return (
        <video src={preview} controls className="max-h-48 rounded-lg">
          Your browser does not support the video tag.
        </video>
      );
    }

    return (
      <div className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg">
        {getFileIcon(selectedFile)}
        <span className="text-sm truncate">{selectedFile.name}</span>
      </div>
    );
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    await onUpload(formData);
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      {!selectedFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? "border-blue-500 bg-blue-500/10"
              : "border-gray-600 hover:border-gray-500"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files[0])}
            accept="image/*,video/*,application/pdf"
          />
          <Upload className="w-8 h-8 mx-auto mb-4 text-gray-400" />
          <p className="text-sm text-gray-400 mb-2">
            Drag and drop a file here, or click to select
          </p>
          <p className="text-xs text-gray-500">
            Supports images, videos, and PDFs
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {getFilePreview()}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setSelectedFile(null);
                setPreview(null);
                if (onCancel) onCancel();
              }}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Upload
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttachmentUpload;
