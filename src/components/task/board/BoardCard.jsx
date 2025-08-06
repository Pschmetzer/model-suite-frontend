"use client";
import { motion } from "framer-motion";
import { Star, Layout, Trash2, MoreVertical } from "lucide-react";
import { useState } from "react";

const BoardCard = ({
  board,
  index,
  onToggleStar,
  onClick,
  isModel,
  onDelete,
}) => {
  const [showActions, setShowActions] = useState(false);

  const defaultGradients = [
    "from-purple-500 to-pink-500",
    "from-blue-500 to-cyan-500",
    "from-green-500 to-teal-500",
    "from-orange-500 to-red-500",
    "from-indigo-500 to-purple-500",
    "from-yellow-500 to-orange-500",
  ];

  const background =
    board.background ||
    `bg-gradient-to-br ${defaultGradients[index % defaultGradients.length]}`;

  const formatDate = (date) => {
    if (!date) return "No activity";
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowActions(false);

    // Confirm deletion
    const confirmed = window.confirm(
      `Are you sure you want to delete the board "${board.title}"? This will delete all lists and cards in this board. This action cannot be undone.`,
    );

    if (confirmed) {
      onDelete(board._id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="group cursor-pointer h-full"
      onClick={onClick}
    >
      <div className="relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 h-full bg-gray-800 border border-gray-700">
        {/* Board Header with Gradient */}
        <div className={`${background} p-4 relative`}>
          <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-all duration-300" />

          {/* Icon and Actions */}
          <div className="relative flex items-center justify-between">
            <Layout className="w-6 h-6 text-white opacity-80" />
            {!isModel && (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleStar(board._id);
                  }}
                  className="p-1.5 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200"
                >
                  <Star
                    size={16}
                    className={`${
                      board.starred
                        ? "text-yellow-300 fill-current"
                        : "text-white hover:text-yellow-300"
                    } transition-colors duration-200`}
                  />
                </button>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowActions(!showActions);
                    }}
                    className="p-1.5 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200"
                  >
                    <MoreVertical size={16} className="text-white" />
                  </button>
                  {showActions && (
                    <div className="absolute right-0 mt-1 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1 z-10">
                      <button
                        onClick={handleDelete}
                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-400/10 flex items-center gap-2"
                      >
                        <Trash2 size={14} />
                        Delete Board
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="text-white font-semibold mt-3 text-lg relative line-clamp-1">
            {board.title}
          </h3>
        </div>

        {/* Board Content */}
        <div className="p-4">
          <p className="text-sm text-gray-400 mb-4 line-clamp-2 min-h-[40px]">
            {board.description || "No description"}
          </p>

          {/* Board Stats */}
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <span>{board.lists?.length || 0} lists</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{formatDate(board.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BoardCard;
