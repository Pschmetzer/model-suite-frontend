import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
  Search,
  Filter,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { voiceAPI } from "../../services/voiceAPI";
import {
  setSearch,
  setPage,
  setSectionId,
  toggleSelect,
  clearSelection,
  selectMany,
  deselectMany,
} from "../../globalstate/questionsUiSlice";

const QuestionSelector = ({ onSelectionChange }) => {
  const dispatch = useDispatch();
  const { selectedIds, search, page, pageSize, sectionId } = useSelector(
    (state) => state.questionsUi,
  );

  const [sections, setSections] = useState([]);
  const [questionsBySection, setQuestionsBySection] = useState({});
  const [allQuestions, setAllQuestions] = useState([]);
  const [loading, setLoading] = useState({
    sections: false,
    questions: false,
    allQuestions: false,
  });
  const [error, setError] = useState(null);

  const [expandedSections, setExpandedSections] = useState(new Set());
  const [filterBySection, setFilterBySection] = useState("all");
  const [viewMode, setViewMode] = useState("sections"); // 'sections' or 'all'

  // Fetch sections on mount
  useEffect(() => {
    console.log("🔄 QuestionSelector: Fetching sections on mount...");
    fetchSections();
  }, []);

  // Fetch all questions when viewMode changes to 'all'
  useEffect(() => {
    if (viewMode === "all") {
      fetchAllQuestions();
    }
  }, [viewMode, search, page]);

  // Notify parent component of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      const selectedQuestionIds = Object.keys(selectedIds);
      onSelectionChange(selectedQuestionIds);
    }
  }, [selectedIds, onSelectionChange]);

  const fetchSections = async () => {
    try {
      setLoading((prev) => ({ ...prev, sections: true }));
      setError(null);
      const response = await voiceAPI.getSections();
      setSections(response.data.data?.sections || []);
    } catch (err) {
      console.error("❌ Error fetching sections:", err);
      setError("Failed to load sections");
    } finally {
      setLoading((prev) => ({ ...prev, sections: false }));
    }
  };

  const fetchAllQuestions = async () => {
    try {
      setLoading((prev) => ({ ...prev, allQuestions: true }));
      setError(null);
      const response = await voiceAPI.getAllQuestions();
      setAllQuestions(response.data.data?.questions || []);
    } catch (err) {
      console.error("❌ Error fetching all questions:", err);
      setError("Failed to load questions");
    } finally {
      setLoading((prev) => ({ ...prev, allQuestions: false }));
    }
  };

  const fetchQuestionsBySection = async (sectionId) => {
    try {
      setLoading((prev) => ({ ...prev, questions: true }));
      setError(null);
      const response = await voiceAPI.getQuestionsBySection(sectionId);
      const questions = response.data.data?.questions || [];
      setQuestionsBySection((prev) => ({
        ...prev,
        [sectionId]: questions,
      }));
    } catch (err) {
      console.error(
        `❌ Error fetching questions for section ${sectionId}:`,
        err,
      );
      setError("Failed to load section questions");
    } finally {
      setLoading((prev) => ({ ...prev, questions: false }));
    }
  };

  // Debug logging for sections and questions
  useEffect(() => {
    console.log("📊 QuestionSelector Debug:", {
      sections: sections,
      sectionsCount: sections.length,
      questionsBySection: questionsBySection,
      allQuestions: allQuestions,
      selectedIds: selectedIds,
      loading: loading,
      error: error,
    });
  }, [sections, questionsBySection, allQuestions, selectedIds, loading, error]);

  const handleSectionToggle = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
      // Fetch questions for this section if not already loaded
      if (!questionsBySection[sectionId]) {
        fetchQuestionsBySection(sectionId);
      }
    }
    setExpandedSections(newExpanded);
  };

  const handleQuestionToggle = (questionId) => {
    dispatch(toggleSelect(questionId));
  };

  const handleSelectAll = () => {
    const filteredQuestions = getFilteredQuestions();
    const questionIds = filteredQuestions.map((q) => q._id);
    dispatch(selectMany(questionIds));
  };

  const handleDeselectAll = () => {
    dispatch(clearSelection());
  };

  const getFilteredQuestions = () => {
    let questions = [];

    if (viewMode === "all") {
      questions = allQuestions;
    } else {
      // Collect questions from expanded sections
      sections.forEach((section) => {
        if (questionsBySection[section._id]) {
          questions = [...questions, ...questionsBySection[section._id]];
        }
      });
    }

    // Filter by search term
    if (search) {
      questions = questions.filter(
        (question) =>
          question.text.toLowerCase().includes(search.toLowerCase()) ||
          question.category?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Filter by section
    if (filterBySection !== "all") {
      questions = questions.filter(
        (question) => question.sectionId === filterBySection,
      );
    }

    return questions;
  };

  const getSectionQuestions = (sectionId) => {
    if (!questionsBySection[sectionId]) return [];

    let questions = questionsBySection[sectionId];

    if (search) {
      questions = questions.filter((question) =>
        question.text.toLowerCase().includes(search.toLowerCase()),
      );
    }

    return questions;
  };

  const isQuestionSelected = (questionId) => {
    return !!selectedIds[questionId];
  };

  if (loading.sections || loading.allQuestions) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading sections...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 font-medium">Error loading questions</div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
        <button
          onClick={() => {
            fetchSections();
            if (viewMode === "all") {
              fetchAllQuestions();
            }
          }}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Handle empty sections case
  if (!loading.sections && (!sections || sections.length === 0)) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="text-yellow-800 font-medium">No sections available</div>
        <div className="text-yellow-600 text-sm mt-1">
          {!sections
            ? "Sections data is not available."
            : "No question sections have been created yet. Please contact your administrator to set up question sections."}
        </div>
        <button
          onClick={() => {
            console.log("🔄 Retrying sections fetch...");
            fetchSections();
          }}
          className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          Retry Loading Sections
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Select Questions for Assignment
          </h3>
          <div className="text-sm text-gray-500">
            {Object.keys(selectedIds).length} question
            {Object.keys(selectedIds).length !== 1 ? "s" : ""} selected
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={search}
              onChange={(e) => dispatch(setSearch(e.target.value))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("sections")}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === "sections"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              By Sections
            </button>
            <button
              onClick={() => setViewMode("all")}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === "all"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Questions
            </button>
          </div>

          {/* Section Filter */}
          {viewMode === "all" && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={filterBySection}
                onChange={(e) => setFilterBySection(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Sections</option>
                {sections &&
                  sections.map((section) => (
                    <option key={section._id} value={section._id}>
                      {section.title}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSelectAll}
            className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
          >
            Select All Visible
          </button>
          <button
            onClick={handleDeselectAll}
            className="px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {viewMode === "sections" ? (
          /* Sections View */
          <div className="p-4">
            {sections &&
              sections.map((section) => (
                <div key={section._id} className="mb-4 last:mb-0">
                  {/* Section Header */}
                  <button
                    onClick={() => handleSectionToggle(section._id)}
                    className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {expandedSections.has(section._id) ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="font-medium text-gray-900">
                        {section.title}
                      </span>
                      {section.description && (
                        <span className="text-sm text-gray-500">
                          • {section.description}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {questionsBySection[section._id]?.length || 0} questions
                    </div>
                  </button>

                  {/* Section Questions */}
                  {expandedSections.has(section._id) && (
                    <div className="mt-2 ml-6 space-y-2">
                      {loading.questions ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-sm text-gray-600">
                            Loading questions...
                          </span>
                        </div>
                      ) : (
                        getSectionQuestions(section._id).map((question) => (
                          <QuestionItem
                            key={question._id}
                            question={question}
                            isSelected={isQuestionSelected(question._id)}
                            onToggle={() => handleQuestionToggle(question._id)}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        ) : (
          /* All Questions View */
          <div className="p-4 space-y-2">
            {loading.allQuestions ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading questions...</span>
              </div>
            ) : (
              getFilteredQuestions().map((question) => (
                <QuestionItem
                  key={question._id}
                  question={question}
                  isSelected={isQuestionSelected(question._id)}
                  onToggle={() => handleQuestionToggle(question._id)}
                  showSection={true}
                  sections={sections}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {Object.keys(selectedIds).length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            <strong>{Object.keys(selectedIds).length}</strong> question
            {Object.keys(selectedIds).length !== 1 ? "s" : ""} selected for
            assignment
          </div>
        </div>
      )}
    </div>
  );
};

const QuestionItem = ({
  question,
  isSelected,
  onToggle,
  showSection = false,
  sections = [],
}) => {
  const section = showSection
    ? sections.find((s) => s._id === question.sectionId)
    : null;

  // Tag colors mapping
  const getTagColor = (tag) => {
    const colors = {
      good_morning: "bg-yellow-100 text-yellow-800",
      good_night: "bg-purple-100 text-purple-800",
      flirty: "bg-pink-100 text-pink-800",
      sensual: "bg-red-100 text-red-800",
      affectionate: "bg-rose-100 text-rose-800",
      non_sexual: "bg-green-100 text-green-800",
      conversation_starter: "bg-blue-100 text-blue-800",
      mixed_tone: "bg-gray-100 text-gray-800",
      romantic: "bg-pink-100 text-pink-800",
      playful: "bg-orange-100 text-orange-800",
      intimate: "bg-red-100 text-red-800",
      casual: "bg-gray-100 text-gray-800",
      sweet: "bg-pink-100 text-pink-800",
      naughty: "bg-red-100 text-red-800",
      teasing: "bg-orange-100 text-orange-800",
      caring: "bg-green-100 text-green-800",
      loving: "bg-rose-100 text-rose-800",
      sleepy: "bg-indigo-100 text-indigo-800",
      energetic: "bg-yellow-100 text-yellow-800",
      soft_spoken: "bg-blue-100 text-blue-800",
    };
    return colors[tag] || "bg-gray-100 text-gray-800";
  };

  return (
    <div
      className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
        isSelected
          ? "border-blue-300 bg-blue-50"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {isSelected ? (
            <CheckSquare className="h-4 w-4 text-blue-600" />
          ) : (
            <Square className="h-4 w-4 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 leading-relaxed">
            {question.text}
          </p>

          {/* Tags */}
          {question.tags && question.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {question.tags.map((tag, index) => (
                <span
                  key={index}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTagColor(
                    tag,
                  )}`}
                >
                  {tag.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}

          {showSection && section && (
            <p className="text-xs text-gray-500 mt-1">
              Section: {section.title}
            </p>
          )}
          {question.category && (
            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
              {question.category}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionSelector;
