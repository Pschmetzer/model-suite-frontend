// components/rewards/RewardWidget.jsx
import React, { useState, useEffect } from "react";
import {
  Trophy,
  Star,
  TrendingUp,
  Gift,
  ChevronRight,
  Zap,
  Users,
} from "lucide-react";
import NewBadgeModal from "./NewBadgeModal";

const RewardWidget = ({ allRewards, onViewAllRewards }) => {
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [newBadges, setNewBadges] = useState([]);

  // Check for new badges from ANY reward type
  useEffect(() => {
    const collectNewBadges = () => {
      const badges = [];

      // Check all reward types for new badges
      if (allRewards) {
        Object.entries(allRewards).forEach(([rewardType, rewardData]) => {
          if (rewardData?.newBadges?.length > 0) {
            badges.push(
              ...rewardData.newBadges.map((badge) => ({
                ...badge,
                rewardType, // Add source type
                rewardDescription: getRewardTypeDescription(rewardType),
              })),
            );
          }
        });
      }

      if (badges.length > 0) {
        setNewBadges(badges);
        setShowBadgeModal(true);
      }
    };

    collectNewBadges();
  }, [allRewards]);

  // Calculate universal stats
  const stats = calculateUniversalStats(allRewards);
  const nextMilestone = getNextMilestone(allRewards);

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Your Achievements
          </h3>
          <button
            onClick={onViewAllRewards}
            className="text-blue-600 hover:text-blue-700 flex items-center text-sm"
          >
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        {/* Universal Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-2">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {stats.totalPoints}
            </p>
            <p className="text-sm text-gray-600">Total Points</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {stats.totalBadges}
            </p>
            <p className="text-sm text-gray-600">Badges Earned</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              Level {stats.highestLevel}
            </p>
            <p className="text-sm text-gray-600">Current Level</p>
          </div>
        </div>

        {/* Active Rewards Summary */}
        <div className="space-y-3 mb-6">
          {Object.entries(allRewards || {}).map(([rewardType, rewardData]) => (
            <RewardTypeCard
              key={rewardType}
              rewardType={rewardType}
              rewardData={rewardData}
            />
          ))}
        </div>

        {/* Next Milestone Progress */}
        {nextMilestone && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Next Goal: {nextMilestone.badgeName}
              </span>
              <span className="text-sm text-gray-500">
                {nextMilestone.current}/{nextMilestone.target}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${nextMilestone.percentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {nextMilestone.description}
            </p>
          </div>
        )}

        {/* Today's Achievements */}
        {stats.todayPoints > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center">
              <Gift className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">
                +{stats.todayPoints} points earned today!
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Universal New Badge Modal */}
      <NewBadgeModal
        isOpen={showBadgeModal}
        badges={newBadges}
        onClose={() => {
          setShowBadgeModal(false);
          setNewBadges([]);
        }}
      />
    </>
  );
};

// Individual reward type display
const RewardTypeCard = ({ rewardType, rewardData }) => {
  const getRewardIcon = (type) => {
    switch (type) {
      case "login_streak":
        return <TrendingUp className="w-4 h-4" />;
      case "post_count":
        return <Zap className="w-4 h-4" />;
      case "model_signup":
        return <Users className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const getRewardColor = (type) => {
    switch (type) {
      case "login_streak":
        return "text-orange-600 bg-orange-100";
      case "post_count":
        return "text-blue-600 bg-blue-100";
      case "model_signup":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getRewardTitle = (type) => {
    switch (type) {
      case "login_streak":
        return "Login Streak";
      case "post_count":
        return "Content Created";
      case "model_signup":
        return "Models Signed";
      default:
        return "Achievement";
    }
  };

  const getValue = (type, data) => {
    switch (type) {
      case "login_streak":
        return `${data.currentValue || 0} days`;
      case "post_count":
        return `${data.currentValue || 0} posts`;
      case "model_signup":
        return `${data.currentValue || 0} models`;
      default:
        return data.currentValue || 0;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${getRewardColor(rewardType)}`}
        >
          {getRewardIcon(rewardType)}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">
            {getRewardTitle(rewardType)}
          </p>
          <p className="text-xs text-gray-600">
            {getValue(rewardType, rewardData)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-800">
          {rewardData.totalPoints || 0} pts
        </p>
        <p className="text-xs text-gray-600">Level {rewardData.level || 1}</p>
      </div>
    </div>
  );
};

// Helper functions
const calculateUniversalStats = (allRewards) => {
  let totalPoints = 0;
  let totalBadges = 0;
  let highestLevel = 1;
  let todayPoints = 0;

  if (allRewards) {
    Object.values(allRewards).forEach((rewardData) => {
      totalPoints += rewardData.totalPoints || 0;
      totalBadges += rewardData.badges?.length || 0;
      highestLevel = Math.max(highestLevel, rewardData.level || 1);
      todayPoints += rewardData.pointsEarned || 0;
    });
  }

  return {
    totalPoints,
    totalBadges,
    highestLevel,
    todayPoints,
  };
};

const getNextMilestone = (allRewards) => {
  // Find the closest next milestone across all reward types
  const milestones = [];

  if (allRewards?.login_streak) {
    const loginMilestones = [3, 7, 14, 30, 60, 90];
    const current = allRewards.login_streak.currentValue || 0;

    for (const target of loginMilestones) {
      if (current < target) {
        milestones.push({
          badgeName: `${target}-Day Login Streak`,
          current,
          target,
          percentage: Math.round((current / target) * 100),
          description: `${target - current} more days of daily logins`,
          priority: target - current,
        });
        break;
      }
    }
  }

  if (allRewards?.post_count) {
    const postMilestones = [1, 10, 50, 100, 500];
    const current = allRewards.post_count.currentValue || 0;

    for (const target of postMilestones) {
      if (current < target) {
        milestones.push({
          badgeName: `${target} Posts Created`,
          current,
          target,
          percentage: Math.round((current / target) * 100),
          description: `${target - current} more posts to create`,
          priority: target - current,
        });
        break;
      }
    }
  }

  if (allRewards?.model_signup) {
    const signupMilestones = [1, 5, 10, 25, 50];
    const current = allRewards.model_signup.currentValue || 0;

    for (const target of signupMilestones) {
      if (current < target) {
        milestones.push({
          badgeName: `${target} Models Signed`,
          current,
          target,
          percentage: Math.round((current / target) * 100),
          description: `${target - current} more models to sign`,
          priority: target - current,
        });
        break;
      }
    }
  }

  // Return the milestone that's closest to completion
  return milestones.sort((a, b) => b.percentage - a.percentage)[0] || null;
};

const getRewardTypeDescription = (rewardType) => {
  switch (rewardType) {
    case "login_streak":
      return "Daily login consistency";
    case "post_count":
      return "Content creation milestone";
    case "model_signup":
      return "Model recruitment achievement";
    default:
      return "Achievement unlocked";
  }
};

export default RewardWidget;
