import React, { useState, useEffect, useCallback } from "react";
import {
  answerAPI,
  assignmentAPI,
  templateAPI,
} from "../../../utils/questionnaireApi";
import LoadingSpinner from "../shared/LoadingSpinner";
import ErrorMessage from "../shared/ErrorMessage";
import Button from "../../ui/Button";
import Badge from "../../ui/Badge";
import Modal from "../../ui/Modal";

const ResponseViewer = ({ templateId, onBack }) => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("submittedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedModels, setSelectedModels] = useState(new Set());

  const loadResponses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Get assignments for this agency
      const assignRes = await assignmentAPI.getAssignments();
      if (!assignRes.success) {
        setError(assignRes.error);
        setLoading(false);
        return;
      }

      // Filter assignments by template (if specified) and submitted status
      const submitted = assignRes.data.filter((a) => {
        const isSubmitted = a.status === "Submitted";
        if (!templateId) {
          // If no specific template, get all submitted assignments
          return isSubmitted;
        }
        // If specific template, filter by that template
        return (
          isSubmitted && (a.templateId?._id || a.templateId) === templateId
        );
      });

      console.log("All assignments:", assignRes.data);
      console.log("Submitted assignments:", submitted);
      console.log("TemplateId filter:", templateId);

      // Separate valid and corrupted assignments
      const validAssignments = submitted.filter((a) => {
        const assignmentTemplateId = a.templateId?._id || a.templateId;
        return assignmentTemplateId != null;
      });

      const corruptedAssignments = submitted.filter((a) => {
        const assignmentTemplateId = a.templateId?._id || a.templateId;
        return assignmentTemplateId == null;
      });

      // Warn about corrupted assignments
      if (corruptedAssignments.length > 0) {
        console.warn(
          `Found ${corruptedAssignments.length} assignments with missing templateId:`,
          corruptedAssignments,
        );
        // Show user notification about data integrity issue
        setError(
          `Data integrity issue: ${corruptedAssignments.length} submitted assignments have missing template references. Please contact support to fix these assignments.`,
        );
      }

      // Fetch answers for valid assignments only
      const allResponses = await Promise.all(
        validAssignments.map(async (a) => {
          // Handle both populated and non-populated modelId
          const modelId = a.modelId?._id || a.modelId;
          const modelName =
            a.modelId?.fullName || a.modelName || "Unknown Model";
          const modelEmail = a.modelId?.email || a.modelEmail || "No email";

          // Get the template ID for this assignment
          const assignmentTemplateId = a.templateId?._id || a.templateId;

          console.log("Fetching answers for:", {
            modelId,
            assignmentTemplateId,
            assignment: a,
          });

          const ansRes = await answerAPI.getModelAnswers(
            modelId,
            assignmentTemplateId,
          );
          if (ansRes.success && ansRes.data.answers) {
            return {
              modelId, // Add modelId to the response object
              modelName,
              modelEmail,
              submittedAt: a.submittedAt
                ? new Date(a.submittedAt).toLocaleDateString()
                : "N/A",
              answers: ansRes.data.answers,
              templateId: assignmentTemplateId,
              templateName: a.templateId?.title || "Unknown Template",
            };
          }
          return null;
        }),
      );
      const finalResponses = allResponses.filter(Boolean);
      setResponses(finalResponses);
    } catch {
      setError("Failed to load responses");
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  // Load responses when component mounts or templateId changes
  useEffect(() => {
    loadResponses();
  }, [loadResponses]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error && !error.includes("Data integrity issue")) {
    return (
      <ErrorMessage
        title="Failed to load responses"
        message={error}
        onRetry={loadResponses}
      />
    );
  }

  const handleViewResponse = (response) => {
    setSelectedResponse(response);
    setViewModal(true);
  };

  const handleExportResponses = async () => {
    // Get selected responses or all if none selected
    const responsesToExport = getSelectedResponses();
    if (responsesToExport.length === 0) {
      alert("Please select at least one model to export.");
      return;
    }
    // Create CSV content
    const csvContent = await generateCSVContent(responsesToExport);

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `questionnaire-responses-selected-${
        new Date().toISOString().split("T")[0]
      }.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    // Get selected responses or all if none selected
    const responsesToExport = getSelectedResponses();
    if (responsesToExport.length === 0) {
      alert("Please select at least one model to export.");
      return;
    }

    // Use React state for button loading state instead of DOM manipulation
    const exportButton = document.querySelector("[data-pdf-export]");
    const originalText = exportButton?.textContent || "Export PDF";
    if (exportButton) {
      exportButton.textContent = "Generating PDFs...";
      exportButton.disabled = true;
    }

    try {
      // Generate individual PDFs for each selected response using backend
      for (const response of responsesToExport) {
        await generateIndividualPDF(response);
      }

      if (responsesToExport.length > 1) {
        alert(
          `${responsesToExport.length} PDF reports generated successfully!`,
        );
      }
    } catch (error) {
      console.error("Error generating PDF reports:", error);
      alert("Error generating PDF reports. Please try again.");
    } finally {
      // Restore button text
      if (exportButton) {
        exportButton.textContent = originalText;
        exportButton.disabled = false;
      }
    }
  };

  const generateIndividualPDF = async (response) => {
    try {
      // Extract required data from the response
      const { modelId, templateId, modelName } = response;

      if (!modelId || !templateId) {
        console.error(
          "Missing modelId or templateId for PDF generation:",
          response,
        );
        throw new Error(
          `Missing required data for PDF generation for ${modelName || "model"}`,
        );
      }

      console.log(`Generating PDF for ${modelName}...`, {
        modelId,
        templateId,
      });

      // Call the backend API to get the styled PDF
      const pdfResult = await answerAPI.getModelAnswersPDF(modelId, templateId);

      if (!pdfResult.success) {
        throw new Error(pdfResult.error || "Failed to generate PDF");
      }

      // Create download link for the PDF
      const blob = new Blob([pdfResult.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `questionnaire-${modelName || "model"}-${
        new Date().toISOString().split("T")[0]
      }.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL object
      window.URL.revokeObjectURL(url);

      console.log(`✅ PDF generated successfully for ${modelName}`);
    } catch (error) {
      console.error(
        `❌ Error generating PDF for ${response.modelName}:`,
        error,
      );
      throw error;
    }
  };

  const getSelectedResponses = () => {
    if (selectedModels.size === 0) {
      return filteredAndSortedResponses; // Export all if none selected
    }
    return filteredAndSortedResponses.filter((response) =>
      selectedModels.has(response.modelName),
    );
  };

  const handleModelSelection = (modelName, isSelected) => {
    const newSelectedModels = new Set(selectedModels);
    if (isSelected) {
      newSelectedModels.add(modelName);
    } else {
      newSelectedModels.delete(modelName);
    }
    setSelectedModels(newSelectedModels);
  };

  const handleSelectAll = () => {
    if (selectedModels.size === filteredAndSortedResponses.length) {
      // Deselect all
      setSelectedModels(new Set());
    } else {
      // Select all
      const allModelNames = new Set(
        filteredAndSortedResponses.map((r) => r.modelName),
      );
      setSelectedModels(allModelNames);
    }
  };

  const generateCSVContent = async (responses) => {
    if (responses.length === 0) return "";

    // Create a map to store question text by questionId
    const questionMap = new Map();

    // Fetch template definitions for these responses
    const uniqueTemplateIds = [...new Set(responses.map((r) => r.templateId))];
    const templatePromises = uniqueTemplateIds.map(async (tempId) => {
      try {
        const templateRes = await templateAPI.getTemplate(tempId);
        return templateRes.success ? templateRes.data : null;
      } catch {
        return null;
      }
    });
    const templates = (await Promise.all(templatePromises)).filter(Boolean);

    // Build question map from all templates
    templates.forEach((template) => {
      if (template && template.sections) {
        template.sections.forEach((section) => {
          if (section.questions) {
            section.questions.forEach((question) => {
              // use string key for questionId
              const qid = question._id.toString();
              questionMap.set(
                qid,
                question.label || `Question ${questionMap.size + 1}`,
              );
            });
          }
        });
      }
    });

    // Fallback for answers without template questions
    responses.forEach((response) => {
      response.answers?.forEach((answer) => {
        const aid = answer.questionId.toString();
        if (!questionMap.has(aid)) {
          questionMap.set(aid, `Question ${questionMap.size + 1}`);
        }
      });
    });

    // Create headers with readable question names
    const headers = [
      "Model Name",
      "Model Email",
      "Submitted At",
      ...Array.from(questionMap.values()),
    ];

    // Create rows with answers
    const rows = responses.map((response) => {
      const row = [
        response.modelName,
        response.modelEmail,
        response.submittedAt,
      ];

      Array.from(questionMap.keys()).forEach((questionId) => {
        // find answer by matching string IDs
        const ans = response.answers?.find(
          (a) => a.questionId.toString() === questionId,
        );
        row.push(ans ? formatAnswerForCSV(ans.answer) : "");
      });

      return row;
    });

    // Combine headers and rows
    const csvRows = [headers, ...rows];

    // Convert to CSV string with proper escaping
    return csvRows
      .map((row) =>
        row
          .map((field) => {
            // Handle special characters and quotes properly
            const str = String(field || "");
            if (str.includes('"') || str.includes(",") || str.includes("\n")) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(","),
      )
      .join("\n");
  };

  // We don't need the client-side PDF generation function anymore
  // since we now use backend-generated PDFs

  const formatAnswerForCSV = (answer) => {
    if (answer === null || answer === undefined) return "";
    if (Array.isArray(answer)) return answer.join("; ");
    if (typeof answer === "boolean") return answer ? "Yes" : "No";
    return String(answer);
  };

  const formatAnswerForPDF = (answer) => {
    if (answer === null || answer === undefined || answer === "") return "-";
    if (Array.isArray(answer)) {
      return answer.length > 0 ? answer.join(", ") : "-";
    }
    if (typeof answer === "boolean") return answer ? "Yes" : "No";
    if (typeof answer === "object") {
      try {
        return JSON.stringify(answer);
      } catch {
        return "Complex data";
      }
    }
    const str = String(answer).trim();
    return str.length > 0 ? str : "-";
  };

  // Filter and sort responses
  const filteredAndSortedResponses = responses
    .filter((response) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        response.modelName.toLowerCase().includes(searchLower) ||
        response.modelEmail.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle date sorting
      if (sortBy === "submittedAt") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Pagination
  const totalPages = Math.ceil(
    filteredAndSortedResponses.length / itemsPerPage,
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResponses = filteredAndSortedResponses.slice(
    startIndex,
    endIndex,
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error && !error.includes("Data integrity issue")) {
    return (
      <ErrorMessage
        title="Failed to load responses"
        message={error}
        onRetry={loadResponses}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {templateId ? "Response Viewer" : "All Responses"}
          </h2>
          <p className="text-gray-400">
            {templateId
              ? `${responses.length} responses found`
              : `${responses.length} responses from all questionnaires`}
          </p>
        </div>
        {onBack && (
          <Button size="sm" variant="ghost" onClick={onBack}>
            {templateId ? "Back to Assignments" : "Back"}
          </Button>
        )}
      </div>

      {/* Data Integrity Warning */}
      {error && error.includes("Data integrity issue") && (
        <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-400">
                Data Integrity Warning
              </h3>
              <div className="mt-2 text-sm text-yellow-300">
                <p>{error}</p>
                <p className="mt-1">
                  These assignments show as "Submitted" but are missing proper
                  template references. This may have been caused by a system
                  issue during assignment creation or submission.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Controls */}
      <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg p-4 border border-gray-600">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search by model name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split("-");
                setSortBy(field);
                setSortOrder(order);
              }}
              className="px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="submittedAt-desc">Latest First</option>
              <option value="submittedAt-asc">Oldest First</option>
              <option value="modelName-asc">Name A-Z</option>
              <option value="modelName-desc">Name Z-A</option>
            </select>
            <Button onClick={handleExportResponses} variant="outline" size="sm">
              Export CSV ({selectedModels.size || "All"})
            </Button>
            <Button
              onClick={handleExportPDF}
              variant="outline"
              size="sm"
              data-pdf-export
            >
              Export PDF ({selectedModels.size || "All"})
            </Button>
          </div>
        </div>

        {/* Model Selection Controls */}
        {filteredAndSortedResponses.length > 0 && (
          <div className="flex items-center gap-4 mt-4 p-3 bg-gray-800 rounded-lg">
            <span className="text-sm text-gray-300">
              Select models to export:
            </span>
            <Button onClick={handleSelectAll} variant="ghost" size="sm">
              {selectedModels.size === filteredAndSortedResponses.length
                ? "Deselect All"
                : "Select All"}
            </Button>
            <span className="text-sm text-gray-400">
              {selectedModels.size} of {filteredAndSortedResponses.length}{" "}
              selected
            </span>
          </div>
        )}
      </div>

      {/* Results */}
      {filteredAndSortedResponses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">
            {searchTerm
              ? "No responses match your search criteria."
              : "No responses found for this questionnaire."}
          </p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg border border-gray-600 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900 bg-opacity-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={
                          selectedModels.size ===
                            filteredAndSortedResponses.length &&
                          filteredAndSortedResponses.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Model
                    </th>
                    {!templateId && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Template
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Submitted At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Answers
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {currentResponses.map((response, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-600 hover:bg-opacity-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedModels.has(response.modelName)}
                          onChange={(e) =>
                            handleModelSelection(
                              response.modelName,
                              e.target.checked,
                            )
                          }
                          className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {response.modelName}
                          </div>
                          <div className="text-sm text-gray-400">
                            {response.modelEmail}
                          </div>
                        </div>
                      </td>
                      {!templateId && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">
                            {response.templateName || "Unknown Template"}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {response.submittedAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge color="green">
                          {response.answers ? response.answers.length : 0}{" "}
                          answers
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewResponse(response)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, filteredAndSortedResponses.length)} of{" "}
                {filteredAndSortedResponses.length} responses
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Response Detail Modal */}
      <Modal
        isOpen={viewModal}
        onClose={() => setViewModal(false)}
        title={`Response from ${selectedResponse?.modelName}`}
        size="large"
      >
        {selectedResponse && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Model Name
                </label>
                <p className="text-white">{selectedResponse.modelName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <p className="text-white">{selectedResponse.modelEmail}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Submitted At
                </label>
                <p className="text-white">{selectedResponse.submittedAt}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Total Answers
                </label>
                <p className="text-white">
                  {selectedResponse.answers
                    ? selectedResponse.answers.length
                    : 0}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Answers</h3>
              {selectedResponse.answers &&
              selectedResponse.answers.length > 0 ? (
                <div className="space-y-4">
                  {selectedResponse.answers.map((answer, index) => (
                    <div key={index} className="p-4 bg-gray-800 rounded-lg">
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-300">
                          Question {index + 1}
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Answer
                        </label>
                        <p className="text-white">
                          {formatAnswerForPDF(answer.answer)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No answers found.</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ResponseViewer;
