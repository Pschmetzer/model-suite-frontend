import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { templateAPI, assignmentAPI } from "../../../utils/questionnaireApi";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import SuccessNotification from "../shared/SuccessNotification";
import Button from "../../ui/Button";
import Badge from "../../ui/Badge";
import Modal from "../../ui/Modal";

const AssignmentManager = ({
  selectedTemplate,
  onClose,
  onAssignmentComplete,
}) => {
  const [templates, setTemplates] = useState([]);
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    selectedTemplate?._id || "",
  );
  const [selectedModelIds, setSelectedModelIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load templates and models in parallel
      const [templatesResult, modelsResult] = await Promise.all([
        templateAPI.getTemplates(),
        fetchModels(),
      ]);

      if (templatesResult.success) {
        setTemplates(templatesResult.data);
      } else {
        setError(templatesResult.error);
      }

      if (modelsResult.success) {
        setModels(modelsResult.data);
      } else {
        setError(modelsResult.error);
      }
    } catch (err) {
      setError("Failed to load data. Please try again.", err);
    }

    setLoading(false);
  }, []);

  // Fetch models from API
  const fetchModels = async (search = "") => {
    setModelsLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem("auth"))?.token;
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/agency/models`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { search },
        },
      );
      return { success: true, data: response.data };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || "Failed to fetch models",
      };
    } finally {
      setModelsLoading(false);
    }
  };

  // Load initial data once on mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Refetch models when searchTerm changes
  useEffect(() => {
    const refetch = async () => {
      setError(null);
      const result = await fetchModels(searchTerm);
      if (result.success) setModels(result.data);
      else setError(result.error);
    };
    refetch();
  }, [searchTerm]);

  const handleTemplateChange = (templateId) => {
    setSelectedTemplateId(templateId);
    setSelectedModelIds([]); // Reset model selection when template changes
  };

  const handleModelToggle = (modelId) => {
    setSelectedModelIds((prev) => {
      if (prev.includes(modelId)) {
        return prev.filter((id) => id !== modelId);
      } else {
        return [...prev, modelId];
      }
    });
  };

  const handleSelectAllModels = () => {
    const filteredModelIds = filteredModels.map((model) => model._id);
    if (selectedModelIds.length === filteredModelIds.length) {
      setSelectedModelIds([]);
    } else {
      setSelectedModelIds(filteredModelIds);
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedTemplateId || selectedModelIds.length === 0) {
      setError("Please select a template and at least one model.");
      return;
    }

    setAssigning(true);
    setError(null);

    try {
      const assignmentsData = {
        templateId: selectedTemplateId,
        modelIds: selectedModelIds,
      };

      const result = await assignmentAPI.createBulkAssignments(assignmentsData);

      if (result.success) {
        setSuccess(
          `Successfully assigned questionnaire to ${selectedModelIds.length} model(s)!`,
        );
        setSelectedModelIds([]);

        // Call completion callback if provided
        if (onAssignmentComplete) {
          onAssignmentComplete(result.data);
        }

        // Auto-close after success
        setTimeout(() => {
          if (onClose) onClose();
        }, 2000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to create assignments. Please try again.", err);
    }

    setAssigning(false);
  };

  // Filter models based on search term
  const filteredModels = models.filter(
    (model) =>
      model.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const currentTemplate = templates.find((t) => t._id === selectedTemplateId);
  const selectedModels = models.filter((m) => selectedModelIds.includes(m._id));

  if (loading) {
    return (
      <Modal open={true} onClose={onClose}>
        <div className="p-6 text-center">
          <LoadingSpinner size="lg" text="Loading assignment data..." />
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={true} onClose={onClose}>
      <div className="p-6 max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">
              Assign Questionnaire
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Select a template and models to create assignments
            </p>
          </div>
          <div className="flex space-x-2">
            {currentTemplate && selectedModelIds.length > 0 && (
              <Button variant="ghost" onClick={() => setShowPreview(true)}>
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Preview
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
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
            </Button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <SuccessNotification
            message={success}
            onDismiss={() => setSuccess(null)}
          />
        )}
        {error && (
          <ErrorMessage
            message={error}
            onRetry={loadInitialData}
            onDismiss={() => setError(null)}
          />
        )}

        <div className="space-y-6">
          {/* Template Selection */}
          <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg p-4 border border-gray-600">
            <h3 className="text-lg font-medium text-white mb-4">
              Select Template
            </h3>

            {templates.length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                No templates available
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templates.map((template) => (
                  <div
                    key={template._id}
                    className={`p-3 rounded-md border cursor-pointer transition-colors ${
                      selectedTemplateId === template._id
                        ? "border-blue-500 bg-blue-50 bg-opacity-10"
                        : "border-gray-600 hover:border-gray-500"
                    }`}
                    onClick={() => handleTemplateChange(template._id)}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={selectedTemplateId === template._id}
                        onChange={() => handleTemplateChange(template._id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">
                          {template.title}
                        </h4>
                        {template.description && (
                          <p className="text-sm text-gray-400 truncate">
                            {template.description}
                          </p>
                        )}
                        <div className="flex space-x-2 mt-1">
                          <Badge color="blue" className="text-xs">
                            {template.sections?.length || 0} sections
                          </Badge>
                          <Badge color="purple" className="text-xs">
                            {template.sections?.reduce(
                              (total, section) =>
                                total + (section.questions?.length || 0),
                              0,
                            ) || 0}{" "}
                            questions
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Model Selection */}
          <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Select Models</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">
                  {selectedModelIds.length} of {filteredModels.length} selected
                </span>
                {filteredModels.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSelectAllModels}
                  >
                    {selectedModelIds.length === filteredModels.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                )}
              </div>
            </div>

            {/* Search Models */}
            <div className="relative mb-4">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search models by name, username, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Models List */}
            {modelsLoading ? (
              <div className="text-center py-4">
                <LoadingSpinner size="md" text="Loading models..." />
              </div>
            ) : filteredModels.length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                {searchTerm
                  ? "No models found matching your search."
                  : "No models available"}
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredModels.map((model) => (
                  <div
                    key={model._id}
                    className={`p-3 rounded-md border cursor-pointer transition-colors ${
                      selectedModelIds.includes(model._id)
                        ? "border-blue-500 bg-blue-50 bg-opacity-10"
                        : "border-gray-600 hover:border-gray-500"
                    }`}
                    onClick={() => handleModelToggle(model._id)}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedModelIds.includes(model._id)}
                        onChange={() => handleModelToggle(model._id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-white font-medium">
                            {model.fullName}
                          </h4>
                          <Badge color="gray" className="text-xs">
                            @{model.username}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400">{model.email}</p>
                        {model.city && (
                          <p className="text-xs text-gray-500">{model.city}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assignment Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-600">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkAssign}
              disabled={
                !selectedTemplateId ||
                selectedModelIds.length === 0 ||
                assigning
              }
            >
              {assigning ? (
                <>
                  <LoadingSpinner size="sm" color="white" className="mr-2" />
                  Assigning...
                </>
              ) : (
                <>
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
                  Assign to {selectedModelIds.length} Model
                  {selectedModelIds.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Assignment Preview Modal */}
        {showPreview && (
          <AssignmentPreview
            template={currentTemplate}
            models={selectedModels}
            onClose={() => setShowPreview(false)}
            onConfirm={handleBulkAssign}
            isAssigning={assigning}
          />
        )}
      </div>
    </Modal>
  );
};

// Assignment Preview Component
const AssignmentPreview = ({
  template,
  models,
  onClose,
  onConfirm,
  isAssigning,
}) => {
  return (
    <Modal open={true} onClose={onClose}>
      <div className="p-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Assignment Preview</h3>
          <Button variant="ghost" onClick={onClose}>
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
          </Button>
        </div>

        <div className="space-y-6">
          {/* Template Info */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">Template</h4>
            <div className="space-y-2">
              <p className="text-white">{template.title}</p>
              {template.description && (
                <p className="text-sm text-gray-400">{template.description}</p>
              )}
              <div className="flex space-x-2">
                <Badge color="blue">
                  {template.sections?.length || 0} sections
                </Badge>
                <Badge color="purple">
                  {template.sections?.reduce(
                    (total, section) =>
                      total + (section.questions?.length || 0),
                    0,
                  ) || 0}{" "}
                  questions
                </Badge>
              </div>
            </div>
          </div>

          {/* Models Info */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">
              Models ({models.length})
            </h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {models.map((model) => (
                <div
                  key={model._id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-white">{model.fullName}</span>
                  <span className="text-gray-400">@{model.username}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Confirmation */}
          <div className="bg-blue-50 bg-opacity-10 border border-blue-500 rounded-lg p-4">
            <p className="text-blue-300 text-sm">
              This will create {models.length} assignment
              {models.length !== 1 ? "s" : ""} for the selected template. Models
              will be notified and can start filling out the questionnaire
              immediately.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onConfirm} disabled={isAssigning}>
              {isAssigning ? (
                <>
                  <LoadingSpinner size="sm" color="white" className="mr-2" />
                  Creating Assignments...
                </>
              ) : (
                "Confirm Assignment"
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AssignmentManager;
