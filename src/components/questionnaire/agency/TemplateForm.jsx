import React, { useState, useEffect } from "react";
import { ReactSortable } from "react-sortablejs";
import { templateAPI } from "../../../utils/questionnaireApi";
import { validateTemplate } from "../shared/FormValidation";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import SuccessNotification from "../shared/SuccessNotification";
import Button from "../../ui/Button";
import Modal from "../../ui/Modal";

const TemplateForm = ({ template, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    sections: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [loadingDefault, setLoadingDefault] = useState(false);

  const isEditing = !!template;

  // Initialize form data
  useEffect(() => {
    if (template) {
      // Add IDs to sections and questions if they don't exist
      const sectionsWithIds = (template.sections || []).map(
        (section, sIndex) => ({
          ...section,
          id: section.id || `section-${sIndex}-${Date.now()}`,
          questions: (section.questions || []).map((question, qIndex) => ({
            ...question,
            id: question.id || `question-${sIndex}-${qIndex}-${Date.now()}`,
          })),
        }),
      );

      setFormData({
        title: template.title || "",
        description: template.description || "",
        sections: sectionsWithIds,
      });
    } else {
      // For new templates, load the default template
      loadDefaultTemplate();
    }
  }, [template]);

  // Load default template from backend
  const loadDefaultTemplate = async () => {
    setLoadingDefault(true);
    try {
      const result = await templateAPI.getTemplates();
      if (result.success) {
        // Find the default template (agencyId is null)
        const defaultTemplate = result.data.find(
          (t) => t.agencyId === null && t.title.includes("Default"),
        );

        if (defaultTemplate) {
          // Add IDs to default template sections and questions
          const sectionsWithIds = (defaultTemplate.sections || []).map(
            (section, sIndex) => ({
              ...section,
              id: section.id || `section-${sIndex}-${Date.now()}`,
              questions: (section.questions || []).map((question, qIndex) => ({
                ...question,
                id: question.id || `question-${sIndex}-${qIndex}-${Date.now()}`,
              })),
            }),
          );

          setFormData({
            title: "", // Start with empty title so user can customize
            description: "",
            sections: sectionsWithIds,
          });
        } else {
          // Fallback to empty template if no default found
          setFormData({
            title: "",
            description: "",
            sections: [
              {
                id: `section-${Date.now()}`,
                title: "",
                questions: [
                  {
                    id: `question-${Date.now()}`,
                    type: "text",
                    label: "",
                    required: false,
                    helpText: "",
                    options: [],
                  },
                ],
              },
            ],
          });
        }
      }
    } catch {
      // Fallback to empty template
      setFormData({
        title: "",
        description: "",
        sections: [
          {
            id: `section-${Date.now()}`,
            title: "",
            questions: [
              {
                id: `question-${Date.now()}`,
                type: "text",
                label: "",
                required: false,
                helpText: "",
                options: [],
              },
            ],
          },
        ],
      });
    }
    setLoadingDefault(false);
  };

  // Function to start with empty template
  const startWithEmptyTemplate = () => {
    setFormData({
      title: "",
      description: "",
      sections: [
        {
          id: `section-${Date.now()}`,
          title: "",
          questions: [
            {
              id: `question-${Date.now()}`,
              type: "text",
              label: "",
              required: false,
              helpText: "",
              options: [],
            },
          ],
        },
      ],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate template
    const validation = validateTemplate(formData);

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setError("Please fix the validation errors before saving.");
      return;
    }

    setLoading(true);
    setError(null);
    setValidationErrors([]);

    try {
      let result;
      if (isEditing) {
        result = await templateAPI.updateTemplate(template._id, formData);
      } else {
        result = await templateAPI.createTemplate(formData);
      }

      if (result.success) {
        setSuccess(
          `Template ${isEditing ? "updated" : "created"} successfully!`,
        );
        setTimeout(() => {
          onSave(result.data);
        }, 1500);
      } else {
        setError(result.error);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    }

    setLoading(false);
  };

  const updateFormData = (path, value) => {
    setFormData((prev) => {
      const newData = { ...prev };
      const keys = path.split(".");
      let current = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (key.includes("[") && key.includes("]")) {
          const [arrayKey, indexStr] = key.split("[");
          const index = parseInt(indexStr.replace("]", ""));
          current = current[arrayKey][index];
        } else {
          current = current[key];
        }
      }

      const lastKey = keys[keys.length - 1];
      if (lastKey.includes("[") && lastKey.includes("]")) {
        const [arrayKey, indexStr] = lastKey.split("[");
        const index = parseInt(indexStr.replace("]", ""));
        current[arrayKey][index] = value;
      } else {
        current[lastKey] = value;
      }

      return newData;
    });
  };

  const addSection = () => {
    setFormData((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: `section-${Date.now()}`,
          title: "",
          questions: [
            {
              id: `question-${Date.now()}`,
              type: "text",
              label: "",
              required: false,
              helpText: "",
              options: [],
            },
          ],
        },
      ],
    }));
  };

  const removeSection = (sectionIndex) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, index) => index !== sectionIndex),
    }));
  };

  // Drag and drop handlers
  const handleSectionReorder = async (newSections) => {
    console.log("handleSectionReorder newSections:", newSections);
    // Add unique IDs for drag and drop if they don't exist
    const sectionsWithIds = newSections.map((section, index) => ({
      ...section,
      id: section.id || `section-${index}-${Date.now()}`,
    }));

    setFormData((prev) => ({
      ...prev,
      sections: sectionsWithIds,
    }));

    // Auto-save when reordering sections
    if (isEditing) {
      try {
        const templateData = {
          ...formData,
          sections: sectionsWithIds,
        };
        await templateAPI.updateTemplate(template._id, templateData);
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }
  };

  const handleQuestionReorder = async (sectionIndex, newQuestions) => {
    console.log(
      "handleQuestionReorder section",
      sectionIndex,
      "newQuestions:",
      newQuestions,
    );
    // Add unique IDs for drag and drop if they don't exist
    const questionsWithIds = newQuestions.map((question, index) => ({
      ...question,
      id: question.id || `question-${sectionIndex}-${index}-${Date.now()}`,
    }));

    const newSections = [...formData.sections];
    newSections[sectionIndex].questions = questionsWithIds;

    setFormData((prev) => ({
      ...prev,
      sections: newSections,
    }));

    // Auto-save when reordering questions
    if (isEditing) {
      try {
        const templateData = {
          ...formData,
          sections: newSections,
        };
        await templateAPI.updateTemplate(template._id, templateData);
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }
  };

  const addQuestion = (sectionIndex) => {
    setFormData((prev) => {
      const newSections = [...prev.sections];
      newSections[sectionIndex].questions.push({
        id: `question-${sectionIndex}-${Date.now()}`,
        type: "text",
        label: "",
        required: false,
        helpText: "",
        options: [],
      });
      return { ...prev, sections: newSections };
    });
  };

  const removeQuestion = (sectionIndex, questionIndex) => {
    setFormData((prev) => {
      const newSections = [...prev.sections];
      newSections[sectionIndex].questions = newSections[
        sectionIndex
      ].questions.filter((_, index) => index !== questionIndex);
      return { ...prev, sections: newSections };
    });
  };

  const addOption = (sectionIndex, questionIndex) => {
    setFormData((prev) => {
      const newSections = [...prev.sections];
      if (!newSections[sectionIndex].questions[questionIndex].options) {
        newSections[sectionIndex].questions[questionIndex].options = [];
      }
      newSections[sectionIndex].questions[questionIndex].options.push("");
      return { ...prev, sections: newSections };
    });
  };

  const removeOption = (sectionIndex, questionIndex, optionIndex) => {
    setFormData((prev) => {
      const newSections = [...prev.sections];
      newSections[sectionIndex].questions[questionIndex].options = newSections[
        sectionIndex
      ].questions[questionIndex].options.filter(
        (_, index) => index !== optionIndex,
      );
      return { ...prev, sections: newSections };
    });
  };

  if (previewMode) {
    return (
      <TemplatePreview
        template={formData}
        onClose={() => setPreviewMode(false)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {isEditing ? "Edit Template" : "Create New Template"}
          </h2>
          <p className="text-gray-400 mt-1">
            {isEditing
              ? "Update your questionnaire template"
              : "Design your questionnaire template"}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(true)}
            className="flex items-center px-4 py-2 border-blue-500 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition-all duration-200 shadow-sm"
          >
            <svg
              className="w-4 h-4 mr-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span className="font-medium">Preview</span>
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex items-center px-4 py-2 border-gray-500 text-gray-400 hover:bg-gray-500/10 hover:text-gray-300 transition-all duration-200 shadow-sm"
          >
            <span className="font-medium">Cancel</span>
          </Button>
        </div>
      </div>

      {/* Loading Default Template */}
      {loadingDefault && (
        <div className="bg-gradient-to-br from-blue-800 via-blue-700 to-blue-800 rounded-lg p-4 border border-blue-600">
          <div className="flex items-center space-x-3">
            <LoadingSpinner size="sm" color="blue" />
            <div>
              <p className="text-white font-medium">Loading Default Template</p>
              <p className="text-blue-200 text-sm">
                Loading the comprehensive questionnaire template with all
                sections and questions...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Template Options for New Templates */}
      {!isEditing && !loadingDefault && formData.sections.length > 1 && (
        <div className="bg-gradient-to-br from-green-800 via-green-700 to-green-800 rounded-lg p-4 border border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Default Template Loaded</p>
              <p className="text-green-200 text-sm">
                You're starting with a comprehensive template with{" "}
                {formData.sections.length} sections and{" "}
                {formData.sections.reduce(
                  (total, section) => total + section.questions.length,
                  0,
                )}{" "}
                questions.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={startWithEmptyTemplate}
              className="border-green-400 text-green-300 hover:bg-green-700 hover:text-white transition-all duration-200"
            >
              Start Empty Instead
            </Button>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {success && (
        <SuccessNotification
          message={success}
          onDismiss={() => setSuccess(null)}
        />
      )}
      {error && (
        <ErrorMessage message={error} onDismiss={() => setError(null)} />
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-red-800 mb-2">
            Please fix the following errors:
          </h3>
          <ul className="text-sm text-red-700 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg p-6 border border-gray-600">
          <h3 className="text-lg font-medium text-white mb-4">
            Basic Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Template Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData("title", e.target.value)}
                placeholder="Enter template title"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="Enter template description (optional)"
                rows={3}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-white mb-1">Sections</h3>
              <p className="text-sm text-gray-400">
                Organize your questionnaire into logical sections
              </p>
            </div>
            <Button
              type="button"
              onClick={addSection}
              variant="outline"
              className="flex items-center px-4 py-2.5 border-green-500 text-green-400 hover:bg-green-500/10 hover:text-green-300 transition-all duration-200 shadow-sm"
            >
              <svg
                className="w-4 h-4 mr-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="font-medium">Add Section</span>
            </Button>
          </div>

          {/* Sortable Sections */}
          <ReactSortable
            list={formData.sections}
            setList={handleSectionReorder}
            animation={200}
            delayOnTouchStart={true}
            delay={2}
            handle=".section-drag-handle"
            className="space-y-6"
            ghostClass="opacity-50"
            chosenClass="chosen-blue-ring"
            dragClass="drag-fit"
          >
            {formData.sections.map((section, sectionIndex) => (
              <SectionEditor
                key={section.id || sectionIndex}
                section={section}
                sectionIndex={sectionIndex}
                onUpdate={updateFormData}
                onRemove={() => removeSection(sectionIndex)}
                onAddQuestion={() => addQuestion(sectionIndex)}
                onRemoveQuestion={(questionIndex) =>
                  removeQuestion(sectionIndex, questionIndex)
                }
                onAddOption={(questionIndex) =>
                  addOption(sectionIndex, questionIndex)
                }
                onRemoveOption={(questionIndex, optionIndex) =>
                  removeOption(sectionIndex, questionIndex, optionIndex)
                }
                onQuestionReorder={(newQuestions) =>
                  handleQuestionReorder(sectionIndex, newQuestions)
                }
                canRemove={formData.sections.length > 1}
              />
            ))}
          </ReactSortable>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-8 border-t border-gray-600">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="px-6 py-2.5 text-gray-400 hover:text-gray-300 hover:bg-gray-700/50 transition-all duration-200"
          >
            <span className="font-medium">Cancel</span>
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-md shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <LoadingSpinner size="sm" color="white" className="mr-2.5" />
                <span>{isEditing ? "Updating..." : "Creating..."}</span>
              </div>
            ) : (
              <span>{isEditing ? "Update Template" : "Create Template"}</span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

// Section Editor Component
const SectionEditor = ({
  section,
  sectionIndex,
  onUpdate,
  onRemove,
  onAddQuestion,
  onRemoveQuestion,
  onAddOption,
  onRemoveOption,
  onQuestionReorder,
  canRemove,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);

  return (
    <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg border border-gray-600 overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800/50 border-b border-gray-600">
        <div className="flex items-center space-x-3">
          {/* Drag Handle */}
          <div className="section-drag-handle flex flex-col space-y-1 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity p-1">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
            </div>
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <svg
              className={`w-4 h-4 text-gray-400 transform transition-transform ${
                isCollapsed ? "rotate-0" : "rotate-90"
              }`}
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
          </button>

          {editingTitle ? (
            <input
              type="text"
              value={section.title}
              onChange={(e) =>
                onUpdate(`sections[${sectionIndex}].title`, e.target.value)
              }
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setEditingTitle(false);
              }}
              className="bg-transparent text-white font-medium text-sm border-b border-gray-500 focus:border-blue-500 focus:outline-none px-1 py-0.5"
              placeholder="Section title"
              autoFocus
            />
          ) : (
            <h4
              className="text-sm font-medium text-white cursor-pointer hover:text-blue-400 transition-colors"
              onClick={() => setEditingTitle(true)}
            >
              {section.title || "Untitled Section"} ({section.questions.length}{" "}
              question{section.questions.length !== 1 ? "s" : ""})
            </h4>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
              title="Delete section"
            >
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Questions Table */}
      {!isCollapsed && (
        <div className="p-4">
          {section.questions.length > 0 && (
            <div className="mb-4">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-3 mb-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
                <div className="col-span-1"></div> {/* Drag handle column */}
                <div className="col-span-2">Type</div>
                <div className="col-span-3">Question</div>
                <div className="col-span-3">Help Text</div>
                <div className="col-span-1 text-center">Required</div>
                <div className="col-span-1 text-center">Options</div>
                <div className="col-span-1 text-center">Actions</div>
              </div>

              {/* Question Rows */}
              <ReactSortable
                list={section.questions}
                setList={onQuestionReorder}
                animation={200}
                delayOnTouchStart={true}
                delay={2}
                handle=".question-drag-handle"
                className="space-y-1"
                ghostClass="opacity-50"
                chosenClass="chosen-purple-ring"
                dragClass="drag-question"
                group={`questions-${sectionIndex}`}
              >
                {section.questions.map((question, questionIndex) => (
                  <QuestionRow
                    key={question.id || questionIndex}
                    question={question}
                    sectionIndex={sectionIndex}
                    questionIndex={questionIndex}
                    onUpdate={onUpdate}
                    onRemove={() => onRemoveQuestion(questionIndex)}
                    onAddOption={() => onAddOption(questionIndex)}
                    onRemoveOption={(optionIndex) =>
                      onRemoveOption(questionIndex, optionIndex)
                    }
                    canRemove={section.questions.length > 1}
                  />
                ))}
              </ReactSortable>
            </div>
          )}

          {/* Add Question Button */}
          <button
            type="button"
            onClick={onAddQuestion}
            className="w-full p-3 border-2 border-dashed border-gray-600 rounded-md text-gray-400 hover:text-white hover:border-gray-500 transition-colors flex items-center justify-center space-x-2"
          >
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="text-sm font-medium">Add question</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Compact Question Row Component
const QuestionRow = ({
  question,
  sectionIndex,
  questionIndex,
  onUpdate,
  onRemove,
  onAddOption,
  onRemoveOption,
  canRemove,
}) => {
  const [showOptions, setShowOptions] = useState(false);

  const questionTypes = [
    { value: "text", label: "Text" },
    { value: "textarea", label: "Long Text" },
    { value: "email", label: "Email" },
    { value: "number", label: "Number" },
    { value: "phone", label: "Phone" },
    { value: "url", label: "URL" },
    { value: "date", label: "Date" },
    { value: "time", label: "Time" },
    { value: "dropdown", label: "Dropdown" },
    { value: "radio", label: "Radio" },
    { value: "checkbox", label: "Checkbox" },
    { value: "checkboxes", label: "Multiple Choice" },
    { value: "toggle", label: "Toggle" },
    { value: "file", label: "File Upload" },
    { value: "rating", label: "Rating" },
    { value: "range", label: "Range/Slider" },
  ];

  const needsOptions = ["dropdown", "radio", "checkboxes"].includes(
    question.type,
  );

  return (
    <div className="bg-gray-700/50 rounded-md border border-gray-600/50 hover:border-gray-500 transition-colors">
      {/* Main Question Row */}
      <div className="grid grid-cols-12 gap-3 p-3 items-center">
        {/* Drag Handle */}
        <div className="col-span-1 flex justify-center">
          <div className="question-drag-handle flex flex-col space-y-0.5 cursor-grab active:cursor-grabbing opacity-30 hover:opacity-70 transition-opacity p-1">
            <div className="flex space-x-0.5">
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            </div>
            <div className="flex space-x-0.5">
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Type */}
        <div className="col-span-2">
          <select
            value={question.type}
            onChange={(e) =>
              onUpdate(
                `sections[${sectionIndex}].questions[${questionIndex}].type`,
                e.target.value,
              )
            }
            className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {questionTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Question Text */}
        <div className="col-span-3">
          <input
            type="text"
            value={question.label}
            onChange={(e) =>
              onUpdate(
                `sections[${sectionIndex}].questions[${questionIndex}].label`,
                e.target.value,
              )
            }
            placeholder="Question text"
            className="w-full px-2 py-1 bg-transparent text-white text-sm placeholder-gray-400 focus:outline-none focus:bg-gray-600 rounded border border-transparent focus:border-gray-500"
          />
        </div>

        {/* Help Text */}
        <div className="col-span-3">
          <input
            type="text"
            value={question.helpText || ""}
            onChange={(e) =>
              onUpdate(
                `sections[${sectionIndex}].questions[${questionIndex}].helpText`,
                e.target.value,
              )
            }
            placeholder="Optional help text"
            className="w-full px-2 py-1 bg-transparent text-white text-sm placeholder-gray-400 focus:outline-none focus:bg-gray-600 rounded border border-transparent focus:border-gray-500"
          />
        </div>

        {/* Required Toggle */}
        <div className="col-span-1 text-center">
          <input
            type="checkbox"
            checked={question.required}
            onChange={(e) =>
              onUpdate(
                `sections[${sectionIndex}].questions[${questionIndex}].required`,
                e.target.checked,
              )
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>

        {/* Options Button */}
        <div className="col-span-1 text-center">
          {needsOptions && (
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className={`p-1 rounded transition-colors ${
                showOptions
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-600"
              }`}
              title={`${showOptions ? "Hide" : "Show"} options`}
            >
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
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="col-span-1 text-center">
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded transition-colors"
              title="Delete question"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Options Panel (when expanded) */}
      {needsOptions && showOptions && (
        <div className="border-t border-gray-600/50 p-3 bg-gray-700/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-300">Options</span>
            <button
              type="button"
              onClick={onAddOption}
              className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
            >
              + Add
            </button>
          </div>

          <div className="space-y-1">
            {(question.options || []).map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) =>
                    onUpdate(
                      `sections[${sectionIndex}].questions[${questionIndex}].options[${optionIndex}]`,
                      e.target.value,
                    )
                  }
                  placeholder={`Option ${optionIndex + 1}`}
                  className="flex-1 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {question.options.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveOption(optionIndex)}
                    className="p-1 text-gray-400 hover:text-red-400 rounded transition-colors"
                  >
                    <svg
                      className="w-3 h-3"
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
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Template Preview Component
const TemplatePreview = ({ template, onClose }) => {
  return (
    <Modal open={true} onClose={onClose}>
      <div className="p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Template Preview</h2>
          <Button variant="ghost" onClick={onClose}>
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
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-white">{template.title}</h3>
            {template.description && (
              <p className="text-gray-400 mt-1">{template.description}</p>
            )}
          </div>

          {template.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-md font-medium text-white mb-4">
                {section.title}
              </h4>
              <div className="space-y-4">
                {section.questions.map((question, questionIndex) => (
                  <div key={questionIndex} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      {question.label}
                      {question.required && (
                        <span className="text-red-400 ml-1">*</span>
                      )}
                    </label>
                    {question.helpText && (
                      <p className="text-xs text-gray-400">
                        {question.helpText}
                      </p>
                    )}
                    <div className="text-xs text-gray-500 bg-gray-600 px-2 py-1 rounded">
                      Type: {question.type}
                      {question.options && question.options.length > 0 && (
                        <span> | Options: {question.options.join(", ")}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default TemplateForm;
