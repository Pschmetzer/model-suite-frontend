import React from "react";
const DetailedRewardCard = ({ rewardType, rewardData }) => {
  const getRewardTitle = (type) => {
    switch (type) {
      case "login_streak":
        return "Daily Login Streak";
      case "post_count":
        return "Content Creation";
      case "model_signup":
        return "Model Recruitment";
      default:
        return "Achievement";
    }
  };

  const getRewardDescription = (type) => {
    switch (type) {
      case "login_streak":
        return "Consistency in daily platform engagement";
      case "post_count":
        return "Creating and sharing content";
      case "model_signup":
        return "Successfully recruiting new models";
      default:
        return "Various platform achievements";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">
            {getRewardTitle(rewardType)}
          </h3>
          <p className="text-gray-600">{getRewardDescription(rewardType)}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">
            {rewardData.totalPoints || 0}
          </p>
          <p className="text-sm text-gray-600">Total Points</p>
        </div>
      </div>

      {/* Current Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-lg font-semibold text-gray-800">
            {rewardData.currentValue || 0}
          </p>
          <p className="text-sm text-gray-600">Current Value</p>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-lg font-semibold text-blue-600">
            Level {rewardData.level || 1}
          </p>
          <p className="text-sm text-gray-600">Current Level</p>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-lg font-semibold text-purple-600">
            {rewardData.badges?.length || 0}
          </p>
          <p className="text-sm text-gray-600">Badges Earned</p>
        </div>
      </div>

      {/* Badges Grid */}
      {rewardData.badges?.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-gray-800 mb-3">
            Earned Badges
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {rewardData.badges.map((badge, index) => (
              <div
                key={index}
                className="text-center p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
              >
                <div className="text-2xl mb-1">{badge.icon || "🏆"}</div>
                <p className="text-sm font-medium text-gray-800">
                  {badge.name}
                </p>
                <p className="text-xs text-gray-600">{badge.description}</p>
                {badge.earnedAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(badge.earnedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailedRewardCard;
