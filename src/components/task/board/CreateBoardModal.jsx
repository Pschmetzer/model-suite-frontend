"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { usePermissions } from "../../../hooks/usePermissions";
import PermissionGuard from "../../common/PermissionGuard";

const CreateBoardModal = ({ onClose, onCreateBoard }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedBackground, setSelectedBackground] = useState(
    "bg-gradient-to-br from-blue-500 to-cyan-500",
  );
  const [error, setError] = useState("");
  const { hasPermission, hasFullAccess } = usePermissions();

  const backgroundOptions = [
    "bg-gradient-to-br from-blue-500 to-cyan-500",
    "bg-gradient-to-br from-purple-500 to-pink-500",
    "bg-gradient-to-br from-green-500 to-teal-500",
    "bg-gradient-to-br from-orange-500 to-red-500",
    "bg-gradient-to-br from-indigo-500 to-purple-500",
    "bg-gradient-to-br from-yellow-500 to-orange-500",
    "bg-gradient-to-br from-pink-500 to-rose-500",
    "bg-gradient-to-br from-teal-500 to-green-500",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      await onCreateBoard({
        title: title.trim(),
        description: description.trim(),
        background: selectedBackground,
      });
    } catch (err) {
      setError(err.message || "Failed to create board");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Create Board</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors duration-200"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Board Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter board title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24"
                placeholder="Enter board description"
              />
            </div>

            {/* Background Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Background
              </label>
              <div className="grid grid-cols-4 gap-2">
                {backgroundOptions.map((bg, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedBackground(bg)}
                    className={`h-12 rounded-lg relative transition-all duration-200 ${bg}`}
                  >
                    {selectedBackground === bg && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-lg">
                        <Check size={16} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <PermissionGuard permission="tasks.create" fallback={hasFullAccess}>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Create Board
              </button>
            </PermissionGuard>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateBoardModal;
