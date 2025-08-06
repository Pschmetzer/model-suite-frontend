import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import {
  Ban,
  Trash2,
  Calendar,
  CalendarClock,
  X,
  Info,
  Globe,
  ChevronDown,
  List,
  CalendarDays,
} from "lucide-react";
import Button from "../ui/Button";
import { toast } from "react-hot-toast";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import AbsenceDetailModal from "./AbsenceDetailModal";
import ConfirmationDialog from "./ConfirmationDialog";
import { usePermissions } from "../../hooks/usePermissions";
import PermissionGuard from "../common/PermissionGuard";

const ModelAbsencePanel = ({ ModelId, role }) => {
  const { hasPermission, hasFullAccess } = usePermissions();
  const [absences, setAbsences] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    note: "",
  });

  // Calendar related states
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode
  const [viewType, setViewType] = useState("calendar"); // 'calendar' or 'list'
  const calendarRef = useRef(null);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    absenceId: null,
    title: "",
    message: "",
  });

  // Set the calendar view as default
  useEffect(() => {
    // Initialize with calendar view
    setViewType("calendar");

    // Check if user has a preference stored
    const savedViewType = localStorage.getItem("absenceViewType");
    if (savedViewType) {
      setViewType(savedViewType);
    }
  }, []);

  const user = JSON.parse(localStorage.getItem("auth"))?.user;
  const token = JSON.parse(localStorage.getItem("auth"))?.token;
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  // Fetch absences on component mount
  useEffect(() => {
    fetchAbsences();
  }, []);

  // Convert absences to calendar events format
  const convertAbsencesToEvents = (absences) => {
    return absences.map((absence) => {
      // Create a new Date object for the end date
      const endDate = new Date(absence.endDate);
      // Add one day to make the end date inclusive in the calendar display
      endDate.setDate(endDate.getDate() + 1);

      return {
        id: absence._id,
        title: absence.note || "Absence",
        start: absence.startDate,
        end: endDate.toISOString(), // Use the adjusted end date
        allDay: true,
        backgroundColor: "#EF4444", // Red color for absences
        borderColor: "#B91C1C",
        textColor: "#FFFFFF",
        extendedProps: {
          description: absence.note || "Absence",
          absenceId: absence._id,
        },
      };
    });
  };

  const fetchAbsences = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!token) {
        toast.error("Authentication required");
        setIsLoading(false);
        return;
      }

      const response = await axios.get(
        `${baseURL}/availability/model/${ModelId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        // Sort absences by start date (newest first)
        const sortedAbsences = response.data.absences.sort(
          (a, b) => new Date(a.startDate) - new Date(b.startDate),
        );
        setAbsences(sortedAbsences);

        // Convert absences to calendar events
        const events = convertAbsencesToEvents(sortedAbsences);
        setCalendarEvents(events);
      }
    } catch (error) {
      console.error("Fetch absences error:", error);
      setError("Failed to fetch absences");
      toast.error("Failed to fetch absences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!token) {
        toast.error("Authentication required");
        setIsLoading(false);
        return;
      }

      // Validate dates
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        toast.error("Start date cannot be after end date");
        setIsLoading(false);
        return;
      }

      // Create new absence
      const response = await axios.post(
        `${baseURL}/availability/create`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        toast.success("Absence created successfully");
        setFormData({
          startDate: "",
          endDate: "",
          note: "",
        });
        setShowForm(false);
        await fetchAbsences(); // Refresh the list and calendar

        // If in calendar view, navigate to the absence's start date
        if (viewType === "calendar" && calendarRef.current) {
          const calendarApi = calendarRef.current.getApi();
          calendarApi.gotoDate(formData.startDate);
        }
      }
    } catch (error) {
      console.error("Absence operation error:", error);
      toast.error(error.response?.data?.message || "Failed to process absence");
    } finally {
      setIsLoading(false);
    }
  };

  // Show confirmation dialog before deleting
  const confirmDelete = (id) => {
    // Find the absence to get its details
    const absence = absences.find((a) => a._id === id);
    if (!absence) return;

    // Format dates for the confirmation message
    const startDate = formatDate(absence.startDate);
    const endDate = formatDate(absence.endDate);
    const title = absence.note || "Absence";

    setConfirmDialog({
      isOpen: true,
      absenceId: id,
      title: "Delete Absence",
      message: `Are you sure you want to delete the absence "${title}" from ${startDate} to ${endDate}? This action cannot be undone.`,
    });

    // If the detail modal is open, close it
    if (selectedAbsence && selectedAbsence._id === id) {
      setSelectedAbsence(null);
    }
  };

  // Handle the actual deletion after confirmation
  const handleDelete = async (id) => {
    setIsLoading(true);
    try {
      if (!token) {
        toast.error("Authentication required");
        setIsLoading(false);
        return;
      }

      const response = await axios.delete(
        `${baseURL}/availability/delete/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        toast.success("Absence deleted successfully");
        fetchAbsences(); // Refresh the list
      }
    } catch (error) {
      console.error("Delete absence error:", error);
      toast.error("Failed to delete absence");
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // State for the detail modal
  const [selectedAbsence, setSelectedAbsence] = useState(null);

  // Handle calendar event click
  const handleEventClick = (info) => {
    const eventId = info.event.id;
    const absence = absences.find((a) => a._id === eventId);

    if (!absence) return;

    // Set the selected absence to show the detail modal
    setSelectedAbsence(absence);

    // Also highlight the absence in the list if it's visible
    const listItem = document.getElementById(`absence-${absence._id}`);
    if (listItem) {
      listItem.scrollIntoView({ behavior: "smooth" });
      listItem.classList.add("highlight-absence");
      setTimeout(() => {
        listItem.classList.remove("highlight-absence");
      }, 2000);
    }
  };

  // Handle edit from modal
  const handleEditFromModal = async (absence) => {
    if (role === "model") {
      try {
        setIsLoading(true);

        // Prepare the form data for editing
        const editData = {
          startDate: absence.startDate.split("T")[0],
          endDate: absence.endDate.split("T")[0],
          note: absence.note || "",
        };

        // Make API call to update the absence
        const response = await axios.put(
          `${baseURL}/availability/update/${absence._id}`,
          editData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.data.success) {
          toast.success("Absence updated successfully");
          await fetchAbsences(); // Refresh the list and calendar
          setSelectedAbsence(null); // Close the modal
        }
      } catch (error) {
        console.error("Update absence error:", error);
        toast.error(
          error.response?.data?.message || "Failed to update absence",
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle clicking on an absence in the list view
  const handleAbsenceClick = (absence) => {
    setSelectedAbsence(absence);
  };

  // Memoized event content renderer for better performance
  const renderEventContent = useMemo(
    () => (eventInfo) => {
      // For month view, use a more compact display
      if (currentView === "dayGridMonth") {
        return (
          <div className="p-1 h-full w-full hover:brightness-110 transition-all duration-200 cursor-pointer">
            <div className="font-medium text-xs truncate flex items-center gap-1">
              <Ban className="h-2 w-2 opacity-70" />
              {eventInfo.event.title}
            </div>
          </div>
        );
      }

      // For other views, use the full display
      return (
        <div className="p-1 h-full w-full hover:brightness-110 transition-all duration-200 cursor-pointer">
          <div className="font-medium text-xs truncate flex items-center gap-1">
            <Ban className="h-3 w-3 opacity-70" />
            {eventInfo.event.title}
          </div>
          <div className="text-xs opacity-80 mt-0.5">
            {formatDate(eventInfo.event.start)} -{" "}
            {formatDate(eventInfo.event.end)}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            Click to view details
          </div>
        </div>
      );
    },
    [currentView],
  );

  // Calendar configuration
  const calendarConfig = useMemo(
    () => ({
      plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
      initialView: currentView,
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
      },
      dayMaxEvents: true,
      weekends: true,
      events: calendarEvents,
      dayMaxEventRows: true,
      eventClick: handleEventClick,
      eventContent: renderEventContent,
      height: "auto",
      themeSystem: "standard", // Always use standard theme and apply custom styling
      allDaySlot: true,
      nowIndicator: true,
      stickyHeaderDates: true,
      dayHeaderFormat: {
        weekday: "short",
        day: "numeric",
        omitCommas: true,
      },
      views: {
        timeGrid: {
          dayMaxEventRows: 6,
          eventMaxStack: 3,
        },
        dayGridMonth: {
          dayMaxEventRows: 4,
          moreLinkClick: "popover",
        },
      },
      businessHours: {
        daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
        startTime: "09:00",
        endTime: "17:00",
      },
      eventDisplay: "block",
      eventBackgroundColor: "#EF4444", // Red color for absences
      eventBorderColor: "#B91C1C",
      eventClassNames: `rounded-md shadow-md ${darkMode ? "border-gray-700" : "border-gray-200"}`,
      viewDidMount: (arg) => {
        setCurrentView(arg.view.type);
      },
      // Custom styling
      dayCellClassNames: darkMode
        ? "dark-cell hover:bg-gray-800/50"
        : "light-cell hover:bg-gray-50",
      dayHeaderClassNames: darkMode ? "dark-header" : "light-header",
      moreLinkClassNames: darkMode ? "dark-more-link" : "light-more-link",
      // Rounded corners for events
      eventDidMount: (info) => {
        info.el.style.borderRadius = "8px";
        info.el.style.overflow = "hidden";
        info.el.style.transition = "all 0.2s ease";
        info.el.style.border = darkMode
          ? "1px solid rgba(239, 68, 68, 0.3)"
          : "1px solid rgba(239, 68, 68, 0.3)";
        info.el.style.cursor = "pointer";

        // Add hover effect
        info.el.addEventListener("mouseenter", () => {
          info.el.style.transform = "translateY(-2px)";
          info.el.style.boxShadow = darkMode
            ? "0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)"
            : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
        });

        info.el.addEventListener("mouseleave", () => {
          info.el.style.transform = "translateY(0)";
          info.el.style.boxShadow = "";
        });
      },
    }),
    [
      darkMode,
      calendarEvents,
      handleEventClick,
      renderEventContent,
      currentView,
    ],
  );

  // Add custom CSS for FullCalendar in dark mode
  useEffect(() => {
    if (darkMode) {
      // Apply dark mode styles to FullCalendar
      const style = document.createElement("style");
      style.id = "fullcalendar-dark-mode";
      style.innerHTML = `
        .fc-theme-standard .fc-scrollgrid,
        .fc-theme-standard .fc-list {
          border-color: #374151;
        }
        .fc-theme-standard td,
        .fc-theme-standard th {
          border-color: #374151;
        }
        .fc-theme-standard .fc-list-day-cushion {
          background-color: #1F2937;
        }
        .fc .fc-list-event:hover td {
          background-color: #374151;
        }
        .fc-theme-standard .fc-popover {
          background-color: #1F2937;
          border-color: #374151;
        }
        .fc .fc-highlight {
          background-color: rgba(99, 102, 241, 0.2);
        }
        .fc .fc-col-header-cell-cushion {
          color: #D1D5DB;
        }
        .fc .fc-daygrid-day-number {
          color: #D1D5DB;
        }
        .fc-theme-standard .fc-list-day-cushion {
          color: #D1D5DB;
        }
        .fc-direction-ltr .fc-daygrid-event.fc-event-end,
        .fc-direction-rtl .fc-daygrid-event.fc-event-start {
          margin-right: 2px;
        }
        .fc-direction-ltr .fc-daygrid-event.fc-event-start,
        .fc-direction-rtl .fc-daygrid-event.fc-event-end {
          margin-left: 2px;
        }
        .fc .fc-day-today {
          background-color: rgba(99, 102, 241, 0.1) !important;
        }
        .fc .fc-timegrid-slot-minor {
          border-top-color: #374151;
        }
        .fc .fc-timegrid-slot-label-cushion {
          color: #D1D5DB;
        }
        .fc-theme-standard .fc-popover-header {
          background-color: #374151;
          color: #D1D5DB;
        }
        .fc .fc-button-primary {
          background-color: #4B5563;
          border-color: #6B7280;
          color: #F3F4F6;
        }
        .fc .fc-button-primary:hover {
          background-color: #374151;
          border-color: #4B5563;
        }
        .fc .fc-button-primary:disabled {
          background-color: #6B7280;
          border-color: #9CA3AF;
        }
        .fc .fc-button-primary:not(:disabled).fc-button-active,
        .fc .fc-button-primary:not(:disabled):active {
          background-color: #4F46E5;
          border-color: #4338CA;
        }
        .fc-daygrid-day-frame {
          min-height: 100px;
        }
      `;
      document.head.appendChild(style);

      return () => {
        const existingStyle = document.getElementById("fullcalendar-dark-mode");
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, [darkMode]);

  return (
    <PermissionGuard requiredPermission="calendar.view">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold flex items-center">
              <Ban className="mr-2 text-red-500" /> Manage Your Absences
            </h1>

            {/* View toggle */}
            <div className="flex items-center bg-gray-800 rounded-lg p-1 border border-gray-700">
              <button
                onClick={() => {
                  setViewType("calendar");
                  localStorage.setItem("absenceViewType", "calendar");
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center ${viewType === "calendar" ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-gray-700"}`}
              >
                <Calendar className="mr-1.5 h-4 w-4" />
                Calendar
              </button>
              <button
                onClick={() => {
                  setViewType("list");
                  localStorage.setItem("absenceViewType", "list");
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center ${viewType === "list" ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-gray-700"}`}
              >
                <Info className="mr-1.5 h-4 w-4" />
                List
              </button>
            </div>
          </div>

          {role === "model" && (
            <PermissionGuard requiredPermission="calendar.create">
              <Button
                onClick={() => setShowForm(!showForm)}
                variant={showForm ? "danger" : "default"}
                className="flex items-center"
              >
                {showForm ? (
                  <>
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" /> Add New Absence
                  </>
                )}
              </Button>
            </PermissionGuard>
          )}
        </div>

        {/* Absence Detail Modal */}
        {selectedAbsence && (
          <AbsenceDetailModal
            absence={selectedAbsence}
            onClose={() => setSelectedAbsence(null)}
            onEdit={handleEditFromModal}
            onDelete={confirmDelete}
            formatDate={formatDate}
          />
        )}

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
          onConfirm={() => handleDelete(confirmDialog.absenceId)}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText="Delete"
          cancelText="Cancel"
        />

        {showForm && (
          <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <CalendarClock className="mr-2 text-blue-400" /> Schedule New
              Absence
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  placeholder="E.g., Vacation, Personal leave, etc."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center"
                >
                  {isLoading ? "Saving..." : "Save Absence"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {isLoading && !showForm && (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!isLoading && absences.length === 0 && (
          <div className="bg-gray-800/50 rounded-xl p-8 text-center border border-gray-700">
            <Ban className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-xl font-medium text-gray-300 mb-2">
              No Absences Found
            </h3>
            <p className="text-gray-400 mb-4">
              You haven't scheduled any absences yet. Add your first absence by
              clicking the button above.
            </p>
          </div>
        )}

        {/* Calendar View */}
        {viewType === "calendar" && (
          <div className="mb-8">
            <div
              className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-xl shadow-xl overflow-hidden border transition-colors duration-200 hover:shadow-2xl relative`}
            >
              {/* Calendar Header */}
              <div
                className={`p-4 ${darkMode ? "bg-gray-700" : "bg-gray-100"} border-b ${darkMode ? "border-gray-600" : "border-gray-300"} flex items-center justify-between`}
              >
                <div className="flex items-center space-x-3">
                  <Calendar
                    className={`h-5 w-5 ${darkMode ? "text-red-400" : "text-red-500"}`}
                  />
                  <h2 className="text-lg font-semibold">Your Absences</h2>
                </div>
                <div
                  className={`text-sm px-3 py-1 rounded-full ${darkMode ? "bg-gray-800 text-gray-300" : "bg-gray-200 text-gray-700"}`}
                >
                  {absences.length} scheduled absence
                  {absences.length !== 1 ? "s" : ""}
                </div>
              </div>

              {/* FullCalendar Component */}
              <div className="calendar-container">
                <FullCalendar ref={calendarRef} {...calendarConfig} />
              </div>

              {/* Custom CSS for calendar styling */}
              <style jsx>{`
                .calendar-container {
                  height: 650px;
                  max-height: 70vh;
                }

                /* Highlight style for absence items when clicked in calendar */
                :global(.highlight-absence) {
                  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1);
                }

                @keyframes pulse {
                  0%,
                  100% {
                    background-color: rgba(239, 68, 68, 0.1);
                    border-color: rgba(239, 68, 68, 0.5);
                  }
                  50% {
                    background-color: rgba(239, 68, 68, 0.2);
                    border-color: rgba(239, 68, 68, 0.8);
                  }
                }
              `}</style>
            </div>
          </div>
        )}

        {/* List View */}
        {(viewType === "list" || absences.length > 0) && (
          <div className="space-y-4">
            {viewType === "list" && (
              <div className="flex items-center text-sm text-gray-400 mb-2">
                <Info className="h-4 w-4 mr-2" />
                <span>
                  Showing {absences.length} scheduled absence
                  {absences.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            {absences.map((absence) => (
              <div
                key={absence._id}
                id={`absence-${absence._id}`}
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors shadow-md flex justify-between items-center cursor-pointer hover:bg-gray-750"
                onClick={() => handleAbsenceClick(absence)}
              >
                <div>
                  <div className="flex items-center">
                    <Ban className="h-5 w-5 text-red-500 mr-2" />
                    <h3 className="font-medium text-white">
                      {absence.note || "Absence"}
                    </h3>
                  </div>
                  <div className="mt-1 text-sm text-gray-300 flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    {formatDate(absence.startDate)} -{" "}
                    {formatDate(absence.endDate)}
                  </div>
                </div>
                <div className="flex items-center">
                  <PermissionGuard requiredPermission="calendar.edit">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the parent onClick
                        confirmDelete(absence._id);
                      }}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-500/10"
                      aria-label="Delete absence"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </PermissionGuard>
                  <div className="ml-2 text-xs text-gray-400 hidden md:block">
                    Click to view details
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PermissionGuard>
  );
};

export default ModelAbsencePanel;
