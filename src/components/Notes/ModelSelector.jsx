import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  User,
  Users,
  Search,
  AlertCircle,
  RefreshCw,
  Settings,
} from "lucide-react";
import axios from "axios";

/**
 * ModelSelector component for agencies to select which model's notes to view
 * Fetches and displays available models for the agency
 */
const ModelSelector = ({ selectedModelId, onModelSelect, className = "" }) => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const token = JSON.parse(localStorage.getItem("auth"))?.token;
  const userInfo = JSON.parse(localStorage.getItem("auth"))?.user;

  // Fetch debug information about models
  const fetchDebugInfo = async () => {
    try {
      const response = await axios.get(`${baseURL}/agency/debug-models`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDebugInfo(response.data);
      console.log("Debug info:", response.data);
    } catch (err) {
      console.error("Error fetching debug info:", err);
    }
  };

  // Assign all unassigned models to current agency
  const assignAllModels = async () => {
    try {
      setIsAssigning(true);
      const response = await axios.post(
        `${baseURL}/agency/assign-all-models`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      console.log("Assignment result:", response.data);

      // Refresh models and debug info after assignment
      await fetchModels();
      await fetchDebugInfo();

      // Show success message
      setError(null);
    } catch (err) {
      console.error("Error assigning models:", err);
      setError(
        "Failed to assign models: " +
          (err.response?.data?.error || err.message),
      );
    } finally {
      setIsAssigning(false);
    }
  };

  // Fetch agency models
  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching models for agency...");
      const response = await axios.get(`${baseURL}/agency/agency-models`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Models response:", response.data);

      // Robustly extract models array from backend response
      let modelsData = [];
      if (response.data) {
        if (
          response.data.success &&
          response.data.data &&
          Array.isArray(response.data.data.models)
        ) {
          modelsData = response.data.data.models;
        } else if (Array.isArray(response.data.models)) {
          modelsData = response.data.models;
        } else if (Array.isArray(response.data.data)) {
          modelsData = response.data.data;
        } else if (Array.isArray(response.data)) {
          modelsData = response.data;
        }
      }
      setModels(modelsData);
      // Auto-select first model if none selected
      if (!selectedModelId && modelsData.length > 0) {
        onModelSelect(modelsData[0]);
      }

      // If no models found, fetch debug info
      if (!modelsData || modelsData.length === 0) {
        await fetchDebugInfo();
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || err.message || "Failed to fetch models";
      setError(errorMessage);
      console.error("Error fetching models:", err);

      // Fetch debug info on error
      await fetchDebugInfo();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchModels();
    }
  }, [token]);

  // Filter models based on search term
  const filteredModels = Array.isArray(models)
    ? models.filter(
        (model) =>
          model.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          model.username?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : [];

  // Get selected model info
  const selectedModel = models.find((model) => model._id === selectedModelId);

  // Handle model selection
  const handleModelSelect = (model) => {
    onModelSelect(model);
    setIsOpen(false);
    setSearchTerm("");
  };

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center justify-between p-3 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-300 ${className}`}
      >
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Models Not Found</p>
            <p className="text-xs text-red-400 mt-1">{error}</p>

            {debugInfo && (
              <div className="mt-3 p-2 bg-red-900/30 rounded border border-red-800">
                <p className="text-xs font-medium mb-2">Debug Information:</p>
                <div className="text-xs space-y-1">
                  <p>Total models in database: {debugInfo.totalModels}</p>
                  <p>Assigned to your agency: {debugInfo.assignedModels}</p>
                  <p>Unassigned models: {debugInfo.unassignedModels}</p>
                  <p>Your agency ID: {debugInfo.agencyId}</p>
                </div>

                {debugInfo.unassignedModels > 0 && (
                  <button
                    onClick={assignAllModels}
                    disabled={isAssigning}
                    className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white text-xs rounded transition-colors flex items-center space-x-1"
                  >
                    {isAssigning ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Settings className="w-3 h-3" />
                    )}
                    <span>
                      {isAssigning
                        ? "Assigning..."
                        : `Assign ${debugInfo.unassignedModels} Models`}
                    </span>
                  </button>
                )}
              </div>
            )}

            <div className="flex space-x-2 mt-3">
              <button
                onClick={fetchModels}
                className="text-xs text-red-400 hover:text-red-300 underline flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>

              <button
                onClick={() => setShowDebug(!showDebug)}
                className="text-xs text-red-400 hover:text-red-300 underline flex items-center space-x-1"
              >
                <Settings className="w-3 h-3" />
                <span>Debug</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 dark:bg-gray-800 border dark:border-gray-600 rounded-lg hover:bg-gray-750 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="flex items-center space-x-3">
          {selectedModel ? (
            <>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {selectedModel.fullName?.charAt(0) ||
                    selectedModel.username?.charAt(0) ||
                    "M"}
                </span>
              </div>
              <div className="text-left">
                <p className="dark:text-white font-medium text-sm">
                  {selectedModel.fullName || selectedModel.username}
                </p>
                <p className="dark:text-gray-400 text-xs">
                  @{selectedModel.username}
                </p>
              </div>
            </>
          ) : (
            <>
              <Users className="w-8 h-8 text-gray-400" />
              <span className="text-gray-400">Select a model</span>
            </>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-xl z-50 max-h-80 overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 dark:bg-gray-800 border dark:border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Models list */}
          <div className="max-h-60 overflow-y-auto">
            {filteredModels.length > 0 ? (
              filteredModels.map((model) => (
                <button
                  key={model._id}
                  onClick={() => handleModelSelect(model)}
                  className={`w-full flex items-center space-x-3 p-3 dark:hover:bg-gray-700 hover:bg-white transition-colors text-left ${
                    selectedModelId === model._id
                      ? "bg-blue-900/30 border-r-2 border-blue-500"
                      : ""
                  }`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-medium">
                      {model.fullName?.charAt(0) ||
                        model.username?.charAt(0) ||
                        "M"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="dark:text-white font-medium text-sm truncate">
                      {model.fullName || model.username}
                    </p>
                    <p className="dark:text-gray-400 text-xs truncate">
                      @{model.username}
                    </p>
                  </div>
                  {selectedModelId === model._id && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  )}
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-gray-400">
                {searchTerm ? (
                  <div>
                    <p>No models found matching your search</p>
                    <button
                      onClick={() => setSearchTerm("")}
                      className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="mb-2">No models available</p>
                    {debugInfo && (
                      <div className="text-xs text-left bg-gray-700 p-2 rounded">
                        <p className="font-medium mb-1">Debug Info:</p>
                        <p>Total models: {debugInfo.totalModels}</p>
                        <p>Assigned to you: {debugInfo.assignedModels}</p>
                        <p>Unassigned: {debugInfo.unassignedModels}</p>
                        {debugInfo.unassignedModels > 0 && (
                          <button
                            onClick={assignAllModels}
                            disabled={isAssigning}
                            className="mt-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white text-xs rounded flex items-center space-x-1"
                          >
                            {isAssigning ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Settings className="w-3 h-3" />
                            )}
                            <span>
                              {isAssigning ? "Assigning..." : "Assign Models"}
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-700 bg-gray-750">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {models.length} model{models.length !== 1 ? "s" : ""} available
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={fetchDebugInfo}
                  className="text-xs text-gray-400 hover:text-gray-300 flex items-center space-x-1"
                  title="Refresh debug info"
                >
                  <Settings className="w-3 h-3" />
                  <span>Debug</span>
                </button>
                <button
                  onClick={fetchModels}
                  className="text-xs text-gray-400 hover:text-gray-300 flex items-center space-x-1"
                  title="Refresh models"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
            {debugInfo && (
              <div className="mt-2 pt-2 border-t border-gray-600">
                <div className="text-xs text-gray-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Total in DB:</span>
                    <span>{debugInfo.totalModels}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Assigned:</span>
                    <span>{debugInfo.assignedModels}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unassigned:</span>
                    <span>{debugInfo.unassignedModels}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};

export default ModelSelector;
