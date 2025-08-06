import React from "react";
import AssignedQuestionnaires from "../../components/questionnaire/model/AssignedQuestionnaires";

const ModelQuestionnaires = () => {
  // Get model ID from localStorage
  const user = JSON.parse(localStorage.getItem("auth"))?.user;
  const modelId = user?._id;

  if (!modelId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-400">
              Unable to load questionnaires. Please log in again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            My Questionnaires
          </h1>
          <p className="text-gray-400">
            View and complete questionnaires assigned to you
          </p>
        </div>

        {/* Content */}
        <AssignedQuestionnaires modelId={modelId} />
      </div>
    </div>
  );
};

export default ModelQuestionnaires;
