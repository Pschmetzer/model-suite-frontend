import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Settings,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import axios from "axios";

/**
 * ModelDebugPanel component for agencies to debug model assignment issues
 * Shows all models, their assignment status, and allows bulk operations
 */
const ModelDebugPanel = ({ className = "" }) => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const token = JSON.parse(localStorage.getItem("auth"))?.token;

  // Fetch debug information
  const fetchDebugInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${baseURL}/agency/debug-models`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDebugInfo(response.data);
      console.log("Debug info loaded:", response.data);
    } catch (err) {
      setError(
        "Failed to fetch debug information: " +
          (err.response?.data?.error || err.message),
      );
      console.error("Error fetching debug info:", err);
    } finally {
      setLoading(false);
    }
  };

  // Assign all unassigned models to current agency
  const assignAllModels = async () => {
    try {
      setIsAssigning(true);
      setError(null);
      setSuccess(null);

      const response = await axios.post(
        `${baseURL}/agency/assign-all-models`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setSuccess(response.data.message);
      console.log("Assignment result:", response.data);

      // Refresh debug info
      await fetchDebugInfo();
    } catch (err) {
      setError(
        "Failed to assign models: " +
          (err.response?.data?.error || err.message),
      );
      console.error("Error assigning models:", err);
    } finally {
      setIsAssigning(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDebugInfo();
    }
  }, [token]);

  if (loading) {
    return (
      <div
        className={`p-6 bg-gray-800 border border-gray-700 rounded-lg ${className}`}
      >
        <div className="flex items-center justify-center space-x-3">
          <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
          <span className="text-gray-300">Loading debug information...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-6 bg-gray-800 border border-gray-700 rounded-lg ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Settings className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">
            Model Debug Panel
          </h2>
        </div>
        <button
          onClick={fetchDebugInfo}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-300 font-medium">Error</p>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-4 bg-green-900/20 border border-green-700 rounded-lg flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-green-300 font-medium">Success</p>
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        </div>
      )}

      {debugInfo && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {debugInfo.totalModels}
                  </p>
                  <p className="text-gray-400 text-sm">Total Models</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {debugInfo.assignedModels}
                  </p>
                  <p className="text-gray-400 text-sm">Assigned to You</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <XCircle className="w-8 h-8 text-red-400" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {debugInfo.unassignedModels}
                  </p>
                  <p className="text-gray-400 text-sm">Unassigned</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <Settings className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="text-lg font-bold text-white truncate">
                    {debugInfo.agencyId}
                  </p>
                  <p className="text-gray-400 text-sm">Your Agency ID</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bulk Assignment */}
          {debugInfo.unassignedModels > 0 && (
            <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-yellow-300 font-medium">
                    Unassigned Models Found
                  </h3>
                  <p className="text-yellow-400 text-sm">
                    There are {debugInfo.unassignedModels} models that are not
                    assigned to any agency.
                  </p>
                </div>
                <button
                  onClick={assignAllModels}
                  disabled={isAssigning}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  {isAssigning ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Settings className="w-4 h-4" />
                  )}
                  <span>
                    {isAssigning ? "Assigning..." : "Assign All to Me"}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Models Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assigned Models */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-white flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>
                  Assigned Models ({debugInfo.assignedToThisAgency?.length || 0}
                  )
                </span>
              </h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {debugInfo.assignedToThisAgency?.length > 0 ? (
                  debugInfo.assignedToThisAgency.map((model) => (
                    <div
                      key={model._id}
                      className="p-3 bg-green-900/20 border border-green-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {model.fullName?.charAt(0) ||
                              model.username?.charAt(0) ||
                              "M"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm">
                            {model.fullName || model.username}
                          </p>
                          <p className="text-gray-400 text-xs">
                            @{model.username}
                          </p>
                        </div>
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm text-center py-4">
                    No models assigned to your agency
                  </p>
                )}
              </div>
            </div>

            {/* Unassigned Models */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-white flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <span>
                  Unassigned Models ({debugInfo.unassigned?.length || 0})
                </span>
              </h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {debugInfo.unassigned?.length > 0 ? (
                  debugInfo.unassigned.map((model) => (
                    <div
                      key={model._id}
                      className="p-3 bg-red-900/20 border border-red-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {model.fullName?.charAt(0) ||
                              model.username?.charAt(0) ||
                              "M"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm">
                            {model.fullName || model.username}
                          </p>
                          <p className="text-gray-400 text-xs">
                            @{model.username}
                          </p>
                        </div>
                        <XCircle className="w-4 h-4 text-red-400" />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm text-center py-4">
                    All models are assigned
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelDebugPanel;
