import React, { useState, useEffect, useCallback } from "react";
import {
  templateAPI,
  questionnaireUtils,
} from "../../../utils/questionnaireApi";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import Button from "../../ui/Button";
import Badge from "../../ui/Badge";

const TemplateView = ({
  templateId,
  template: initialTemplate,
  onEdit,
  onAssign,
  onBack,
}) => {
  const [template, setTemplate] = useState(initialTemplate);
  const [loading, setLoading] = useState(!initialTemplate);
  const [error, setError] = useState(null);

  const loadTemplate = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await templateAPI.getTemplate(templateId);

    if (result.success) {
      const formattedTemplate = questionnaireUtils.formatTemplate(result.data);
      setTemplate(formattedTemplate);
    } else {
      setError(result.error);
    }

    setLoading(false);
  }, [templateId]);

  // Load template if not provided
  useEffect(() => {
    if (!initialTemplate && templateId) {
      loadTemplate();
    }
  }, [templateId, initialTemplate, loadTemplate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" text="Loading template..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <ErrorMessage
          message={error}
          onRetry={loadTemplate}
          onDismiss={() => setError(null)}
        />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-gray-400">Template not found</p>
        {onBack && (
          <Button onClick={onBack} className="mt-4">
            Go Back
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
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
            <h1 className="text-2xl font-bold text-white">{template.title}</h1>
          </div>

          {template.description && (
            <p className="text-gray-400 mb-4">{template.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Badge color="blue">{template.sectionCount} sections</Badge>
            <Badge color="purple">{template.questionCount} questions</Badge>
            <span className="text-sm text-gray-500">
              Created {template.createdAt}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {onAssign && (
            <Button onClick={() => onAssign(template)}>
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
              Assign to Models
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" onClick={() => onEdit(template)}>
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit Template
            </Button>
          )}
        </div>
      </div>

      {/* Template Content */}
      <div className="space-y-6">
        {template.sections?.map((section, sectionIndex) => (
          <SectionView
            key={section._id || sectionIndex}
            section={section}
            sectionIndex={sectionIndex}
          />
        ))}
      </div>

      {/* Template Statistics */}
      <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg p-6 border border-gray-600">
        <h3 className="text-lg font-medium text-white mb-4">
          Template Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {template.sectionCount}
            </div>
            <div className="text-sm text-gray-400">Sections</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {template.questionCount}
            </div>
            <div className="text-sm text-gray-400">Questions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {template.sections?.reduce(
                (count, section) =>
                  count +
                  (section.questions?.filter((q) => q.required).length || 0),
                0,
              )}
            </div>
            <div className="text-sm text-gray-400">Required Questions</div>
          </div>
        </div>
      </div>

      {/* Question Types Breakdown */}
      <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg p-6 border border-gray-600">
        <h3 className="text-lg font-medium text-white mb-4">Question Types</h3>
        <QuestionTypesBreakdown template={template} />
      </div>
    </div>
  );
};

// Section View Component
const SectionView = ({ section }) => {
  return (
    <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg p-6 border border-gray-600">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium text-white">{section.title}</h2>
        <Badge color="gray">{section.questions?.length || 0} questions</Badge>
      </div>

      <div className="space-y-4">
        {section.questions?.map((question, questionIndex) => (
          <QuestionView
            key={question._id || questionIndex}
            question={question}
            questionIndex={questionIndex}
          />
        ))}
      </div>
    </div>
  );
};

// Question View Component
const QuestionView = ({ question, questionIndex }) => {
  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case "text":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h7"
            />
          </svg>
        );
      case "number":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
            />
          </svg>
        );
      case "date":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        );
      case "select":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        );
      case "multi-select":
        return (
          <svg
            className="w-4 h-4"
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
        );
      case "boolean":
        return (
          <svg
            className="w-4 h-4"
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
        );
      default:
        return (
          <svg
            className="w-4 h-4"
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
        );
    }
  };

  const getQuestionTypeColor = (type) => {
    switch (type) {
      case "text":
        return "blue";
      case "number":
        return "green";
      case "date":
        return "purple";
      case "select":
        return "yellow";
      case "multi-select":
        return "pink";
      case "boolean":
        return "indigo";
      default:
        return "gray";
    }
  };

  return (
    <div className="bg-gray-600 rounded-md p-4 border border-gray-500">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-gray-300">
              Question {questionIndex + 1}
            </span>
            {question.required && (
              <Badge color="red" className="text-xs">
                Required
              </Badge>
            )}
            <Badge
              color={getQuestionTypeColor(question.type)}
              className="text-xs flex items-center"
            >
              {getQuestionTypeIcon(question.type)}
              <span className="ml-1 capitalize">{question.type}</span>
            </Badge>
          </div>
          <h4 className="text-white font-medium">{question.label}</h4>
          {question.helpText && (
            <p className="text-sm text-gray-400 mt-1">{question.helpText}</p>
          )}
        </div>
      </div>

      {/* Show options for select/multi-select questions */}
      {(question.type === "select" || question.type === "multi-select") &&
        question.options && (
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-300 mb-2">Options:</p>
            <div className="flex flex-wrap gap-2">
              {question.options.map((option, optionIndex) => (
                <span
                  key={optionIndex}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-700 text-gray-300 border border-gray-600"
                >
                  {option}
                </span>
              ))}
            </div>
          </div>
        )}
    </div>
  );
};

// Question Types Breakdown Component
const QuestionTypesBreakdown = ({ template }) => {
  const questionTypes = {};

  template.sections?.forEach((section) => {
    section.questions?.forEach((question) => {
      questionTypes[question.type] = (questionTypes[question.type] || 0) + 1;
    });
  });

  const typeLabels = {
    text: "Text",
    number: "Number",
    date: "Date",
    select: "Single Select",
    "multi-select": "Multi Select",
    boolean: "Yes/No",
  };

  const typeColors = {
    text: "blue",
    number: "green",
    date: "purple",
    select: "yellow",
    "multi-select": "pink",
    boolean: "indigo",
  };

  if (Object.keys(questionTypes).length === 0) {
    return <p className="text-gray-400 text-center py-4">No questions found</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Object.entries(questionTypes).map(([type, count]) => (
        <div key={type} className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Badge color={typeColors[type]} className="text-sm">
              {count}
            </Badge>
            <span className="text-sm text-gray-300">
              {typeLabels[type] || type}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TemplateView;
