import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Filter,
  AlertCircle,
  FileText,
  BarChart3,
  Download,
  X,
  Info,
  RefreshCw,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import NoteCard from "./NoteCard";
import CreateNoteModal from "./CreateNoteModal";
import EditNoteModal from "./EditNoteModal";
import FilterPanel from "./FilterPanel";
import NoteStats from "./NoteStats";
import ReminderSystem from "./ReminderSystem";
import FileAttachment from "./FileAttachment";
import NotesAnalytics from "./NotesAnalytics";
import SystemOverview from "./SystemOverview";
import { NotesAPI } from "./NotesAPI";

/**
 * Main Notes Manager component that handles all note operations
 * Integrates with the existing backend API and follows project design patterns
 */
const NotesManager = ({ modelId, agencyId, userRole = "agency" }) => {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [showNoteDetails, setShowNoteDetails] = useState(false);
  const [selectedNoteForDetails, setSelectedNoteForDetails] = useState(null);
  const [noteReminders, setNoteReminders] = useState([]);
  const [noteAttachments, setNoteAttachments] = useState([]);
  const [stats, setStats] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentView, setCurrentView] = useState("notes"); // notes, analytics
  const [selectedNotes, setSelectedNotes] = useState(new Set());
  const [bulkActionMode, setBulkActionMode] = useState(false);
  const [showSystemOverview, setShowSystemOverview] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false); // Flag to prevent auto-refresh during updates
  const [filters, setFilters] = useState({
    category: "",
    priority: "",
    status: "active",
    tags: [],
    isPinned: null,
  });
  const [notesError, setNotesError] = useState(null);
  const [statsError, setStatsError] = useState(null);

  const baseURL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
  const token = JSON.parse(localStorage.getItem("auth"))?.token;

  // Fetch notes centralizing through NotesAPI
  const fetchNotes = async (page = 1, searchQuery = "", filterParams = {}) => {
    try {
      setLoading(true);
      setNotesError(null);
      const params = {
        modelId,
        page,
        limit: 10,
        search: searchQuery,
        ...filterParams,
      };
      const response = await NotesAPI.getNotes(params);
      if (response.success) {
        setNotes(response.data);
        setFilteredNotes(response.data);
        setCurrentPage(response.pagination.currentPage || 1);
        setTotalPages(response.pagination.totalPages || 1);
      } else {
        setNotesError(response.error || "Failed to fetch notes");
      }
    } catch (err) {
      setNotesError("Failed to load notes");
      console.error("Error fetching notes:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch note statistics using NotesAPI
  const fetchStats = async () => {
    try {
      setStatsError(null);
      const result = await NotesAPI.getNotesStats(modelId);
      if (result.success) {
        setStats(result.data);
      } else {
        setStatsError(result.error || "Failed to load stats");
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
      setStatsError("Failed to load stats");
    }
  };

  // Handle note creation
  const handleCreateNote = async (noteData) => {
    try {
      const response = await axios.post(
        `${baseURL}/notes`,
        { ...noteData, modelId, agencyId },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        toast.success("Note created successfully");
        setShowCreateModal(false);
        // Reload first page so new note is visible
        fetchNotes(1, searchTerm, filters);
        fetchStats();
      }
    } catch (err) {
      console.error("Error creating note:", err);
      toast.error(
        `Failed to create note: ${err.response?.data?.message || err.message}`,
      );
      throw err;
    }
  };

  // Handle note details view
  const handleViewNoteDetails = async (note) => {
    setSelectedNoteForDetails(note);
    setShowNoteDetails(true);

    // Fetch reminders and attachments for the note
    try {
      const [remindersResponse, attachmentsResponse] = await Promise.all([
        axios.get(`${baseURL}/notes/${note._id}/reminders`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${baseURL}/notes/${note._id}/attachments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (remindersResponse.data.success) {
        setNoteReminders(remindersResponse.data.data);
      }

      if (attachmentsResponse.data.success) {
        setNoteAttachments(attachmentsResponse.data.data);
      }
    } catch (error) {
      console.error("Error fetching note details:", error);
    }
  };

  // Handle reminder updates
  const handleReminderUpdate = (updatedReminders) => {
    setNoteReminders(updatedReminders);
  };

  // Handle attachment updates
  const handleAttachmentUpdate = (updatedAttachments) => {
    setNoteAttachments(updatedAttachments);
  };

  // Handle note update
  const handleUpdateNote = async (noteId, updateData) => {
    try {
      const response = await axios.patch(
        `${baseURL}/notes/${noteId}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        toast.success("Note updated successfully");
        setShowEditModal(false);
        setSelectedNote(null);
        // Reload current page to show updates
        fetchNotes(currentPage, searchTerm, filters);
        fetchStats();
      }
    } catch (err) {
      console.error("Error updating note:", err);
      toast.error(
        `Failed to update note: ${err.response?.data?.message || err.message}`,
      );
      throw err;
    }
  };

  // Handle priority update
  const handleUpdatePriority = async (noteId, newPriority) => {
    setIsUpdating(true);
    try {
      const response = await axios.patch(
        `${baseURL}/notes/${noteId}`,
        { priority: newPriority },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Check if response is successful (backend uses ApiResponse format)
      if (response.data && response.data.data) {
        // Update the note in the local state immediately for better UX
        setNotes((prevNotes) =>
          prevNotes.map((note) =>
            note._id === noteId ? { ...note, priority: newPriority } : note,
          ),
        );
        setFilteredNotes((prevNotes) =>
          prevNotes.map((note) =>
            note._id === noteId ? { ...note, priority: newPriority } : note,
          ),
        );
        toast.success(`Priority updated to ${newPriority}`);

        // Refresh data to ensure consistency
        await fetchNotes();
        fetchStats(); // Update stats to reflect priority changes
      } else {
        throw new Error("Update failed - no success indicator in response");
      }
    } catch (err) {
      console.error("Error updating priority:", err);
      toast.error(
        `Failed to update priority: ${
          err.response?.data?.message || err.message
        }`,
      );
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle note deletion
  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;

    try {
      await axios.delete(`${baseURL}/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // After deletion, reload first page in case list length changed
      fetchNotes(1, searchTerm, filters);
      fetchStats();
      toast.success("Note deleted successfully");
    } catch (err) {
      console.error("Error deleting note:", err);
      toast.error(
        `Failed to delete note: ${err.response?.data?.message || err.message}`,
      );
    }
  };

  // Handle pin/unpin note
  const handleTogglePin = async (noteId) => {
    try {
      await axios.patch(
        `${baseURL}/notes/${noteId}/pin`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      fetchNotes(currentPage, searchTerm, filters);
    } catch (err) {
      console.error("Error toggling pin:", err);
    }
  };

  // Handle search
  const handleSearch = (query) => {
    setSearchTerm(query);
    setCurrentPage(1);
    fetchNotes(1, query, filters);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    fetchNotes(1, searchTerm, newFilters);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchNotes(page, searchTerm, filters);
  };

  // Manual refresh function
  const handleRefresh = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchNotes(currentPage, searchTerm, filters),
        fetchStats(),
      ]);
      toast.success("Notes refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh notes");
    } finally {
      setLoading(false);
    }
  };

  // Retry handlers
  const retryFetchNotes = () => fetchNotes(currentPage, searchTerm, filters);
  const retryFetchStats = () => fetchStats();

  // Bulk operations - Temporarily Disabled
  /* const handleSelectNote = (noteId) => {
    const newSelected = new Set(selectedNotes);
    if (newSelected.has(noteId)) {
      newSelected.delete(noteId);
    } else {
      newSelected.add(noteId);
    }
    setSelectedNotes(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedNotes.size === filteredNotes.length) {
      setSelectedNotes(new Set());
    } else {
      setSelectedNotes(new Set(filteredNotes.map((note) => note._id)));
    }
  };

  const bulkDeleteNotes = async () => {
    if (selectedNotes.size === 0) return;

    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedNotes.size} notes?`
      )
    ) {
      return;
    }

    try {
      await Promise.all(
        Array.from(selectedNotes).map((noteId) =>
          axios.delete(`${baseURL}/notes/${noteId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );

      setNotes(notes.filter((note) => !selectedNotes.has(note._id)));
      setSelectedNotes(new Set());
      setBulkActionMode(false);
      toast.success(`${selectedNotes.size} notes deleted successfully`);
      fetchStats();
    } catch (err) {
      console.error("Error deleting notes:", err);
      toast.error("Failed to delete some notes");
    }
  };

  const bulkPinNotes = async () => {
    if (selectedNotes.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedNotes).map((noteId) =>
          axios.patch(
            `${baseURL}/notes/${noteId}`,
            { isPinned: true },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );

      setNotes(
        notes.map((note) =>
          selectedNotes.has(note._id) ? { ...note, isPinned: true } : note
        )
      );
      setSelectedNotes(new Set());
      setBulkActionMode(false);
      toast.success(`${selectedNotes.size} notes pinned successfully`);
    } catch (err) {
      console.error("Error pinning notes:", err);
      toast.error("Failed to pin some notes");
    }
  }; */

  // Convert notes to CSV format
  const convertNotesToCSV = (notes) => {
    const headers = [
      "Title",
      "Content",
      "Category",
      "Priority",
      "Tags",
      "Created Date",
      "Last Modified",
      "Created By",
      "Is Pinned",
    ];

    const csvRows = [headers.join(",")];

    notes.forEach((note) => {
      const row = [
        `"${note.title?.replace(/"/g, '""') || ""}"`,
        `"${note.content?.replace(/"/g, '""') || ""}"`,
        `"${note.category || ""}"`,
        `"${note.priority || ""}"`,
        `"${note.tags?.join("; ") || ""}"`,
        `"${new Date(note.createdAt).toLocaleDateString()}"`,
        `"${new Date(note.updatedAt).toLocaleDateString()}"`,
        `"${
          note.createdBy?.userId?.fullName ||
          note.createdBy?.userId?.agencyName ||
          "Unknown"
        }"`,
        `"${note.isPinned ? "Yes" : "No"}"`,
      ];
      csvRows.push(row.join(","));
    });

    return csvRows.join("\n");
  };

  // Generate PDF export
  const generatePDFExport = async (notes) => {
    // This would require a PDF library like jsPDF
    // For now, we'll create a formatted text version
    let pdfContent = `NOTES EXPORT REPORT\n`;
    pdfContent += `Generated: ${new Date().toLocaleString()}\n`;
    pdfContent += `Total Notes: ${notes.length}\n`;
    pdfContent += `Model ID: ${modelId}\n\n`;
    pdfContent += "=".repeat(50) + "\n\n";

    notes.forEach((note, index) => {
      pdfContent += `${index + 1}. ${note.title}\n`;
      pdfContent += `Category: ${note.category} | Priority: ${note.priority}\n`;
      pdfContent += `Created: ${new Date(
        note.createdAt,
      ).toLocaleDateString()}\n`;
      pdfContent += `Content: ${note.content}\n`;
      if (note.tags?.length > 0) {
        pdfContent += `Tags: ${note.tags.join(", ")}\n`;
      }
      pdfContent += "-".repeat(30) + "\n\n";
    });

    return pdfContent;
  };

  // Export notes functionality
  const exportNotes = async (format = "json") => {
    try {
      const notesToExport =
        selectedNotes.size > 0
          ? notes.filter((note) => selectedNotes.has(note._id))
          : filteredNotes;

      if (notesToExport.length === 0) {
        toast.error("No notes to export");
        return;
      }

      let dataStr;
      let mimeType;
      let fileExtension;

      switch (format) {
        case "csv":
          dataStr = convertNotesToCSV(notesToExport);
          mimeType = "text/csv";
          fileExtension = "csv";
          break;
        case "pdf":
          dataStr = await generatePDFExport(notesToExport);
          mimeType = "text/plain"; // For now, until we implement proper PDF
          fileExtension = "txt";
          break;
        case "json":
        default:
          const exportData = {
            metadata: {
              exportedAt: new Date().toISOString(),
              totalNotes: notesToExport.length,
              modelId: modelId,
              exportFormat: "json",
              version: "1.0",
            },
            notes: notesToExport.map((note) => ({
              id: note._id,
              title: note.title,
              content: note.content,
              category: note.category,
              priority: note.priority,
              tags: note.tags,
              isPinned: note.isPinned,
              createdAt: note.createdAt,
              updatedAt: note.updatedAt,
              createdBy: note.createdBy,
              attachments: note.attachments?.length || 0,
              reminders: note.reminders?.length || 0,
            })),
          };
          dataStr = JSON.stringify(exportData, null, 2);
          mimeType = "application/json";
          fileExtension = "json";
          break;
      }

      const dataBlob = new Blob([dataStr], { type: mimeType });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `notes-export-${
        new Date().toISOString().split("T")[0]
      }.${fileExtension}`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(
        `${notesToExport.length} notes exported as ${format.toUpperCase()}`,
        {
          description: `File saved as notes-export-${
            new Date().toISOString().split("T")[0]
          }.${fileExtension}`,
        },
      );
    } catch (err) {
      console.error("Error exporting notes:", err);
      toast.error("Failed to export notes");
    }
  };

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportOptions && !event.target.closest(".export-dropdown")) {
        setShowExportOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showExportOptions]);

  // Initial data fetch
  useEffect(() => {
    if (modelId && token) {
      fetchNotes();
      fetchStats();
    }
  }, [modelId, token]);

  if (loading && notes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with Stats */}
      {stats && (
        <>
          {/* Error banner for stats */}
          {statsError ? (
            <div className="text-red-400 p-4 bg-gray-800 rounded mb-4">
              {statsError}
              <button
                onClick={retryFetchStats}
                className="ml-2 px-2 py-1 bg-blue-600 rounded hover:bg-blue-700 text-white"
              >
                Retry
              </button>
            </div>
          ) : (
            <NoteStats stats={stats} loading={loading} />
          )}
        </>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <FileText className="text-blue-400" size={24} />
            </div>
            Notes Manager
          </h2>
          <p className="text-gray-300 text-sm mt-2">
            Manage your notes, reminders, and attachments
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-1 flex border border-gray-600">
            <button
              onClick={() => setCurrentView("notes")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 h-[42px] flex items-center ${
                currentView === "notes"
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              <FileText size={16} className="mr-2" />
              Notes
            </button>
            <button
              onClick={() => setCurrentView("analytics")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 h-[42px] flex items-center ${
                currentView === "analytics"
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              <BarChart3 size={16} className="mr-2" />
              Analytics
            </button>
          </div>

          {/* System Overview Button */}
          <button
            onClick={() => setShowSystemOverview(true)}
            className="bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-600 hover:to-pink-600 text-white px-3 py-2 rounded-xl flex items-center gap-1 transition-all duration-200 border border-purple-500/30 shadow-lg backdrop-blur-sm font-medium h-[42px] whitespace-nowrap"
            title="View complete system overview"
          >
            <div className="p-1 bg-white/20 rounded-lg">
              <Info size={16} />
            </div>
            System Overview
          </button>

          {currentView === "notes" && (
            <div className="flex items-center gap-3">
              {/* Primary Actions Group */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-3 py-2 rounded-xl flex items-center gap-1 transition-all duration-200 shadow-lg border border-blue-500/30 font-medium h-[42px] whitespace-nowrap"
                >
                  <div className="p-1 bg-white/20 rounded-lg">
                    <Plus size={16} />
                  </div>
                  Create Note
                </button>

                <button
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-200 border font-medium h-[42px] ${
                    showFilterPanel
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg border-blue-500/30"
                      : "bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border-gray-600 backdrop-blur-sm hover:border-gray-500"
                  }`}
                >
                  <div className="p-1 bg-white/20 rounded-lg">
                    <Filter size={16} />
                  </div>
                  Filters
                </button>
              </div>

              {/* Secondary Actions Group */}
              <div className="flex items-center gap-3 border-l border-gray-600 pl-4">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border-gray-600 backdrop-blur-sm hover:border-gray-500 px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-200 border font-medium h-[42px] disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh notes"
                >
                  <div className="p-1 bg-white/20 rounded-lg">
                    <RefreshCw
                      size={16}
                      className={loading ? "animate-spin" : ""}
                    />
                  </div>
                  Refresh
                </button>

                <div className="relative export-dropdown">
                  <button
                    onClick={() => setShowExportOptions(!showExportOptions)}
                    className="bg-gradient-to-r from-green-600/80 to-emerald-600/80 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg border border-green-500/30 font-medium h-[42px]"
                  >
                    <div className="p-1 bg-white/20 rounded-lg">
                      <Download size={16} />
                    </div>
                    Export
                  </button>

                  {/* Export Options Dropdown */}
                  {showExportOptions && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 border border-gray-600 rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="p-2">
                        <button
                          onClick={() => {
                            exportNotes("json");
                            setShowExportOptions(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <FileText size={14} />
                          Export as JSON
                        </button>
                        <button
                          onClick={() => {
                            exportNotes("csv");
                            setShowExportOptions(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <FileText size={14} />
                          Export as CSV
                        </button>
                        <button
                          onClick={() => {
                            exportNotes("pdf");
                            setShowExportOptions(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <FileText size={14} />
                          Export as PDF
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bulk Actions Button - Temporarily Disabled */}
                {/* <button
                  onClick={() => setBulkActionMode(!bulkActionMode)}
                  className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 border font-medium ${
                    bulkActionMode
                      ? "bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg border-orange-500/30"
                      : "bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border-gray-600 backdrop-blur-sm hover:border-gray-500"
                  }`}
                >
                  <CheckSquare size={16} />
                  {bulkActionMode ? "Exit Bulk" : "Bulk Actions"}
                </button> */}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search and Actions Bar */}
      {currentView === "notes" && (
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search notes by title, content, or tags..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => handleSearch("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <FileText size={14} />
                <span>{filteredNotes.length} notes</span>
              </div>
              {selectedNotes.size > 0 && (
                <div className="flex items-center gap-1 text-blue-400">
                  <CheckSquare size={14} />
                  <span>{selectedNotes.size} selected</span>
                </div>
              )}
            </div>
          </div>

          {/* Bulk Action Select All - Temporarily Disabled */}
        </div>
      )}

      {/* Filter Panel */}
      {showFilterPanel && (
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onClose={() => setShowFilterPanel(false)}
        />
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 flex items-center gap-2 text-red-300">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Main Content */}
      {currentView === "analytics" ? (
        <NotesAnalytics
          modelId={modelId}
          agencyId={agencyId}
          userRole={userRole}
        />
      ) : (
        <>
          {/* Notes Grid */}
          {filteredNotes.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredNotes.map((note) => (
                <div key={note._id} className="relative">
                  <NoteCard
                    note={note}
                    userRole={userRole}
                    onEdit={(note) => {
                      setSelectedNote(note);
                      setShowEditModal(true);
                    }}
                    onDelete={handleDeleteNote}
                    onTogglePin={handleTogglePin}
                    onView={handleViewNoteDetails}
                    onUpdatePriority={handleUpdatePriority}
                    isSelected={false}
                    bulkMode={false}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                {searchTerm ||
                Object.values(filters).some((f) => f && f.length > 0)
                  ? "No notes found"
                  : "No notes yet"}
              </h3>
              <p className="text-gray-500">
                {searchTerm ||
                Object.values(filters).some((f) => f && f.length > 0)
                  ? "Try adjusting your search or filters"
                  : userRole === "agency"
                    ? "Create your first note to get started"
                    : "No notes have been shared with you yet"}
              </p>
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
          >
            Previous
          </button>

          <span className="text-gray-400">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateNoteModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateNote}
        />
      )}

      {showEditModal && selectedNote && (
        <EditNoteModal
          note={selectedNote}
          onClose={() => {
            setShowEditModal(false);
            setSelectedNote(null);
          }}
          onSubmit={(updateData) =>
            handleUpdateNote(selectedNote._id, updateData)
          }
        />
      )}

      {/* Note Details Modal */}
      {showNoteDetails && selectedNoteForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Note Details</h2>
              <button
                onClick={() => {
                  setShowNoteDetails(false);
                  setSelectedNoteForDetails(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Note Content */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-2">
                  {selectedNoteForDetails.title}
                </h3>
                <p className="text-gray-300">
                  {selectedNoteForDetails.content}
                </p>
              </div>

              {/* Reminders */}
              <ReminderSystem
                noteId={selectedNoteForDetails._id}
                reminders={noteReminders}
                onUpdate={handleReminderUpdate}
              />

              {/* Attachments */}
              <FileAttachment
                noteId={selectedNoteForDetails._id}
                attachments={noteAttachments}
                onAttachmentsUpdate={handleAttachmentUpdate}
              />
            </div>
          </div>
        </div>
      )}

      {/* System Overview Modal */}
      {showSystemOverview && (
        <SystemOverview
          modelId={modelId}
          agencyId={agencyId}
          userRole={userRole}
          onClose={() => setShowSystemOverview(false)}
        />
      )}
    </div>
  );
};

export default NotesManager;
