import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { answerAPI, assignmentAPI } from "../../../utils/questionnaireApi";
import { validateQuestionnaire } from "../shared/FormValidation";
import QuestionRenderer from "../shared/QuestionRenderer";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import SuccessNotification from "../shared/SuccessNotification";
import Button from "../../ui/Button";
import Badge from "../../ui/Badge";
import Modal from "../../ui/Modal";
import { usePermissions } from "../../../hooks/usePermissions";
import PermissionGuard from "../../common/PermissionGuard";

const QuestionnaireForm = ({
  assignment: propAssignment,
  onBack,
  onSubmitComplete,
}) => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { hasPermission, hasFullAccess } = usePermissions();
  // Initialize assignment to empty object to avoid undefined errors
  const [assignment, setAssignment] = useState(propAssignment || {});
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [currentSection, setCurrentSection] = useState(0);
  const [submitModal, setSubmitModal] = useState(false);

  // Question pagination state
  const [questionsToShow, setQuestionsToShow] = useState(5);
  const [loadingMoreQuestions, setLoadingMoreQuestions] = useState(false);

  const template = assignment?.templateId;
  const isReadOnly = assignment?.status === "Submitted";

  // Load assignment data if using route parameter
  useEffect(() => {
    if (assignmentId && !propAssignment) {
      loadAssignmentData();
    }
  }, [assignmentId, propAssignment]);

  // Load existing answers on component mount
  useEffect(() => {
    if (assignment?._id) {
      loadExistingAnswers();
    }
  }, [assignment?._id]);

  const loadAssignmentData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch assignments available to the model and find the current one
      const result = await assignmentAPI.getModelAssignments();
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
    } catch {
      setError("Failed to load assignment data");
    }

    setLoading(false);
  };

  const loadExistingAnswers = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await answerAPI.getAnswers(template._id);

      if (result.success && result.data) {
        setAnswers(result.data.answers || []);
      } else if (!result.success && result.error !== "No answers found") {
        setError(result.error);
      }
    } catch {
      setError("Failed to load existing answers");
    }

    setLoading(false);
  };

  const handleAnswerChange = (questionId, value) => {
    if (isReadOnly) return;

    setAnswers((prev) => {
      const existingIndex = prev.findIndex((a) => a.questionId === questionId);

      if (existingIndex >= 0) {
        // Update existing answer
        const newAnswers = [...prev];
        newAnswers[existingIndex] = { questionId, answer: value };
        return newAnswers;
      } else {
        // Add new answer
        return [...prev, { questionId, answer: value }];
      }
    });

    // Clear validation error for this question
    if (validationErrors[questionId]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const handleSaveProgress = async () => {
    setSaving(true);
    setError(null);

    try {
      const result = await answerAPI.saveAnswers(template._id, answers);

      if (result.success) {
        setSuccess("Progress saved successfully!");

        // Update assignment status to 'In progress' if it was 'Not started'
        if (assignment.status === "Not started") {
          await assignmentAPI.updateAssignmentStatus(
            assignment._id,
            "In progress",
          );
        }
      } else {
        setError(result.error);
      }
    } catch {
      setError("Failed to save progress. Please try again.");
    }

    setSaving(false);
  };

  const handleSubmit = async () => {
    if (isReadOnly) return;

    // Validate all answers
    const validation = validateQuestionnaire(template, answers);

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setError("Please fix the validation errors before submitting.");

      // Scroll to first error
      const firstErrorElement = document.querySelector('[data-error="true"]');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      return;
    }

    setSubmitModal(true);
  };

  const confirmSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const result = await answerAPI.submitAnswers(template._id, answers);

      if (result.success) {
        setSuccess("Questionnaire submitted successfully!");
        setSubmitModal(false);

        // Update assignment status to 'Submitted'
        await assignmentAPI.updateAssignmentStatus(assignment._id, "Submitted");

        // Redirect to questionnaire list so dashboard reloads new status
        navigate("/model/questionnaires");
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError("Failed to submit questionnaire. Please try again.", error);
    }

    setSubmitting(false);
  };

  const getAnswerValue = (questionId) => {
    const answer = answers.find((a) => a.questionId === questionId);
    return answer ? answer.answer : null;
  };

  const calculateProgress = () => {
    if (!template.sections || template.sections.length === 0) return 0;

    const totalQuestions = template.sections.reduce(
      (total, section) => total + (section.questions?.length || 0),
      0,
    );

    if (totalQuestions === 0) return 0;

    const answeredQuestions = answers.filter(
      (answer) =>
        answer.answer !== null &&
        answer.answer !== undefined &&
        answer.answer !== "",
    ).length;

    return Math.round((answeredQuestions / totalQuestions) * 100);
  };

  const getCurrentSectionQuestions = () => {
    return template.sections?.[currentSection]?.questions || [];
  };

  const getVisibleQuestions = () => {
    const allQuestions = getCurrentSectionQuestions();
    return allQuestions.slice(0, questionsToShow);
  };

  const hasMoreQuestions = () => {
    const allQuestions = getCurrentSectionQuestions();
    return allQuestions.length > questionsToShow;
  };

  const loadMoreQuestions = () => {
    setLoadingMoreQuestions(true);

    // Simulate loading delay for better UX
    setTimeout(() => {
      setQuestionsToShow((prev) => prev + 5);
      setLoadingMoreQuestions(false);
    }, 500);
  };

  const resetQuestionPagination = () => {
    setQuestionsToShow(5);
  };

  const canGoToNextSection = () => {
    const currentQuestions = getCurrentSectionQuestions();
    const requiredQuestions = currentQuestions.filter((q) => q.required);

    return requiredQuestions.every((question) => {
      const answer = getAnswerValue(question._id);
      return answer !== null && answer !== undefined && answer !== "";
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" text="Loading questionnaire..." />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-gray-400">Questionnaire template not found</p>
        <Button
          onClick={onBack || (() => navigate("/model/questionnaires"))}
          className="mt-4"
        >
          Go Back
        </Button>
      </div>
    );
  }

  const progress = calculateProgress();
  const validation = validateQuestionnaire(template, answers);

  return (
    <div className="bg-gray-50 dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 min-h-screen overflow-y-auto">
      <div className="max-w-4xl mx-auto p-3 space-y-4 pb-8">
        {/* Added pb-8 for bottom padding */}
        {/* Compact Header */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {onBack && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onBack}
                  className="text-gray-300 hover:text-white px-2 py-1 text-sm"
                >
                  ← Back
                </Button>
              )}
              <h1 className="text-xl font-bold text-white">{template.title}</h1>
              {isReadOnly && (
                <Badge color="green" className="text-xs">
                  Submitted
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {!isReadOnly && (
                <PermissionGuard
                  permission="questionnaire.edit"
                  fallback={hasFullAccess}
                >
                  <Button
                    variant="outline"
                    onClick={handleSaveProgress}
                    disabled={saving}
                    className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 border-gray-500 text-white"
                  >
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!validation.summary.canSubmit || submitting}
                    className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </Button>
                </PermissionGuard>
              )}
            </div>
          </div>

          {template.description && (
            <p className="text-sm text-gray-400 mt-2">{template.description}</p>
          )}

          {/* Compact Progress */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-400">Progress: {progress}%</span>
              {saving && <span className="text-yellow-400">Saving...</span>}
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  progress === 100
                    ? "bg-green-500"
                    : progress > 0
                      ? "bg-blue-500"
                      : "bg-gray-600"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-gradient-to-r from-green-500/20 to-green-400/20 border border-green-500 rounded-xl p-4 shadow-lg">
            <SuccessNotification
              message={success}
              onDismiss={() => setSuccess(null)}
            />
          </div>
        )}
        {error && (
          <div className="bg-gradient-to-r from-red-500/20 to-red-400/20 border border-red-500 rounded-xl p-4 shadow-lg">
            <ErrorMessage message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {/* Compact Section Navigation */}
        {template.sections && template.sections.length > 1 && (
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
            <div className="flex items-center space-x-1 overflow-x-auto">
              {template.sections.map((section, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentSection(index);
                    resetQuestionPagination();
                  }}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all whitespace-nowrap ${
                    currentSection === index
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  {index + 1}. {section.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Compact Main Content */}
        {template.sections && template.sections[currentSection] && (
          <div className="bg-gray-800 rounded-lg border border-gray-600">
            {/* Section Header */}
            <div className="px-4 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">
                {template.sections[currentSection].title}
              </h2>
              {template.sections[currentSection].description && (
                <p className="text-sm text-gray-400 mt-1">
                  {template.sections[currentSection].description}
                </p>
              )}
              <div className="text-xs text-gray-500 mt-1">
                Section {currentSection + 1} of {template.sections.length} •{" "}
                {getCurrentSectionQuestions().length} questions
              </div>
            </div>

            {/* Questions */}
            <div className="p-4 space-y-4">
              {getVisibleQuestions().map((question, index) => (
                <div
                  key={question._id}
                  data-error={!!validationErrors[question._id]}
                  className="p-4 bg-gray-700/30 rounded-lg border border-gray-600"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs font-medium text-white">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <QuestionRenderer
                        question={question}
                        value={getAnswerValue(question._id)}
                        onChange={handleAnswerChange}
                        error={validationErrors[question._id]}
                        disabled={isReadOnly}
                        className="space-y-2"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Load More Questions Button */}
              {hasMoreQuestions() && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={loadMoreQuestions}
                    disabled={loadingMoreQuestions}
                    className="text-sm px-6 py-2 bg-gray-800 hover:bg-blue-600 border border-gray-600 hover:border-blue-500 text-gray-300 hover:text-white transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
                  >
                    {loadingMoreQuestions ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>Load More</span>
                        <svg
                          className="w-4 h-4 transition-transform duration-200 group-hover:translate-y-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    )}
                  </Button>
                </div>
              )}

              {/* Questions Counter */}
              <div className="text-center pt-2">
                <span className="text-xs text-gray-500">
                  Showing{" "}
                  {Math.min(
                    questionsToShow,
                    getCurrentSectionQuestions().length,
                  )}{" "}
                  of {getCurrentSectionQuestions().length} questions
                </span>
              </div>
            </div>

            {/* Compact Navigation */}
            {template.sections.length > 1 && (
              <div className="px-4 py-3 border-t border-gray-700 flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentSection(Math.max(0, currentSection - 1));
                    resetQuestionPagination();
                  }}
                  disabled={currentSection === 0}
                  className="text-xs px-3 py-1 bg-gray-700 border-gray-600 text-white"
                >
                  Previous
                </Button>

                <span className="text-xs text-gray-400">
                  {currentSection + 1} / {template.sections.length}
                </span>

                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentSection(
                      Math.min(
                        template.sections.length - 1,
                        currentSection + 1,
                      ),
                    );
                    resetQuestionPagination();
                  }}
                  disabled={
                    currentSection === template.sections.length - 1 ||
                    (!canGoToNextSection() && !isReadOnly)
                  }
                  className="text-xs px-3 py-1 bg-gray-700 border-gray-600 text-white"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Auto-save Toggle */}
        {!isReadOnly && (
          <div className="flex items-center justify-center">
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl p-4 border border-gray-600">
              <label className="flex items-center space-x-3 text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSaveEnabled}
                  onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                  className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm font-medium">Auto-save enabled</span>
              </label>
            </div>
          </div>
        )}

        {/* Submit Confirmation Modal */}
        <Modal open={submitModal} onClose={() => setSubmitModal(false)}>
          <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-xl p-8 shadow-2xl border border-gray-600">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 mb-6">
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-white mb-3">
                Submit Questionnaire
              </h3>

              {/* Description */}
              <p className="text-gray-300 mb-6 leading-relaxed">
                Are you sure you want to submit this questionnaire? Once
                submitted, you won't be able to make changes.
              </p>

              {/* Progress Summary */}
              <div className="bg-gradient-to-r from-blue-500/20 to-blue-400/20 border border-blue-500 rounded-xl p-4 mb-8">
                <div className="text-blue-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Questions Completed:
                    </span>
                    <span className="font-bold">
                      {validation.summary.validAnswers} of{" "}
                      {validation.summary.totalQuestions}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Required Questions:
                    </span>
                    <span className="font-bold">
                      {validation.summary.requiredAnswered} of{" "}
                      {validation.summary.requiredQuestions}
                    </span>
                  </div>
                  <div className="w-full bg-blue-900 rounded-full h-2 mt-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 justify-center">
                <Button
                  variant="ghost"
                  onClick={() => setSubmitModal(false)}
                  disabled={submitting}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmSubmit}
                  disabled={submitting}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" color="white" />
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    "Submit Questionnaire"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default QuestionnaireForm;
