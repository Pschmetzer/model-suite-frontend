import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { answerAPI, assignmentAPI } from "../../../utils/questionnaireApi";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import Button from "../../ui/Button";
import Badge from "../../ui/Badge";

const SubmittedView = ({ assignment: propAssignment, onBack }) => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(propAssignment);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);

  const template = assignment?.template;

  // Load assignment data if using route parameter
  useEffect(() => {
    if (assignmentId && !propAssignment) {
      loadAssignmentData();
    }
  }, [assignmentId, propAssignment]);

  // Load submitted answers on component mount
  useEffect(() => {
    if (assignment?._id) {
      loadSubmittedAnswers();
    }
  }, [assignment?._id]);

  const loadAssignmentData = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await assignmentAPI.getAssignments();
      if (result.success) {
        const foundAssignment = result.data.find((a) => a._id === assignmentId);
        if (foundAssignment) {
          setAssignment(foundAssignment);
        } else {
          setError("Assignment not found");
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to load assignment data");
    }

    setLoading(false);
  };

  const loadSubmittedAnswers = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await answerAPI.getAnswers(assignment._id);

      if (result.success && result.data) {
        setAnswers(result.data.answers || []);
      } else {
        setError(result.error || "No submitted answers found");
      }
    } catch (err) {
      setError("Failed to load submitted answers", err);
    }

    setLoading(false);
  };

  const getAnswerValue = (questionId) => {
    const answer = answers.find((a) => a.questionId === questionId);
    return answer ? answer.answer : null;
  };

  const formatAnswerDisplay = (question, answer) => {
    if (answer === null || answer === undefined || answer === "") {
      return <span className="text-gray-500 italic">No answer provided</span>;
    }

    switch (question.type) {
      case "boolean":
        return (
          <Badge color={answer === true || answer === "true" ? "green" : "red"}>
            {answer === true || answer === "true" ? "Yes" : "No"}
          </Badge>
        );

      case "multi-select":
        if (Array.isArray(answer)) {
          return (
            <div className="flex flex-wrap gap-2">
              {answer.map((option, index) => (
                <Badge key={index} color="blue" className="text-xs">
                  {option}
                </Badge>
              ))}
            </div>
          );
        }
        return <span className="text-white">{String(answer)}</span>;

      case "select":
        return <Badge color="purple">{answer}</Badge>;

      case "date":
        try {
          const date = new Date(answer);
          return (
            <span className="text-white">{date.toLocaleDateString()}</span>
          );
        } catch {
          return <span className="text-white">{answer}</span>;
        }

      case "number":
        return <span className="text-white font-mono">{answer}</span>;

      default:
        return <span className="text-white">{String(answer)}</span>;
    }
  };

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

  const getCurrentSectionQuestions = () => {
    return template.sections?.[currentSection]?.questions || [];
  };

  const calculateCompletionStats = () => {
    if (!template.sections) return { answered: 0, total: 0, percentage: 0 };

    const totalQuestions = template.sections.reduce(
      (total, section) => total + (section.questions?.length || 0),
      0,
    );

    const answeredQuestions = answers.filter(
      (answer) =>
        answer.answer !== null &&
        answer.answer !== undefined &&
        answer.answer !== "",
    ).length;

    return {
      answered: answeredQuestions,
      total: totalQuestions,
      percentage:
        totalQuestions > 0
          ? Math.round((answeredQuestions / totalQuestions) * 100)
          : 0,
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" text="Loading submitted answers..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <ErrorMessage
          message={error}
          onRetry={loadSubmittedAnswers}
          onDismiss={() => setError(null)}
        />
        <div className="text-center mt-4">
          <Button onClick={onBack || (() => navigate("/model/questionnaires"))}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-gray-400">Questionnaire template not found</p>
        {onBack && (
          <Button onClick={onBack} className="mt-4">
            Go Back
          </Button>
        )}
      </div>
    );
  }

  const stats = calculateCompletionStats();

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
            <Badge color="green">Submitted</Badge>
          </div>

          {template.description && (
            <p className="text-gray-400 mb-4">{template.description}</p>
          )}
        </div>
      </div>

      {/* Submission Summary */}
      <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg p-6 border border-gray-600">
        <h3 className="text-lg font-medium text-white mb-4">
          Submission Summary
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {stats.percentage}%
            </div>
            <div className="text-sm text-gray-400">Completion Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {stats.answered}
            </div>
            <div className="text-sm text-gray-400">Questions Answered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {stats.total}
            </div>
            <div className="text-sm text-gray-400">Total Questions</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Submitted</span>
            <span className="text-gray-300">{assignment.submittedAt}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Assignment ID</span>
            <span className="text-gray-300 font-mono text-xs">
              {assignment._id}
            </span>
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      {template.sections && template.sections.length > 1 && (
        <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg p-4 border border-gray-600">
          <div className="flex flex-wrap gap-2">
            {template.sections.map((section, index) => {
              const sectionQuestions = section.questions || [];
              const sectionAnswered = sectionQuestions.filter((q) => {
                const answer = getAnswerValue(q._id);
                return answer !== null && answer !== undefined && answer !== "";
              }).length;

              return (
                <button
                  key={index}
                  onClick={() => setCurrentSection(index)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentSection === index
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>{section.title}</span>
                    <Badge
                      color={
                        sectionAnswered === sectionQuestions.length
                          ? "green"
                          : "yellow"
                      }
                      className="text-xs"
                    >
                      {sectionAnswered}/{sectionQuestions.length}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Section Answers */}
      {template.sections && template.sections[currentSection] && (
        <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg p-6 border border-gray-600">
          <h2 className="text-xl font-medium text-white mb-6">
            {template.sections[currentSection].title}
          </h2>

          <div className="space-y-6">
            {getCurrentSectionQuestions().map((question, questionIndex) => {
              const answer = getAnswerValue(question._id);
              const hasAnswer =
                answer !== null && answer !== undefined && answer !== "";

              return (
                <div
                  key={question._id}
                  className="bg-gray-600 rounded-md p-4 border border-gray-500"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
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
                          <span className="ml-1 capitalize">
                            {question.type}
                          </span>
                        </Badge>
                        {hasAnswer && (
                          <Badge color="green" className="text-xs">
                            Answered
                          </Badge>
                        )}
                      </div>
                      <h4 className="text-white font-medium mb-2">
                        {question.label}
                      </h4>
                      {question.helpText && (
                        <p className="text-sm text-gray-400 mb-3">
                          {question.helpText}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Answer Display */}
                  <div className="bg-gray-700 rounded-md p-3 border border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-300">
                        Answer:
                      </span>
                      {hasAnswer && (
                        <svg
                          className="w-4 h-4 text-green-400"
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
                      )}
                    </div>
                    <div className="min-h-[2rem] flex items-center">
                      {formatAnswerDisplay(question, answer)}
                    </div>
                  </div>

                  {/* Show options for select/multi-select questions */}
                  {(question.type === "select" ||
                    question.type === "multi-select") &&
                    question.options && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-300 mb-2">
                          Available options:
                        </p>
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
            })}
          </div>
        </div>
      )}

      {/* Section Navigation Buttons */}
      {template.sections && template.sections.length > 1 && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
            disabled={currentSection === 0}
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Previous Section
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              setCurrentSection(
                Math.min(template.sections.length - 1, currentSection + 1),
              )
            }
            disabled={currentSection === template.sections.length - 1}
          >
            Next Section
            <svg
              className="w-4 h-4 ml-2"
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
          </Button>
        </div>
      )}

      {/* Footer Info */}
      <div className="text-center text-sm text-gray-500">
        <p>This questionnaire was submitted on {assignment.submittedAt}</p>
        <p className="mt-1">Submission cannot be modified after submission</p>
      </div>
    </div>
  );
};

export default SubmittedView;
