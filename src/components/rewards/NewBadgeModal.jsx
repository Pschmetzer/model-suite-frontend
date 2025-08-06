import React from "react";
import { Trophy, X, Star, TrendingUp, Zap, Users } from "lucide-react";

const NewBadgeModal = ({ isOpen, badges, onClose }) => {
  if (!isOpen || !badges.length) return null;

  const getRewardTypeIcon = (rewardType) => {
    switch (rewardType) {
      case "login_streak":
        return <TrendingUp className="w-6 h-6 text-white" />;
      case "post_count":
        return <Zap className="w-6 h-6 text-white" />;
      case "model_signup":
        return <Users className="w-6 h-6 text-white" />;
      default:
        return <Star className="w-6 h-6 text-white" />;
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "legendary":
        return "from-yellow-400 to-orange-500";
      case "epic":
        return "from-purple-400 to-pink-500";
      case "rare":
        return "from-blue-400 to-indigo-500";
      default:
        return "from-gray-400 to-gray-500";
    }
  };

  const getRarityBorder = (rarity) => {
    switch (rarity) {
      case "legendary":
        return "border-yellow-400";
      case "epic":
        return "border-purple-400";
      case "rare":
        return "border-blue-400";
      default:
        return "border-gray-400";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative animate-bounce-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Celebration Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mx-auto mb-4 animate-pulse">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            🎉 Achievement Unlocked! 🎉
          </h2>
          <p className="text-gray-600">
            You've earned {badges.length} new badge
            {badges.length > 1 ? "s" : ""}!
          </p>
        </div>

        {/* Badges */}
        <div className="space-y-4">
          {badges.map((badge, index) => (
            <div
              key={`${badge.badgeId}-${index}`}
              className={`border-2 ${getRarityBorder(badge.rarity)} rounded-lg p-4 bg-gradient-to-r ${getRarityColor(badge.rarity)} bg-opacity-10`}
            >
              <div className="flex items-center">
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-r ${getRarityColor(badge.rarity)} flex items-center justify-center mr-4`}
                >
                  {getRewardTypeIcon(badge.rewardType)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-800">
                      {badge.badgeName}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full bg-gradient-to-r ${getRarityColor(badge.rarity)} text-white`}
                    >
                      {badge.rarity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {badge.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {badge.rewardDescription}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all"
        >
          Awesome! Continue
        </button>
      </div>
    </div>
  );
};

export default NewBadgeModal;
