import React, { useState, useEffect, useCallback } from "react";
import { answerAPI } from "../../../utils/questionnaireApi";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import Button from "../../ui/Button";
import Badge from "../../ui/Badge";

const ResponseAnalytics = ({ templateId, template, onBack }) => {
  const [_responses, setResponses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // Helper functions first
  const getTotalQuestions = useCallback((template) => {
    return (
      template.sections?.reduce(
        (total, section) => total + (section.questions?.length || 0),
        0,
      ) || 0
    );
  }, []);

  const calculateQuestionAnalytics = useCallback((responses, template) => {
    const questionAnalytics = [];

    template.sections?.forEach((section) => {
      section.questions?.forEach((question) => {
        const questionResponses = responses
          .map((response) =>
            response.answers?.find(
              (answer) => answer.questionId === question._id,
            ),
          )
          .filter(Boolean);

        const totalResponses = responses.length;
        const answeredCount = questionResponses.filter(
          (response) =>
            response.answer !== null &&
            response.answer !== undefined &&
            response.answer !== "",
        ).length;

        const responseRate =
          totalResponses > 0
            ? Math.round((answeredCount / totalResponses) * 100)
            : 0;

        // Calculate answer distribution based on question type
        let answerDistribution = {};

        if (question.type === "boolean") {
          const yesCount = questionResponses.filter(
            (r) => r.answer === true || r.answer === "true",
          ).length;
          const noCount = questionResponses.filter(
            (r) => r.answer === false || r.answer === "false",
          ).length;
          answerDistribution = {
            Yes: yesCount,
            No: noCount,
          };
        } else if (question.type === "select") {
          questionResponses.forEach((response) => {
            if (response.answer) {
              answerDistribution[response.answer] =
                (answerDistribution[response.answer] || 0) + 1;
            }
          });
        } else if (question.type === "multi-select") {
          questionResponses.forEach((response) => {
            if (Array.isArray(response.answer)) {
              response.answer.forEach((option) => {
                answerDistribution[option] =
                  (answerDistribution[option] || 0) + 1;
              });
            }
          });
        }

        questionAnalytics.push({
          questionId: question._id,
          questionLabel: question.label,
          questionType: question.type,
          sectionTitle: section.title,
          totalResponses,
          answeredCount,
          responseRate,
          answerDistribution,
          isRequired: question.required,
        });
      });
    });

    return questionAnalytics;
  }, []);

  const calculateResponseDistribution = useCallback((responses) => {
    const distribution = {};

    responses.forEach((response) => {
      if (response.submittedAt) {
        const date = new Date(response.submittedAt).toDateString();
        distribution[date] = (distribution[date] || 0) + 1;
      }
    });

    return distribution;
  }, []);

  const calculateAnalytics = useCallback(
    (responses, template) => {
      if (!responses || responses.length === 0 || !template) {
        return {
          totalResponses: 0,
          completionRate: 0,
          averageCompletionTime: 0,
          questionAnalytics: [],
          responseDistribution: {},
        };
      }

      const totalResponses = responses.length;

      // Calculate completion rates
      const completedResponses = responses.filter((response) => {
        const totalQuestions = getTotalQuestions(template);
        const answeredQuestions =
          response.answers?.filter(
            (answer) =>
              answer.answer !== null &&
              answer.answer !== undefined &&
              answer.answer !== "",
          ).length || 0;
        return answeredQuestions === totalQuestions;
      }).length;

      const completionRate =
        totalResponses > 0
          ? Math.round((completedResponses / totalResponses) * 100)
          : 0;

      // Calculate question-level analytics
      const questionAnalytics = calculateQuestionAnalytics(responses, template);

      // Calculate response distribution over time
      const responseDistribution = calculateResponseDistribution(responses);

      return {
        totalResponses,
        completionRate,
        completedResponses,
        questionAnalytics,
        responseDistribution,
      };
    },
    [
      getTotalQuestions,
      calculateQuestionAnalytics,
      calculateResponseDistribution,
    ],
  );

  const loadResponsesAndAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let result;
      if (templateId) {
        // Load analytics for specific template
        result = await answerAPI.getTemplateAnswers(templateId);
      } else {
        // For all templates analytics - we need to implement this
        // For now, show a message that this requires template selection
        setError("Please select a specific template to view analytics");
        setLoading(false);
        return;
      }

      if (result.success) {
        const responses = result.data.answers || result.data;
        setResponses(responses);
        const analyticsData = calculateAnalytics(responses, template);
        setAnalytics(analyticsData);
      } else {
        setError(result.error);
      }
    } catch {
      setError("Failed to load response analytics");
    }

    setLoading(false);
  }, [templateId, template, calculateAnalytics]);

  // Load responses and calculate analytics
  useEffect(() => {
    loadResponsesAndAnalytics();
  }, [loadResponsesAndAnalytics]);

  const handleExportAnalytics = () => {
    if (!analytics) return;

    const csvContent = generateAnalyticsCSV(analytics);

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `questionnaire-analytics-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateAnalyticsCSV = (analytics) => {
    const headers = [
      "Question",
      "Section",
      "Type",
      "Required",
      "Total Responses",
      "Answered Count",
      "Response Rate (%)",
      "Answer Distribution",
    ];

    const rows = analytics.questionAnalytics.map((question) => [
      question.questionLabel,
      question.sectionTitle,
      question.questionType,
      question.isRequired ? "Yes" : "No",
      question.totalResponses,
      question.answeredCount,
      question.responseRate,
      Object.entries(question.answerDistribution)
        .map(([answer, count]) => `${answer}: ${count}`)
        .join("; "),
    ]);

    const csvRows = [headers, ...rows];

    return csvRows
      .map((row) =>
        row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" text="Calculating analytics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <ErrorMessage
          message={error}
          onRetry={loadResponsesAndAnalytics}
          onDismiss={() => setError(null)}
        />
      </div>
    );
  }

  if (!analytics || analytics.totalResponses === 0) {
    return (
      <div className="max-w-6xl mx-auto text-center py-12">
        <div className="max-w-md mx-auto">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-white mb-2">
            No Response Data Available
          </h3>
          <p className="text-gray-400 mb-6">
            {template
              ? `No models have submitted responses for "${template.title}" yet. Analytics will be available once models start answering the questionnaire.`
              : "No analytics data available for the selected template."}
          </p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              You can assign this template to models to start collecting
              responses.
            </p>
          </div>
        </div>
        {onBack && (
          <Button onClick={onBack} className="mt-6">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Templates
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            {onBack && (
              <Button size="sm" variant="ghost" onClick={onBack}>
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </Button>
            )}
            <h2 className="text-2xl font-bold text-white">
              Response Analytics
            </h2>
          </div>
          <p className="text-gray-400 mt-1">
            Analyze questionnaire response patterns and insights
          </p>
        </div>

        <Button variant="outline" onClick={handleExportAnalytics}>
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export Analytics
        </Button>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Responses"
          value={analytics.totalResponses}
          color="blue"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          }
        />
        <StatCard
          title="Completion Rate"
          value={`${analytics.completionRate}%`}
          color="green"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatCard
          title="Completed Responses"
          value={analytics.completedResponses}
          color="purple"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          }
        />
        <StatCard
          title="Questions"
          value={analytics.questionAnalytics.length}
          color="yellow"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </div>

      {/* Question Analytics */}
      <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg p-6 border border-gray-600">
        <h3 className="text-lg font-medium text-white mb-6">
          Question-by-Question Analysis
        </h3>

        <div className="space-y-4">
          {analytics.questionAnalytics.map((question, index) => (
            <QuestionAnalyticsCard
              key={question.questionId}
              question={question}
              index={index}
              onClick={() => setSelectedQuestion(question)}
            />
          ))}
        </div>
      </div>

      {/* Response Distribution Chart */}
      {Object.keys(analytics.responseDistribution).length > 0 && (
        <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg p-6 border border-gray-600">
          <h3 className="text-lg font-medium text-white mb-6">
            Response Distribution Over Time
          </h3>
          <ResponseDistributionChart
            distribution={analytics.responseDistribution}
          />
        </div>
      )}

      {/* Question Detail Modal */}
      {selectedQuestion && (
        <QuestionDetailModal
          question={selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
        />
      )}
    </div>
  );
};

// Statistics Card Component
const StatCard = ({ title, value, color, icon }) => {
  const colorClasses = {
    blue: "text-blue-400",
    green: "text-green-400",
    purple: "text-purple-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg p-6 border border-gray-600">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colorClasses[color]} bg-opacity-20`}>
          {icon}
        </div>
        <div className="ml-4">
          <div className={`text-2xl font-bold ${colorClasses[color]}`}>
            {value}
          </div>
          <div className="text-sm text-gray-400">{title}</div>
        </div>
      </div>
    </div>
  );
};

// Question Analytics Card Component
const QuestionAnalyticsCard = ({ question, index, onClick }) => {
  const getResponseRateColor = (rate) => {
    if (rate >= 80) return "green";
    if (rate >= 60) return "yellow";
    return "red";
  };

  return (
    <div
      className="bg-gray-600 rounded-lg p-4 border border-gray-500 hover:border-gray-400 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-gray-300">
              Question {index + 1}
            </span>
            {question.isRequired && (
              <Badge color="red" className="text-xs">
                Required
              </Badge>
            )}
            <Badge color="blue" className="text-xs">
              {question.questionType}
            </Badge>
          </div>
          <h4 className="text-white font-medium mb-1">
            {question.questionLabel}
          </h4>
          <p className="text-sm text-gray-400">{question.sectionTitle}</p>
        </div>
        <div className="text-right">
          <Badge color={getResponseRateColor(question.responseRate)}>
            {question.responseRate}% response rate
          </Badge>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">
          {question.answeredCount} of {question.totalResponses} responses
        </span>
        <span className="text-gray-400">Click to view details</span>
      </div>

      {/* Response Rate Bar */}
      <div className="mt-3">
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              question.responseRate >= 80
                ? "bg-green-500"
                : question.responseRate >= 60
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
            style={{ width: `${question.responseRate}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// Response Distribution Chart Component
const ResponseDistributionChart = ({ distribution }) => {
  const maxCount = Math.max(...Object.values(distribution));

  return (
    <div className="space-y-3">
      {Object.entries(distribution)
        .sort(([a], [b]) => new Date(a) - new Date(b))
        .map(([date, count]) => (
          <div key={date} className="flex items-center space-x-4">
            <div className="w-24 text-sm text-gray-400 flex-shrink-0">
              {new Date(date).toLocaleDateString()}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-700 rounded-full h-4 relative">
                  <div
                    className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-300 w-8 text-right">
                  {count}
                </span>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
};

// Question Detail Modal Component
const QuestionDetailModal = ({ question, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl p-6 max-w-2xl max-h-[80vh] overflow-y-auto relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-white focus:outline-none"
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">
              Question Analytics
            </h3>
            <p className="text-gray-400">{question.questionLabel}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">
                {question.responseRate}%
              </div>
              <div className="text-sm text-gray-400">Response Rate</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">
                {question.answeredCount}
              </div>
              <div className="text-sm text-gray-400">Total Answers</div>
            </div>
          </div>

          {Object.keys(question.answerDistribution).length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-white mb-4">
                Answer Distribution
              </h4>
              <div className="space-y-3">
                {Object.entries(question.answerDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([answer, count]) => {
                    const percentage =
                      question.answeredCount > 0
                        ? Math.round((count / question.answeredCount) * 100)
                        : 0;
                    return (
                      <div key={answer} className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-white">{answer}</span>
                            <span className="text-sm text-gray-400">
                              {count} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResponseAnalytics;
