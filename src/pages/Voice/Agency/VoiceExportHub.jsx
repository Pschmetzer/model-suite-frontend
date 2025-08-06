import React, { useState, useEffect } from "react";
import {
  Download,
  FolderOpen,
  Filter,
  Search,
  CheckSquare,
  Square,
  Archive,
  Calendar,
  User,
  Tag,
  FileAudio,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { voiceAPI } from "../../../services/voiceAPI";

// RecordingRow component
const RecordingRow = ({ recording, isSelected, onToggle }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-600 text-white";
      case "rejected":
        return "bg-red-600 text-white";
      case "pending":
        return "bg-blue-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  return (
    <tr className="hover:bg-gray-700 border-b border-gray-700">
      <td className="px-3 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(recording._id)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 bg-gray-700 rounded"
        />
      </td>
      <td className="px-3 py-4 min-w-0">
        <div className="text-sm font-medium text-white truncate">
          {recording.questionText || "No question text"}
        </div>
        <div className="text-xs text-gray-400 truncate">
          {recording.modelId?.fullName ||
            recording.modelId?.username ||
            "Unknown Model"}
        </div>
      </td>
      <td className="px-3 py-4">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
            recording.status,
          )}`}
        >
          {recording.status}
        </span>
      </td>
      <td className="px-3 py-4 text-sm text-gray-400">
        {recording.duration ? `${Math.round(recording.duration)}s` : "N/A"}
      </td>
      <td className="px-3 py-4 text-sm text-gray-400">
        {recording.submittedAt
          ? new Date(recording.submittedAt).toLocaleDateString()
          : "N/A"}
      </td>
      <td className="px-3 py-4">
        <div className="flex items-center gap-2">
          {recording.fileUrl && (
            <audio controls className="w-24 h-8">
              <source src={recording.fileUrl} type="audio/webm" />
              <source src={recording.fileUrl} type="audio/mp3" />
              Your browser does not support the audio element.
            </audio>
          )}
          <button
            onClick={() =>
              handleSingleDownload(recording._id, recording.originalFilename)
            }
            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded transition-colors"
            title="Download recording"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

const VoiceExportHub = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecordings, setSelectedRecordings] = useState(new Set());
  const [filters, setFilters] = useState({
    status: "approved",
    dateFrom: "",
    dateTo: "",
    model: "",
    script: "",
    tags: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [exportProgress, setExportProgress] = useState(null);
  const [exportHistory, setExportHistory] = useState([]);

  useEffect(() => {
    fetchRecordings();
    fetchExportHistory();
  }, [filters]);

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching recordings with filters:", filters);
      const response = await voiceAPI.getAgencyRecordings(filters);
      console.log("✅ Export Hub recordings response:", response);
      console.log("✅ Recordings data:", response.data.data);

      // The recordings are in response.data.data.recordings
      const recordings = response.data.data?.recordings || [];
      console.log("✅ Final recordings array:", recordings);

      setRecordings(recordings);
    } catch (error) {
      console.error("Failed to fetch recordings:", error);
      console.error("Error details:", error.response?.data);
      toast.error("Failed to fetch recordings");
    } finally {
      setLoading(false);
    }
  };

  const fetchExportHistory = async () => {
    try {
      // This would need to be implemented in the API
      // const response = await voiceAPI.getExportHistory();
      // setExportHistory(response.data);
    } catch (error) {
      console.error("Failed to fetch export history");
    }
  };

  const filteredRecordings = recordings.filter((recording) => {
    const matchesSearch =
      recording.script?.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      recording.model?.username
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const toggleRecording = (recordingId) => {
    const newSelected = new Set(selectedRecordings);
    if (newSelected.has(recordingId)) {
      newSelected.delete(recordingId);
    } else {
      newSelected.add(recordingId);
    }
    setSelectedRecordings(newSelected);
  };

  const toggleAll = () => {
    if (selectedRecordings.size === filteredRecordings.length) {
      setSelectedRecordings(new Set());
    } else {
      setSelectedRecordings(new Set(filteredRecordings.map((r) => r._id)));
    }
  };

  const handleSingleDownload = async (recordingId, originalFilename) => {
    try {
      console.log(`📥 Downloading single recording ${recordingId}`);

      // Step 1: Generate secure download token
      console.log(`🔐 Generating download token for recording ${recordingId}`);
      const tokenResponse = await voiceAPI.generateDownloadToken(recordingId);

      if (!tokenResponse.data?.data?.downloadToken) {
        throw new Error("Failed to generate download token");
      }

      const { downloadToken } = tokenResponse.data.data;
      console.log(`✅ Download token generated successfully`);

      // Step 2: Create secure download URL (no auth token in URL)
      const secureDownloadUrl = `${
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1"
      }/voice/recordings/download/${downloadToken}`;

      console.log(`🌐 Secure Download URL created`);

      // Step 3: Download file using secure URL
      const response = await fetch(secureDownloadUrl, {
        method: "GET",
        // No Authorization header needed - token is in URL path, not query params
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create object URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);

      // Create and click download link
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = originalFilename || `recording_${recordingId}.mp3`;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the object URL
      window.URL.revokeObjectURL(blobUrl);

      toast.success("Download started");
      console.log(`✅ Download completed for recording ${recordingId}`);
    } catch (error) {
      console.error(`❌ Failed to download recording ${recordingId}:`, error);
      toast.error("Failed to download recording");
    }
  };

  const handleBulkExport = async () => {
    if (selectedRecordings.size === 0) {
      toast.error("Please select recordings to export");
      return;
    }

    setExportProgress({ status: "preparing", progress: 0 });

    try {
      toast("Preparing downloads...", { icon: "📥" });

      const selectedRecordingIds = Array.from(selectedRecordings);
      let completed = 0;

      for (const recordingId of selectedRecordingIds) {
        try {
          console.log(`📥 Downloading recording ${recordingId}`);

          // Find the recording to get its filename
          const recording = recordings.find((r) => r._id === recordingId);
          const fileName =
            recording?.originalFilename || `recording_${recordingId}.mp3`;

          let blob;

          try {
            // Try secure download method first
            console.log(
              `🔐 Generating download token for recording ${recordingId}`,
            );
            const tokenResponse =
              await voiceAPI.generateDownloadToken(recordingId);

            if (!tokenResponse.data?.data?.downloadToken) {
              throw new Error("Failed to generate download token");
            }

            const { downloadToken } = tokenResponse.data.data;
            const secureDownloadUrl = `${
              import.meta.env.VITE_API_BASE_URL ||
              "http://localhost:5000/api/v1"
            }/voice/recordings/download/${downloadToken}`;

            const response = await fetch(secureDownloadUrl, {
              method: "GET",
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            blob = await response.blob();
            console.log(
              `✅ Secure download completed for recording ${recordingId}`,
            );
          } catch (secureError) {
            console.error(
              `❌ Secure download failed for recording ${recordingId}:`,
              secureError,
            );
            throw secureError;
          }

          // Create object URL for the blob
          const blobUrl = window.URL.createObjectURL(blob);

          // Create and click download link
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = fileName;
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Clean up the object URL
          window.URL.revokeObjectURL(blobUrl);

          completed++;
          const progress = Math.round(
            (completed / selectedRecordingIds.length) * 100,
          );
          setExportProgress({
            status: "downloading",
            progress,
            message: `Downloaded ${completed} of ${selectedRecordingIds.length} files`,
          });

          // Small delay to prevent overwhelming the browser
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to download recording ${recordingId}:`, error);
          toast.error(`Failed to download recording ${recordingId}`);
        }
      }

      toast.success(`Successfully downloaded ${completed} recordings`);
      setExportProgress(null);
      setSelectedRecordings(new Set());
    } catch (error) {
      console.error("Bulk export error:", error);
      toast.error("Failed to start export");
      setExportProgress(null);
    }
  };

  const pollExportStatus = async (exportId) => {
    const poll = async () => {
      try {
        const response = await fetch(
          `/api/v1/voice/recordings/export/status/${exportId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        const data = await response.json();

        if (data.success) {
          setExportProgress(data.data);

          if (data.data.status === "completed") {
            toast.success("Export completed successfully");
            // Trigger download
            const link = document.createElement("a");
            link.href = data.data.downloadUrl;
            link.download = data.data.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setExportProgress(null);
            setSelectedRecordings(new Set());
            fetchExportHistory();
          } else if (data.data.status === "failed") {
            toast.error("Export failed");
            setExportProgress(null);
          } else {
            // Continue polling
            setTimeout(poll, 2000);
          }
        }
      } catch (error) {
        toast.error("Failed to check export status");
        setExportProgress(null);
      }
    };

    poll();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="p-6 w-full">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                🎵 Voice Content Export Hub
              </h1>
              <p className="text-gray-300 text-lg">
                Download and organize approved voice recordings
              </p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                <span>
                  📊 {recordings.length} approved recordings available
                </span>
                <span>📦 {selectedRecordings.size} selected for export</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleBulkExport}
                disabled={selectedRecordings.size === 0 || exportProgress}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium shadow-sm"
              >
                <Download className="w-5 h-5" />
                Export Selected ({selectedRecordings.size})
              </button>
              <button
                onClick={fetchRecordings}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Export Progress */}
        {exportProgress && (
          <div className="bg-blue-600/20 border border-blue-500 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-blue-300">
                Export in Progress
              </span>
              <span className="text-blue-400">{exportProgress.progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${exportProgress.progress}%` }}
              />
            </div>
            <p className="text-sm text-blue-400 mt-2">
              {exportProgress.message}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-3 sticky top-4">
              <h3 className="font-semibold text-white mb-3">Filters</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="approved">Approved Only</option>
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending Review</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        dateFrom: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        dateTo: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={filters.model}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, model: e.target.value }))
                    }
                    placeholder="Filter by model username"
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={() =>
                    setFilters({
                      status: "approved",
                      dateFrom: "",
                      dateTo: "",
                      model: "",
                      script: "",
                      tags: [],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Clear Filters
                </button>
              </div>

              {/* Export History */}
              <div className="mt-6">
                <h3 className="font-semibold text-white mb-4">
                  Recent Exports
                </h3>
                <div className="space-y-2">
                  {exportHistory.length > 0 ? (
                    exportHistory.slice(0, 5).map((export_, index) => (
                      <div
                        key={index}
                        className="p-2 bg-gray-700 rounded text-sm"
                      >
                        <div className="font-medium text-white">
                          {export_.filename}
                        </div>
                        <div className="text-gray-400">
                          {export_.recordingCount} files
                        </div>
                        <div className="text-gray-400">
                          {new Date(export_.createdAt).toLocaleDateString()}
                        </div>
                        {export_.downloadUrl && (
                          <a
                            href={export_.downloadUrl}
                            className="text-blue-400 hover:text-blue-300"
                            download
                          >
                            Download
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-4">
                      <p className="text-sm">No export history available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-4">
            {/* Search */}
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-4 mb-6">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search recordings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Recordings Table */}
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleAll}
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
                    >
                      {selectedRecordings.size === filteredRecordings.length ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      Select All
                    </button>
                    <span className="text-sm text-gray-400">
                      {filteredRecordings.length} recordings available
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {selectedRecordings.size} selected
                  </div>
                </div>
              </div>

              <div className="w-full">
                <table className="w-full table-fixed">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="w-12 px-3 py-3"></th>
                      <th
                        className="text-left px-3 py-3 font-medium text-white"
                        style={{ width: "40%" }}
                      >
                        Recording
                      </th>
                      <th
                        className="text-left px-3 py-3 font-medium text-white"
                        style={{ width: "15%" }}
                      >
                        Status
                      </th>
                      <th
                        className="text-left px-3 py-3 font-medium text-white"
                        style={{ width: "10%" }}
                      >
                        Duration
                      </th>
                      <th
                        className="text-left px-3 py-3 font-medium text-white"
                        style={{ width: "15%" }}
                      >
                        Date
                      </th>
                      <th
                        className="text-left px-3 py-3 font-medium text-white"
                        style={{ width: "20%" }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecordings.map((recording) => (
                      <RecordingRow
                        key={recording._id}
                        recording={recording}
                        isSelected={selectedRecordings.has(recording._id)}
                        onToggle={() => toggleRecording(recording._id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredRecordings.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  <FolderOpen className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                  <p className="text-white">
                    No recordings found matching your criteria
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Try adjusting your filters or check back later when more
                    recordings are available.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceExportHub;
