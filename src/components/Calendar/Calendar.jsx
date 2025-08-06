import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";
import { toast } from "react-hot-toast";
import { logoutAndRedirect } from "../../utils/logout";
import { motion, AnimatePresence } from "framer-motion";
import { usePermissions } from "../../hooks/usePermissions";
import PermissionGuard from "../common/PermissionGuard";
import {
  CalendarIcon,
  Plus,
  X,
  Tag,
  AlertCircle,
  Clock,
  CheckCircle2,
  Edit2,
  Trash2,
  Moon,
  Sun,
  Repeat,
  Globe,
  Calendar,
  Search,
  Link2,
  Link2Off,
  Video,
  Users,
  Ban,
} from "lucide-react";

// Current Time Indicator Component for Second Timezone
const CurrentTimeIndicator = ({ darkMode, secondTimezone, localTimezone }) => {
  const [currentPosition, setCurrentPosition] = useState(0);
  const [currentTime, setCurrentTime] = useState("");

  // Calculate the current time position and update it every minute
  useEffect(() => {
    const calculateTimePosition = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // Calculate position based on hours and minutes (6am to 10pm range = 16 hours = 768px total height)
      // Each hour is 48px tall
      if (hours < 6) {
        // Before 6am, position at the top
        setCurrentPosition(0);
      } else if (hours >= 22) {
        // After 10pm, position at the bottom
        setCurrentPosition(768);
      } else {
        // Calculate position within the visible range
        const hourPosition = (hours - 6) * 48; // Each hour is 48px
        const minutePosition = (minutes / 60) * 48; // Fraction of an hour
        setCurrentPosition(hourPosition + minutePosition);
      }

      // Format current time for display
      setCurrentTime(
        new Date().toLocaleString("en-US", {
          timeZone: secondTimezone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      );
    };

    // Calculate initial position
    calculateTimePosition();

    // Update position every minute
    const intervalId = setInterval(calculateTimePosition, 60000);

    // Sync with main calendar's now indicator
    const syncWithMainCalendar = () => {
      const mainNowIndicator = document.querySelector(
        ".fc-timegrid-now-indicator-line",
      );
      const secondTimezoneContainer = document.getElementById(
        "second-timezone-container",
      );

      if (mainNowIndicator && secondTimezoneContainer) {
        // Get the position of the main calendar's now indicator
        const mainIndicatorTop = mainNowIndicator.getBoundingClientRect().top;
        const fcBodyTop = document
          .querySelector(".fc-timegrid-body")
          .getBoundingClientRect().top;
        const relativePosition = mainIndicatorTop - fcBodyTop;

        // Sync the scroll position of the second timezone container
        secondTimezoneContainer.scrollTop =
          document.querySelector(".fc-timegrid-body").scrollTop;
      }
    };

    // Initial sync
    setTimeout(syncWithMainCalendar, 500);

    // Set up mutation observer to detect changes in the main calendar
    const observer = new MutationObserver(syncWithMainCalendar);
    const fcBody = document.querySelector(".fc-timegrid-body");

    if (fcBody) {
      observer.observe(fcBody, {
        attributes: true,
        childList: true,
        subtree: true,
      });

      // Also sync when scrolling the main calendar
      fcBody.addEventListener("scroll", () => {
        const secondTimezoneContainer = document.getElementById(
          "second-timezone-container",
        );
        if (secondTimezoneContainer) {
          secondTimezoneContainer.scrollTop = fcBody.scrollTop;
        }
      });
    }

    return () => {
      clearInterval(intervalId);
      observer.disconnect();
      if (fcBody) {
        fcBody.removeEventListener("scroll", syncWithMainCalendar);
      }
    };
  }, [secondTimezone, localTimezone]);

  return (
    <div
      className="absolute w-full z-10 pointer-events-none"
      style={{ top: `${currentPosition}px` }}
    >
      <div className="flex items-center w-full">
        <div
          className={`h-[2px] w-full ${darkMode ? "bg-red-500" : "bg-red-600"} relative`}
        >
          <div
            className={`absolute -left-1 top-1/2 transform -translate-y-1/2 ${darkMode ? "bg-red-500" : "bg-red-600"} rounded-full h-2 w-2`}
          ></div>
          <div
            className={`absolute right-0 -top-5 ${darkMode ? "bg-red-500/20 text-red-300" : "bg-red-100 text-red-600"} text-xs px-1.5 py-0.5 rounded`}
          >
            {currentTime}
          </div>
        </div>
      </div>
    </div>
  );
};

const CalendarView = ({ modelId }) => {
  const { hasPermission, hasFullAccess } = usePermissions();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);

  // Set all events without filtering
  useEffect(() => {
    if (!events || events.length === 0) {
      setFilteredEvents([]);
      return;
    }

    // Use all events without filtering for absences
    setFilteredEvents(events);
  }, [events]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    start: "",
    end: "",
    allDay: false,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Default to local timezone
    recurrence: "none",
    recurrenceEndDate: "",
  });

  // List of common timezones for the dropdown
  const commonTimezones = [
    "UTC",
    "America/New_York", // Eastern Time
    "America/Chicago", // Central Time
    "America/Denver", // Mountain Time
    "America/Los_Angeles", // Pacific Time
    "Europe/London", // GMT/BST
    "Europe/Paris", // Central European Time
    "Asia/Tokyo", // Japan
    "Asia/Shanghai", // China
    "Australia/Sydney", // Australia Eastern
    Intl.DateTimeFormat().resolvedOptions().timeZone, // User's local timezone
  ];
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [secondTimezone, setSecondTimezone] = useState("");
  const [showSecondTimezone, setShowSecondTimezone] = useState(false);
  const calendarRef = useRef(null);

  // Fetch events when modelId changes
  useEffect(() => {
    if (modelId) {
      fetchEvents();
      checkGoogleConnectionStatus();
    }
  }, [modelId]);

  // Removed duplicate useEffect for filtering events

  const checkGoogleConnectionStatus = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/google/status/${modelId}`,
      );
      setIsGoogleConnected(response.data.connected);
    } catch (error) {
      console.error("Failed to check Google connection status:", error);
      setIsGoogleConnected(false);
    }
  };

  const handleGoogleSync = async () => {
    if (isGoogleConnected) {
      try {
        const token = JSON.parse(localStorage.getItem("auth"))?.token;
        await axios.delete(
          `${import.meta.env.VITE_API_BASE_URL}/google/disconnect`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setIsGoogleConnected(false);
        toast.success("Google Calendar disconnected successfully");
      } catch (error) {
        toast.error("Failed to disconnect Google Calendar");
      }
    } else {
      const token = JSON.parse(localStorage.getItem("auth"))?.token;
      window.location.href = `${import.meta.env.VITE_API_BASE_URL}/google/auth/google?state=${token}`;
    }
  };

  // Refresh events periodically
  useEffect(() => {
    if (!modelId) return;

    const intervalId = setInterval(
      () => {
        fetchEvents(true); // silent refresh
      },
      5 * 60 * 1000,
    ); // every 5 minutes

    return () => clearInterval(intervalId);
  }, [modelId]);

  // Apply custom styles to calendar
  useEffect(() => {
    const applyCustomStyles = () => {
      // Add custom styles to calendar elements
      const calendarEl = document.querySelector(".fc");
      if (!calendarEl) return;

      // Add custom class to calendar
      calendarEl.classList.add("custom-calendar");

      // Style today's date with a special highlight
      const todayEl = document.querySelector(".fc-day-today");
      if (todayEl) {
        todayEl.style.backgroundColor = darkMode
          ? "rgba(79, 70, 229, 0.1)"
          : "rgba(79, 70, 229, 0.05)";
        todayEl.style.borderRadius = "8px";
      }

      // Style the header buttons
      const buttons = document.querySelectorAll(".fc-button");
      buttons.forEach((button) => {
        button.classList.add("transition-all", "duration-200");
        button.addEventListener("mouseenter", () => {
          button.style.transform = "translateY(-2px)";
        });
        button.addEventListener("mouseleave", () => {
          button.style.transform = "translateY(0)";
        });
      });
    };

    // Apply styles after a short delay to ensure calendar is rendered
    const timeoutId = setTimeout(applyCustomStyles, 100);
    return () => clearTimeout(timeoutId);
  }, [darkMode, currentView, events]);

  const fetchEvents = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      // Get auth token from localStorage
      const token = JSON.parse(localStorage.getItem("auth"))?.token;

      if (!token) {
        toast.error("Authentication required");
        return;
      }

      let allEvents = [];

      // Fetch local events
      const localResponse = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/event/${modelId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (localResponse.data.success) {
        allEvents = localResponse.data.events.map((event) => ({
          id: event._id,
          title: event.title,
          description: event.description,
          start: event.start,
          end: event.end,
          allDay: event.allDay,
          backgroundColor: getEventColor(event.title),
          borderColor: getEventColor(event.title),
          textColor: "#FFFFFF",
          extendedProps: {
            description: event.description,
            timezone: event.timezone || "UTC",
            recurrence: event.recurrence || "none",
            recurrenceEndDate: event.recurrenceEndDate || null,
            source: "local",
          },
        }));
      }

      // We no longer fetch absences here as they're handled in the ModelAbsencePanel component
      // But we do need to fetch them to check for conflicts
      await fetchModelAbsences();

      // Fetch Google Calendar events if connected
      if (isGoogleConnected) {
        try {
          const googleResponse = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/googleEvent/get/${modelId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          const googleEvents = googleResponse.data.map((event) => ({
            id: event.id,
            title: event.title,
            description: event.description,
            start: event.start,
            end: event.end,
            backgroundColor: "#4285F4",
            borderColor: "#4285F4",
            textColor: "#FFFFFF",
            extendedProps: {
              description: event.description,
              timezone: event.timezone || "UTC",
              meetLink: event.meetLink,
              guests: event.guests,
              source: "google",
            },
          }));

          allEvents = [...allEvents, ...googleEvents];
        } catch (error) {
          console.error("Google Calendar fetch error:", error);
          if (!silent) {
            toast.error("Failed to fetch Google Calendar events");
          }
        }
      }

      setEvents(allEvents);

      // Force calendar to re-render, especially for month view
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.refetchEvents();

        // If in month view, force a re-render by briefly switching views
        if (currentView === "dayGridMonth") {
          setTimeout(() => {
            calendarApi.changeView("timeGridDay");
            setTimeout(() => {
              calendarApi.changeView("dayGridMonth");
            }, 50);
          }, 50);
        }
      }
    } catch (error) {
      console.error("Event fetch error:", error);
      setError("Failed to fetch events");
      if (error.response?.status === 401) {
        toast.error("Authentication required. Please log in again.");
        const authData = JSON.parse(localStorage.getItem("auth") || "{}");
        const userRole = authData?.user?.role;
        logoutAndRedirect(userRole);
      } else if (!silent) {
        toast.error("Failed to fetch events");
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Memoized color generator with cache
  const getEventColor = useMemo(() => {
    const colorCache = {};

    return (title) => {
      // Return cached color if we've seen this title before
      if (colorCache[title]) return colorCache[title];

      const colors = [
        "#6366F1", // Indigo-500
        "#8B5CF6", // Violet-500
        "#EC4899", // Pink-500
        "#F43F5E", // Rose-500
        "#10B981", // Emerald-500
        "#06B6D4", // Cyan-500
        "#3B82F6", // Blue-500
        "#F59E0B", // Amber-500
      ];
      let hash = 0;
      for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);
      }
      const color = colors[Math.abs(hash) % colors.length];

      // Cache the result
      colorCache[title] = color;
      return color;
    };
  }, []);

  // Fetch model absences to check for conflicts
  const [modelAbsences, setModelAbsences] = useState([]);

  // Fetch absences on component mount
  useEffect(() => {
    fetchModelAbsences();
  }, [modelId]);

  const fetchModelAbsences = async () => {
    try {
      const token = JSON.parse(localStorage.getItem("auth"))?.token;
      if (!token) return;

      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/availability/model/${modelId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        setModelAbsences(response.data.absences);
      }
    } catch (error) {
      console.error("Error fetching model absences:", error);
    }
  };

  // Check if a date range overlaps with any model absence
  const checkAbsenceOverlap = (startDate, endDate) => {
    // Convert to Date objects for comparison
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Adjust end date to be inclusive (end of day)
    // This fixes the issue where absences appear one day shorter
    end.setHours(23, 59, 59, 999);

    // Check each absence for overlap
    for (const absence of modelAbsences) {
      const absenceStart = new Date(absence.startDate);
      // Set hours to start of day
      absenceStart.setHours(0, 0, 0, 0);

      const absenceEnd = new Date(absence.endDate);
      // Set hours to end of day to make the end date inclusive
      absenceEnd.setHours(23, 59, 59, 999);

      // Check if there's an overlap
      if (
        (start >= absenceStart && start <= absenceEnd) || // Start date falls within absence
        (end >= absenceStart && end <= absenceEnd) || // End date falls within absence
        (start <= absenceStart && end >= absenceEnd) // Absence falls completely within event
      ) {
        return true;
      }
    }

    return false;
  };

  const handleDateSelect = useCallback(
    (selectInfo) => {
      // Check permissions first
      if (!hasFullAccess && !hasPermission("calendar.create")) {
        toast.error("You don't have permission to create calendar events");
        return;
      }

      const now = new Date();
      const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Check if the selected date range overlaps with any model absence
      if (checkAbsenceOverlap(selectInfo.startStr, selectInfo.endStr)) {
        toast.error("Cannot create an event during a model absence period");
        return;
      }

      // Calculate a default recurrence end date (30 days from start)
      const startDate = new Date(selectInfo.startStr);
      const recurrenceEndDate = new Date(startDate);
      recurrenceEndDate.setDate(recurrenceEndDate.getDate() + 30);
      const formattedRecurrenceEndDate = recurrenceEndDate
        .toISOString()
        .slice(0, 10); // Format: YYYY-MM-DD

      setEventForm({
        title: "",
        description: "",
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay,
        timezone: localTimezone,
        recurrence: "none",
        recurrenceEndDate: formattedRecurrenceEndDate,
      });
      setSelectedEvent(null);
      setShowEventModal(true);
    },
    [modelAbsences],
  );

  // Helper function to format date for timezone display
  const formatInTimezone = useCallback((date, timezone) => {
    if (!date) return "";
    try {
      return new Date(date).toLocaleString("en-US", {
        timeZone: timezone,
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch (error) {
      console.error("Timezone formatting error:", error);
      return new Date(date).toLocaleString();
    }
  }, []);

  // Helper function to get time in specific timezone
  const getTimeInTimezone = useCallback((date, timezone) => {
    if (!date) return "";
    try {
      return new Date(date).toLocaleString("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      console.error("Timezone formatting error:", error);
      return new Date(date).toLocaleTimeString();
    }
  }, []);

  // Calculate time difference between timezones
  const getTimezoneDifference = useCallback((timezone1, timezone2) => {
    if (!timezone1 || !timezone2) return "";
    try {
      const now = new Date();
      const time1 = new Date(
        now.toLocaleString("en-US", { timeZone: timezone1 }),
      );
      const time2 = new Date(
        now.toLocaleString("en-US", { timeZone: timezone2 }),
      );

      const diffMs = time1 - time2;
      const diffHrs = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

      if (diffHrs === 0) return "Same time";

      const sign = diffHrs > 0 ? "+" : "";
      return `${sign}${diffHrs} hours`;
    } catch (error) {
      console.error("Timezone difference calculation error:", error);
      return "Unable to calculate";
    }
  }, []);

  const handleEventClick = useCallback((clickInfo) => {
    // Check permissions for viewing/editing events
    if (!hasFullAccess && !hasPermission("calendar.view")) {
      toast.error("You don't have permission to view calendar events");
      return;
    }

    setSelectedEvent(clickInfo.event);

    // Get timezone and recurrence info from event, or use defaults
    const timezone =
      clickInfo.event.extendedProps.timezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone;
    const recurrence = clickInfo.event.extendedProps.recurrence || "none";
    const recurrenceEndDate =
      clickInfo.event.extendedProps.recurrenceEndDate || "";

    // Format recurrence end date if it exists
    let formattedRecurrenceEndDate = "";
    if (recurrenceEndDate) {
      formattedRecurrenceEndDate = new Date(recurrenceEndDate)
        .toISOString()
        .slice(0, 10); // Format: YYYY-MM-DD
    } else if (recurrence !== "none") {
      // If recurrence is set but no end date, default to 30 days from start
      const startDate = new Date(clickInfo.event.startStr);
      const defaultEndDate = new Date(startDate);
      defaultEndDate.setDate(defaultEndDate.getDate() + 30);
      formattedRecurrenceEndDate = defaultEndDate.toISOString().slice(0, 10);
    }

    setEventForm({
      title: clickInfo.event.title,
      description: clickInfo.event.extendedProps.description,
      start: clickInfo.event.startStr,
      end: clickInfo.event.endStr,
      allDay: clickInfo.event.allDay,
      timezone: timezone,
      recurrence: recurrence,
      recurrenceEndDate: formattedRecurrenceEndDate,
    });
    setShowEventModal(true);
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        // Get auth token from localStorage
        const token = JSON.parse(localStorage.getItem("auth"))?.token;

        if (!token) {
          toast.error("Authentication required");
          return;
        }

        // Check for absence conflicts
        if (checkAbsenceOverlap(eventForm.start, eventForm.end)) {
          toast.error(
            "Cannot create or update an event during a model absence period",
          );
          return;
        }

        // Regular event handling
        if (selectedEvent) {
          const response = await axios.put(
            `${import.meta.env.VITE_API_BASE_URL}/event/update/${selectedEvent.id}`,
            { ...eventForm, modelId },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          if (response.data.success) {
            toast.success("Event updated successfully");
            // Refresh events immediately to update the calendar view
            await fetchEvents();
          }
        } else {
          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/event/create`,
            { ...eventForm, modelId },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          if (response.data.success) {
            toast.success("Event created successfully");
            // Refresh events immediately to update the calendar view
            await fetchEvents();

            // If Google Calendar is connected, also create event there
            if (isGoogleConnected) {
              try {
                await axios.post(
                  `${import.meta.env.VITE_API_BASE_URL}/googleEvent/create`,
                  { ...eventForm, modelId },
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  },
                );
                toast.success("Event synced with Google Calendar");
              } catch (error) {
                console.error("Google Calendar sync error:", error);
                toast.error("Failed to sync with Google Calendar");
              }
            }
          }
        }
        setShowEventModal(false);
      } catch (error) {
        console.error("Event save error:", error);
        if (error.response?.status === 401) {
          toast.error("Authentication required. Please log in again.");
          const authData = JSON.parse(localStorage.getItem("auth") || "{}");
          const userRole = authData?.user?.role;
          logoutAndRedirect(userRole);
        } else {
          toast.error(error.response?.data?.message || "Failed to save event");
        }
      }
    },
    [selectedEvent, eventForm, modelId, isGoogleConnected, modelAbsences],
  );

  const handleDelete = useCallback(async () => {
    if (!selectedEvent) return;
    try {
      // Get auth token from localStorage
      const token = JSON.parse(localStorage.getItem("auth"))?.token;

      if (!token) {
        toast.error("Authentication required");
        return;
      }

      // Delete event based on source
      if (selectedEvent.extendedProps.source === "google") {
        // Delete Google Calendar event
        const response = await axios.delete(
          `${import.meta.env.VITE_API_BASE_URL}/googleEvent/delete/${selectedEvent.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            data: {
              modelId: modelId,
            },
          },
        );
        if (response.data.success) {
          toast.success("Google Calendar event deleted successfully");
          setShowEventModal(false);
          fetchEvents();
        }
      } else {
        // Delete regular event
        const response = await axios.delete(
          `${import.meta.env.VITE_API_BASE_URL}/event/delete/${selectedEvent.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (response.data.success) {
          toast.success("Event deleted successfully");
          setShowEventModal(false);
          fetchEvents();
        }
      }
    } catch (error) {
      console.error("Event delete error:", error);
      if (error.response?.status === 401) {
        toast.error("Authentication required. Please log in again.");
        const authData = JSON.parse(localStorage.getItem("auth") || "{}");
        const userRole = authData?.user?.role;
        logoutAndRedirect(userRole);
      } else {
        toast.error("Failed to delete event");
      }
    }
  }, [selectedEvent]);

  // Memoized event content renderer for better performance
  const renderEventContent = useMemo(
    () => (eventInfo) => {
      const { recurrence, timezone, source, meetLink, guests } =
        eventInfo.event.extendedProps;
      const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const showTimezoneIndicator = timezone && timezone !== localTimezone;

      // For month view, use a more compact display
      if (currentView === "dayGridMonth") {
        return (
          <div className="p-1 h-full w-full hover:brightness-110 transition-all duration-200">
            <div className="font-medium text-xs truncate flex items-center gap-1">
              {source === "google" && (
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg"
                  className="h-2 w-2"
                  alt="Google Calendar"
                  title="Google Calendar Event"
                />
              )}
              {recurrence !== "none" && (
                <Repeat className="h-2 w-2 opacity-70" />
              )}
              {eventInfo.event.title}
            </div>
          </div>
        );
      }

      // For other views, use the full display
      return (
        <div className="p-2 h-full hover:brightness-110 transition-all duration-200 hover:translate-y-[-1px]">
          <div className="font-semibold text-sm truncate flex items-center gap-1">
            {source === "google" && (
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg"
                className="h-3 w-3"
                alt="Google Calendar"
                title="Google Calendar Event"
              />
            )}
            {recurrence !== "none" && (
              <Repeat
                className="h-3 w-3 opacity-70"
                title={`Repeats ${recurrence}`}
              />
            )}
            {eventInfo.event.title}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {!eventInfo.event.allDay && (
              <div className="text-xs opacity-90 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(eventInfo.event.start).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}
            {showTimezoneIndicator && (
              <span
                className="text-xs bg-indigo-900/30 text-indigo-200 text-[10px] px-1 rounded flex items-center"
                title={`Timezone: ${timezone}`}
              >
                <Globe className="h-2 w-2 mr-0.5" />
                TZ
              </span>
            )}
            {meetLink && (
              <span
                className="text-xs bg-blue-900/30 text-blue-200 text-[10px] px-1 rounded flex items-center"
                title="Google Meet available"
              >
                <Video className="h-2 w-2 mr-0.5" />
                Meet
              </span>
            )}
            {guests && guests.length > 0 && (
              <span
                className="text-xs bg-purple-900/30 text-purple-200 text-[10px] px-1 rounded flex items-center"
                title={`${guests.length} attendee${guests.length > 1 ? "s" : ""}`}
              >
                <Users className="h-2 w-2 mr-0.5" />
                {guests.length}
              </span>
            )}
          </div>
          {eventInfo.event.extendedProps.description && (
            <div className="text-xs opacity-75 truncate mt-1">
              {eventInfo.event.extendedProps.description.substring(0, 30)}
              {eventInfo.event.extendedProps.description.length > 30 && "..."}
            </div>
          )}
        </div>
      );
    },
    [],
  );

  // Memoize the calendar configuration to prevent unnecessary re-renders
  const calendarConfig = useMemo(
    () => ({
      plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
      initialView: currentView, // Use the currentView state to control the calendar view
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "", // Remove default buttons since we have custom ones in the header
      },
      buttonText: {
        today: "Today",
        month: "Month",
        week: "Week",
        day: "Day",
        list: "List",
      },
      editable: hasFullAccess || hasPermission("calendar.edit"),
      selectable: hasFullAccess || hasPermission("calendar.create"),
      selectMirror: true,
      dayMaxEvents: true,
      weekends: true,
      events: filteredEvents,
      dayMaxEventRows: true,
      select: handleDateSelect,
      eventClick: handleEventClick,
      eventContent: renderEventContent,
      height: "auto",
      themeSystem: darkMode ? "darkly" : "standard",
      slotMinTime: "06:00:00",
      slotMaxTime: "22:00:00",
      allDaySlot: true,
      nowIndicator: true,
      slotEventOverlap: false,
      eventTimeFormat: {
        hour: "2-digit",
        minute: "2-digit",
        meridiem: true,
      },
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
          eventTimeFormat: {
            hour: "2-digit",
            minute: "2-digit",
            meridiem: false,
          },
        },
      },
      businessHours: {
        daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
        startTime: "09:00",
        endTime: "17:00",
      },
      eventDisplay: "auto",
      eventBackgroundColor: darkMode ? "#4F46E5" : "#6366F1",
      eventBorderColor: darkMode ? "#4338CA" : "#4F46E5",
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
          ? "1px solid rgba(79, 70, 229, 0.3)"
          : "1px solid rgba(99, 102, 241, 0.3)";

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
      events,
      handleDateSelect,
      handleEventClick,
      renderEventContent,
      currentView,
      hasFullAccess,
      hasPermission,
    ],
  );

  return (
    <div
      className={`relative min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"} p-4 transition-colors duration-200`}
    >
      {/* Custom CSS for calendar styling */}
      <style jsx>{`
        /* Custom calendar styles */
        :global(.custom-calendar) {
          font-family: "Inter", system-ui, sans-serif;
        }

        :global(.fc) {
          --fc-border-color: ${darkMode ? "#2d3748" : "#e5e7eb"};
          --fc-page-bg-color: ${darkMode ? "#111827" : "#fff"};
          --fc-neutral-bg-color: ${darkMode ? "#1f2937" : "#f9fafb"};
          --fc-list-event-hover-bg-color: ${darkMode ? "#374151" : "#f3f4f6"};
          --fc-today-bg-color: ${darkMode
            ? "rgba(79, 70, 229, 0.15)"
            : "rgba(99, 102, 241, 0.08)"};
          --fc-event-bg-color: ${darkMode ? "#4f46e5" : "#6366F1"};
          --fc-event-border-color: ${darkMode ? "#4338CA" : "#4F46E5"};
          --fc-event-text-color: #ffffff;
          --fc-event-selected-overlay-color: rgba(0, 0, 0, 0.25);
          --fc-more-link-bg-color: ${darkMode ? "#1f2937" : "#f9fafb"};
          --fc-more-link-text-color: ${darkMode ? "#e5e7eb" : "#4b5563"};
          --fc-button-text-color: ${darkMode ? "#e5e7eb" : "#4b5563"};
          --fc-button-bg-color: ${darkMode ? "#374151" : "#f3f4f6"};
          --fc-button-border-color: ${darkMode ? "#4b5563" : "#e5e7eb"};
          --fc-button-hover-bg-color: ${darkMode ? "#4b5563" : "#e5e7eb"};
          --fc-button-hover-border-color: ${darkMode ? "#6b7280" : "#d1d5db"};
          --fc-button-active-bg-color: ${darkMode ? "#4b5563" : "#e5e7eb"};
          --fc-button-active-border-color: ${darkMode ? "#6b7280" : "#d1d5db"};
          --fc-non-business-color: ${darkMode
            ? "rgba(31, 41, 55, 0.5)"
            : "rgba(249, 250, 251, 0.5)"};
          --fc-bg-event-color: ${darkMode
            ? "rgba(31, 41, 55, 0.5)"
            : "rgba(249, 250, 251, 0.5)"};
          --fc-bg-event-opacity: 0.3;
          --fc-highlight-color: rgba(79, 70, 229, 0.15);
          --fc-neutral-text-color: ${darkMode ? "#e5e7eb" : "#4b5563"};
          --fc-neutral-border-color: ${darkMode ? "#2d3748" : "#e5e7eb"};
          font-family:
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            "Helvetica Neue",
            Arial,
            sans-serif;
        }

        :global(.fc-theme-standard) {
          border-radius: 16px;
          overflow: hidden;
          box-shadow: ${darkMode
            ? "0 8px 16px -4px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)"
            : "0 8px 16px -4px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)"};
        }

        :global(.fc-theme-standard th) {
          padding: 14px 0;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          background-color: ${darkMode
            ? "rgba(17, 24, 39, 0.8)"
            : "rgba(249, 250, 251, 0.9)"};
          border-color: ${darkMode
            ? "rgba(55, 65, 81, 0.5)"
            : "rgba(229, 231, 235, 0.8)"};
        }

        :global(.fc-theme-standard td) {
          border-color: ${darkMode
            ? "rgba(55, 65, 81, 0.2)"
            : "rgba(229, 231, 235, 0.6)"};
        }

        :global(.fc-scrollgrid) {
          border-radius: 12px;
          overflow: hidden;
          border: ${darkMode
            ? "1px solid rgba(55, 65, 81, 0.3)"
            : "1px solid rgba(229, 231, 235, 0.8)"};
        }

        :global(.fc-button-primary) {
          background-color: ${darkMode ? "#4F46E5" : "#6366F1"} !important;
          border-color: ${darkMode ? "#4338CA" : "#4F46E5"} !important;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: 8px !important;
          transition: all 0.2s ease;
        }

        :global(.fc-button-primary:hover) {
          background-color: ${darkMode ? "#4338CA" : "#4F46E5"} !important;
          border-color: ${darkMode ? "#3730A3" : "#4338CA"} !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        :global(.fc-button-primary:not(:disabled):active),
        :global(.fc-button-primary.fc-button-active) {
          background-color: ${darkMode ? "#3730A3" : "#4338CA"} !important;
          border-color: ${darkMode ? "#312E81" : "#3730A3"} !important;
          box-shadow: ${darkMode
            ? "inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)"
            : "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)"};
          transform: translateY(0);
        }

        :global(.fc-col-header-cell-cushion) {
          padding: 8px;
          color: ${darkMode
            ? "rgba(255, 255, 255, 0.9)"
            : "rgba(17, 24, 39, 0.9)"};
          font-weight: 600;
        }

        :global(.fc-daygrid-day-number) {
          padding: 8px;
          color: ${darkMode
            ? "rgba(255, 255, 255, 0.9)"
            : "rgba(17, 24, 39, 0.9)"};
          float: none;
          margin: 0;
          font-weight: 500;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        :global(.fc-daygrid-day-number:hover) {
          background-color: ${darkMode
            ? "rgba(79, 70, 229, 0.1)"
            : "rgba(99, 102, 241, 0.1)"};
        }

        :global(.fc-daygrid-day.fc-day-today) {
          background-color: ${darkMode
            ? "rgba(79, 70, 229, 0.15)"
            : "rgba(99, 102, 241, 0.08)"} !important;
          border-radius: 8px;
        }

        :global(.fc-daygrid-day-top) {
          justify-content: center;
          padding-top: 5px;
        }

        :global(.fc-day-today .fc-daygrid-day-number) {
          background-color: ${darkMode ? "#4F46E5" : "#6366F1"};
          color: white;
          box-shadow:
            0 2px 4px 0 rgba(0, 0, 0, 0.1),
            0 1px 2px 0 rgba(0, 0, 0, 0.06);
          font-weight: 600;
        }

        :global(.fc-list-day-cushion) {
          background-color: ${darkMode
            ? "rgba(17, 24, 39, 0.8)"
            : "rgba(249, 250, 251, 0.9)"} !important;
          padding: 12px 16px !important;
          border-radius: 8px 8px 0 0;
        }

        :global(.fc-list-event:hover td) {
          background-color: ${darkMode
            ? "rgba(55, 65, 81, 0.5)"
            : "rgba(243, 244, 246, 0.8)"} !important;
        }

        :global(.fc-list-event td) {
          padding: 10px 14px;
        }

        :global(.fc-timegrid-slot) {
          height: 48px !important;
          border-color: ${darkMode
            ? "rgba(55, 65, 81, 0.2)"
            : "rgba(229, 231, 235, 0.6)"};
        }

        :global(.fc-timegrid-axis) {
          padding-right: 10px;
          font-weight: 500;
        }

        :global(.fc-timegrid-slot-label-cushion) {
          font-size: 0.75rem;
          font-weight: 500;
          color: ${darkMode
            ? "rgba(209, 213, 219, 0.8)"
            : "rgba(75, 85, 99, 0.8)"};
        }

        :global(.fc-event) {
          cursor: pointer;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
          border-radius: 8px;
          box-shadow: ${darkMode
            ? "0 2px 4px rgba(0, 0, 0, 0.2)"
            : "0 2px 4px rgba(0, 0, 0, 0.05)"};
          padding: 1px;
          overflow: hidden;
          display: block !important;
        }

        :global(.fc-daygrid-event) {
          display: block !important;
          z-index: 6;
          margin-top: 1px;
          margin-bottom: 1px;
        }

        :global(.fc-event:hover) {
          z-index: 5;
          transform: translateY(-2px);
          box-shadow: ${darkMode
            ? "0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)"
            : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"};
        }

        :global(.fc-event-main) {
          padding: 2px 4px;
        }

        :global(.fc-event-time) {
          font-size: 0.75rem;
          font-weight: 500;
          opacity: 0.9;
        }

        :global(.fc-toolbar-title) {
          font-size: 1.5rem !important;
          font-weight: 700;
          color: ${darkMode ? "white" : "#111827"};
          letter-spacing: -0.025em;
        }

        :global(.fc-more-link) {
          background-color: ${darkMode
            ? "rgba(55, 65, 81, 0.7)"
            : "rgba(243, 244, 246, 0.7)"};
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
          color: ${darkMode
            ? "rgba(255, 255, 255, 0.9)"
            : "rgba(17, 24, 39, 0.9)"};
          box-shadow: ${darkMode
            ? "0 1px 2px rgba(0, 0, 0, 0.2)"
            : "0 1px 2px rgba(0, 0, 0, 0.05)"};
        }

        :global(.fc-more-link:hover) {
          background-color: ${darkMode
            ? "rgba(75, 85, 99, 0.8)"
            : "rgba(229, 231, 235, 0.8)"};
          text-decoration: none;
          transform: translateY(-1px);
        }

        :global(.fc-daygrid-day.fc-day-other) {
          background-color: ${darkMode
            ? "rgba(17, 24, 39, 0.3)"
            : "rgba(249, 250, 251, 0.5)"};
        }

        :global(.fc-daygrid-day-events) {
          min-height: 2em;
          position: relative;
          z-index: 3;
        }

        :global(.fc-daygrid-block-event .fc-event-time),
        :global(.fc-daygrid-block-event .fc-event-title) {
          padding: 1px 2px;
          display: block;
        }

        :global(.fc-daygrid-dot-event) {
          display: flex !important;
          align-items: center;
          padding: 2px 0;
        }

        :global(.fc-daygrid-day.fc-day-other .fc-daygrid-day-number) {
          opacity: 0.7;
          color: ${darkMode
            ? "rgba(209, 213, 219, 0.8)"
            : "rgba(107, 114, 128, 0.8)"};
        }

        :global(.fc-view-harness) {
          background-color: ${darkMode ? "#111827" : "#ffffff"};
          border-radius: 12px;
          overflow: hidden;
          box-shadow: ${darkMode
            ? "inset 0 1px 3px rgba(0, 0, 0, 0.2)"
            : "inset 0 1px 3px rgba(0, 0, 0, 0.05)"};
        }

        /* Fix for month view events */
        :global(.fc-dayGridMonth-view .fc-daygrid-body) {
          width: 100% !important;
        }

        :global(.fc-dayGridMonth-view .fc-daygrid-day-frame) {
          min-height: 100px;
          height: 100%;
        }

        :global(.fc-dayGridMonth-view .fc-daygrid-day-events) {
          position: relative !important;
          min-height: 2em;
          margin-bottom: 1px;
        }

        :global(.fc-dayGridMonth-view .fc-daygrid-event-harness) {
          position: relative !important;
          margin-top: 1px;
        }

        :global(.fc-timegrid-now-indicator-line) {
          border-color: ${darkMode ? "#F43F5E" : "#E11D48"};
          border-width: 2px;
        }

        :global(.fc-timegrid-now-indicator-arrow) {
          border-color: ${darkMode ? "#F43F5E" : "#E11D48"};
          border-width: 5px;
        }
      `}</style>

      <PermissionGuard requiredPermission="calendar.view">
        <div className="mb-6 flex flex-col space-y-4">
          <div className="flex items-center justify-between bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="bg-indigo-600 dark:bg-indigo-500 p-2 rounded-lg shadow-md mr-3">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold">
                Calendar
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  Manage your schedule
                </span>
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1">
                <button
                  onClick={() => {
                    setCurrentView("dayGridMonth");
                    if (calendarRef.current) {
                      const api = calendarRef.current.getApi();
                      api.changeView("dayGridMonth");
                    }
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${currentView === "dayGridMonth" ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                >
                  Month
                </button>
                <button
                  onClick={() => {
                    setCurrentView("timeGridWeek");
                    if (calendarRef.current) {
                      const api = calendarRef.current.getApi();
                      api.changeView("timeGridWeek");
                    }
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${currentView === "timeGridWeek" ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                >
                  Week
                </button>
                <button
                  onClick={() => {
                    setCurrentView("timeGridDay");
                    if (calendarRef.current) {
                      const api = calendarRef.current.getApi();
                      api.changeView("timeGridDay");
                    }
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${currentView === "timeGridDay" ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                >
                  Day
                </button>
                <button
                  onClick={() => {
                    setCurrentView("listWeek");
                    if (calendarRef.current) {
                      const api = calendarRef.current.getApi();
                      api.changeView("listWeek");
                    }
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${currentView === "listWeek" ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                >
                  List
                </button>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg shadow-sm ${darkMode ? "bg-gray-800 text-indigo-400 hover:bg-gray-700" : "bg-gray-100 text-indigo-600 hover:bg-gray-200"} transition-all duration-200 hover:shadow`}
                title={
                  darkMode ? "Switch to light mode" : "Switch to dark mode"
                }
              >
                {darkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={handleGoogleSync}
                className={`p-2 rounded-lg shadow-sm ${isGoogleConnected ? "bg-green-600 text-white hover:bg-green-700" : "bg-blue-600 text-white hover:bg-blue-700"} transition-all duration-200 hover:shadow flex items-center gap-2`}
                title={
                  isGoogleConnected
                    ? "Disconnect Google Calendar"
                    : "Connect Google Calendar"
                }
              >
                {isGoogleConnected ? (
                  <>
                    <Link2Off className="h-5 w-5" />
                    <span className="text-sm">Disconnect</span>
                  </>
                ) : (
                  <>
                    <Link2 className="h-5 w-5" />
                    <span className="text-sm">Sync with Google</span>
                  </>
                )}
              </button>
              <PermissionGuard permissions={["calendar.create"]}>
                <button
                  onClick={() => {
                    setSelectedEvent(null);
                    const now = new Date();
                    const formattedDate = now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
                    const endTime = new Date(now.getTime() + 60 * 60 * 1000); // Add 1 hour
                    const formattedEndDate = endTime.toISOString().slice(0, 16);

                    setEventForm({
                      title: "",
                      description: "",
                      start: formattedDate,
                      end: formattedEndDate,
                      allDay: false,
                    });
                    setShowEventModal(true);
                  }}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg hover:translate-y-[-2px]"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Event
                </button>
              </PermissionGuard>
            </div>
          </div>

          {/* Dual Timezone Controls */}
          <div
            className={`flex items-center justify-between ${darkMode ? "bg-gray-800" : "bg-white"} p-3 rounded-lg shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-200"}`}
          >
            <div className="flex items-center">
              <div
                className={`${darkMode ? "bg-indigo-900/30" : "bg-indigo-100"} p-2 rounded-lg mr-3`}
              >
                <Globe
                  className={`h-5 w-5 ${darkMode ? "text-indigo-300" : "text-indigo-600"}`}
                />
              </div>
              <div>
                <h3 className="text-sm font-medium">Dual Timezone View</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Compare times across different timezones
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  value={secondTimezone}
                  onChange={(e) => {
                    setSecondTimezone(e.target.value);
                    if (e.target.value && !showSecondTimezone) {
                      setShowSecondTimezone(true);
                    }
                  }}
                  className={`block w-64 pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  disabled={!showSecondTimezone}
                >
                  <option value="">Select second timezone...</option>
                  {commonTimezones.map((tz) => (
                    <option
                      key={tz}
                      value={tz}
                      disabled={
                        tz === Intl.DateTimeFormat().resolvedOptions().timeZone
                      }
                    >
                      {tz === Intl.DateTimeFormat().resolvedOptions().timeZone
                        ? `${tz} (Local)`
                        : tz}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSecondTimezone}
                    onChange={(e) => {
                      setShowSecondTimezone(e.target.checked);
                      if (e.target.checked && !secondTimezone) {
                        // Set a default second timezone if none is selected
                        const localTz =
                          Intl.DateTimeFormat().resolvedOptions().timeZone;
                        const defaultSecondTz = localTz.includes("America")
                          ? "Europe/London"
                          : "America/New_York";
                        setSecondTimezone(defaultSecondTz);
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div
                    className={`relative w-11 h-6 ${darkMode ? "bg-gray-700" : "bg-gray-200"} peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer ${showSecondTimezone ? "peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white peer-checked:bg-indigo-600" : ""} after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600`}
                  ></div>
                  <span className="ms-3 text-sm font-medium">
                    {showSecondTimezone ? "On" : "Off"}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Timezone Difference Display */}
          {showSecondTimezone && secondTimezone && (
            <div
              className={`flex items-center justify-between ${darkMode ? "bg-gray-800/50" : "bg-gray-50"} p-3 rounded-lg border ${darkMode ? "border-gray-700" : "border-gray-200"}`}
            >
              <div className="flex items-center space-x-2">
                <div
                  className={`px-3 py-1.5 rounded-md ${darkMode ? "bg-gray-700" : "bg-white"} border ${darkMode ? "border-gray-600" : "border-gray-300"}`}
                >
                  <span className="text-xs font-medium">
                    Local: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                  </span>
                </div>
                <div className="text-sm">→</div>
                <div
                  className={`px-3 py-1.5 rounded-md ${darkMode ? "bg-indigo-900/30" : "bg-indigo-50"} border ${darkMode ? "border-indigo-800/30" : "border-indigo-100"}`}
                >
                  <span className="text-xs font-medium">{secondTimezone}</span>
                </div>
              </div>
              <div
                className={`px-3 py-1.5 rounded-md ${darkMode ? "bg-gray-700" : "bg-white"} border ${darkMode ? "border-gray-600" : "border-gray-300"}`}
              >
                <span className="text-xs font-medium">
                  {getTimezoneDifference(
                    secondTimezone,
                    Intl.DateTimeFormat().resolvedOptions().timeZone,
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}

        {error && !isLoading && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4"
            role="alert"
          >
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
            <button
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => fetchEvents()}
            >
              <span className="text-xl">&times;</span>
            </button>
          </div>
        )}

        {/* Calendar Container with Dual Timezone Support */}
        <div className="flex w-full gap-0 overflow-hidden relative">
          {/* Main Calendar */}
          <div
            className={`${showSecondTimezone ? "w-3/4" : "w-full"} ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-xl shadow-xl overflow-hidden border transition-colors duration-200 hover:shadow-2xl relative`}
          >
            {/* Calendar Header */}
            <div
              className={`p-4 ${darkMode ? "bg-gray-700" : "bg-gray-100"} border-b ${darkMode ? "border-gray-600" : "border-gray-300"} flex items-center justify-between`}
            >
              <div className="flex items-center space-x-3">
                <Calendar
                  className={`h-5 w-5 ${darkMode ? "text-blue-400" : "text-blue-500"}`}
                />
                <h2 className="text-lg font-semibold">Your Events</h2>
              </div>
              <div
                className={`text-sm px-3 py-1 rounded-full ${darkMode ? "bg-gray-800 text-gray-300" : "bg-gray-200 text-gray-700"}`}
              >
                Scheduled events and appointments
              </div>
            </div>

            <FullCalendar ref={calendarRef} {...calendarConfig} />
          </div>

          {/* Second Timezone Column */}
          {showSecondTimezone && secondTimezone && (
            <div
              className={`w-1/4 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-xl shadow-xl overflow-hidden border transition-colors duration-200 ml-4 flex flex-col relative`}
            >
              <div
                className={`p-3 ${darkMode ? "bg-gray-700" : "bg-gray-100"} border-b ${darkMode ? "border-gray-600" : "border-gray-300"} flex items-center justify-between`}
              >
                <div className="flex items-center">
                  <Globe
                    className={`h-4 w-4 mr-2 ${darkMode ? "text-indigo-300" : "text-indigo-600"}`}
                  />
                  <h3 className="text-sm font-medium truncate">
                    {secondTimezone}
                  </h3>
                </div>
                <div
                  className={`text-xs px-2 py-1 rounded ${darkMode ? "bg-indigo-900/30 text-indigo-300" : "bg-indigo-100 text-indigo-700"}`}
                >
                  {getTimezoneDifference(
                    secondTimezone,
                    Intl.DateTimeFormat().resolvedOptions().timeZone,
                  )}
                </div>
              </div>

              <div
                className="flex-1 overflow-y-auto"
                id="second-timezone-container"
              >
                {/* Time Ruler */}
                <div className="h-full relative">
                  {currentView.includes("timeGrid") && (
                    <>
                      {/* Current Time Indicator for Second Timezone */}
                      <CurrentTimeIndicator
                        darkMode={darkMode}
                        secondTimezone={secondTimezone}
                        localTimezone={
                          Intl.DateTimeFormat().resolvedOptions().timeZone
                        }
                      />

                      {/* Hour Markers */}
                      {Array.from({ length: 17 }).map((_, index) => {
                        const hour = index + 6; // Start from 6 AM
                        const localDate = new Date();
                        localDate.setHours(hour, 0, 0, 0);

                        // Convert to second timezone
                        const secondTzTime = getTimeInTimezone(
                          localDate,
                          secondTimezone,
                        );

                        return (
                          <div
                            key={hour}
                            className={`flex items-center h-12 px-3 ${darkMode ? "border-gray-700" : "border-gray-200"} ${hour % 2 === 0 ? (darkMode ? "bg-gray-800" : "bg-white") : darkMode ? "bg-gray-800/50" : "bg-gray-50"}`}
                            style={{
                              height: "48px",
                              borderBottom: `1px solid ${darkMode ? "rgba(55, 65, 81, 0.2)" : "rgba(229, 231, 235, 0.6)"}`,
                            }}
                            data-hour={hour}
                          >
                            <div className="w-full flex justify-between items-center">
                              <span
                                className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                              >
                                {secondTzTime}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {!currentView.includes("timeGrid") && (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                      <Globe
                        className={`h-12 w-12 mb-3 ${darkMode ? "text-gray-600" : "text-gray-400"}`}
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Time comparison is available in Week and Day views
                      </p>
                      <button
                        onClick={() => {
                          setCurrentView("timeGridWeek");
                          if (calendarRef.current) {
                            const api = calendarRef.current.getApi();
                            api.changeView("timeGridWeek");
                          }
                        }}
                        className="mt-4 px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-200"
                      >
                        Switch to Week View
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sync scroll between main calendar and second timezone */}
          {showSecondTimezone &&
            secondTimezone &&
            currentView.includes("timeGrid") && (
              <style jsx>{`
                :global(.fc-timegrid-body) {
                  overflow-y: auto;
                  scrollbar-width: thin;
                  position: relative;
                }

                :global(.fc-timegrid-body::-webkit-scrollbar) {
                  width: 6px;
                }

                :global(.fc-timegrid-body::-webkit-scrollbar-thumb) {
                  background-color: ${darkMode
                    ? "rgba(75, 85, 99, 0.5)"
                    : "rgba(209, 213, 219, 0.8)"};
                  border-radius: 3px;
                }

                /* Enhance the now indicator line */
                :global(.fc-timegrid-now-indicator-line) {
                  border-color: ${darkMode ? "#ef4444" : "#dc2626"} !important;
                  border-width: 2px !important;
                  z-index: 10;
                }

                :global(.fc-timegrid-now-indicator-arrow) {
                  border-color: ${darkMode ? "#ef4444" : "#dc2626"} !important;
                  border-width: 5px !important;
                }
              `}</style>
            )}
        </div>

        <AnimatePresence>
          {showEventModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md flex items-center justify-center z-50 p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowEventModal(false);
                }
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 500,
                  duration: 0.15,
                }}
                className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-xl p-6 w-full max-w-md shadow-2xl border transition-colors duration-200 max-h-[90vh] overflow-y-auto`}
              >
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-2xl font-bold flex items-center">
                    <CalendarIcon className="h-6 w-6 text-indigo-500 mr-2" />
                    {selectedEvent ? "Edit Event" : "New Event"}
                  </h2>
                  <button
                    onClick={() => setShowEventModal(false)}
                    className={`${darkMode ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"} transition-colors rounded-full p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600`}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1">
                    <label
                      className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1 flex items-center transition-colors duration-200`}
                    >
                      <Tag className="h-4 w-4 mr-2 text-indigo-500" />
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={eventForm.title}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, title: e.target.value })
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                      required
                      placeholder="Meeting with team"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1 flex items-center transition-colors duration-200`}
                    >
                      <AlertCircle className="h-4 w-4 mr-2 text-indigo-500" />
                      Description
                    </label>
                    <textarea
                      value={eventForm.description}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          description: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                      rows="3"
                      placeholder="Add details about this event"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label
                        className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1 flex items-center transition-colors duration-200`}
                      >
                        <Clock className="h-4 w-4 mr-2 text-indigo-500" />
                        Start <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={
                            eventForm.start ? eventForm.start.slice(0, 10) : ""
                          }
                          onChange={(e) => {
                            const newDate = e.target.value;
                            const oldTime = eventForm.start
                              ? eventForm.start.slice(11, 16)
                              : "09:00";
                            setEventForm({
                              ...eventForm,
                              start: `${newDate}T${oldTime}`,
                            });
                          }}
                          className={`w-1/2 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                          required
                        />
                        <input
                          type="time"
                          value={
                            eventForm.start
                              ? eventForm.start.slice(11, 16)
                              : "09:00"
                          }
                          onChange={(e) => {
                            const newTime = e.target.value;
                            const oldDate = eventForm.start
                              ? eventForm.start.slice(0, 10)
                              : "";
                            setEventForm({
                              ...eventForm,
                              start: `${oldDate}T${newTime}`,
                            });
                          }}
                          className={`w-1/2 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label
                        className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1 flex items-center transition-colors duration-200`}
                      >
                        <Clock className="h-4 w-4 mr-2 text-indigo-500" />
                        End <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={
                            eventForm.end ? eventForm.end.slice(0, 10) : ""
                          }
                          onChange={(e) => {
                            const newDate = e.target.value;
                            const oldTime = eventForm.end
                              ? eventForm.end.slice(11, 16)
                              : "10:00";
                            setEventForm({
                              ...eventForm,
                              end: `${newDate}T${oldTime}`,
                            });
                          }}
                          className={`w-1/2 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                          required
                          min={
                            eventForm.start
                              ? eventForm.start.slice(0, 10)
                              : undefined
                          }
                        />
                        <input
                          type="time"
                          value={
                            eventForm.end
                              ? eventForm.end.slice(11, 16)
                              : "10:00"
                          }
                          onChange={(e) => {
                            const newTime = e.target.value;
                            const oldDate = eventForm.end
                              ? eventForm.end.slice(0, 10)
                              : "";
                            setEventForm({
                              ...eventForm,
                              end: `${oldDate}T${newTime}`,
                            });
                          }}
                          className={`w-1/2 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`flex items-center p-3 rounded-lg border transition-colors duration-200 ${darkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"}`}
                    >
                      <input
                        type="checkbox"
                        id="allDay"
                        checked={eventForm.allDay}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            allDay: e.target.checked,
                          })
                        }
                        className={`h-5 w-5 focus:ring-indigo-500 border-gray-300 rounded transition-colors ${darkMode ? "text-indigo-500" : "text-indigo-600"}`}
                      />
                      <label
                        htmlFor="allDay"
                        className={`ml-3 block text-sm flex items-center cursor-pointer ${darkMode ? "text-gray-300" : "text-gray-700"} transition-colors duration-200`}
                      >
                        <CheckCircle2
                          className={`h-4 w-4 mr-2 ${eventForm.allDay ? "text-indigo-500" : "text-gray-400"}`}
                        />
                        All day event
                      </label>
                    </div>

                    <div className="space-y-1">
                      <label
                        className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1 flex items-center transition-colors duration-200`}
                      >
                        <Repeat className="h-4 w-4 mr-2 text-indigo-500" />
                        Repeat
                      </label>
                      <select
                        value={eventForm.recurrence}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            recurrence: e.target.value,
                          })
                        }
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                      >
                        <option value="none">No repeat</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>

                  {eventForm.recurrence !== "none" && (
                    <div className="pl-5 border-l-2 border-indigo-200 dark:border-indigo-800 space-y-1">
                      <label
                        className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1 flex items-center transition-colors duration-200`}
                      >
                        <Calendar className="h-4 w-4 mr-2 text-indigo-500" />
                        Repeat until <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={eventForm.recurrenceEndDate}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            recurrenceEndDate: e.target.value,
                          })
                        }
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                        min={new Date().toISOString().slice(0, 10)}
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label
                      className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1 flex items-center transition-colors duration-200`}
                    >
                      <Globe className="h-4 w-4 mr-2 text-indigo-500" />
                      Timezone
                    </label>
                    <select
                      value={eventForm.timezone}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, timezone: e.target.value })
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                    >
                      {commonTimezones.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz ===
                          Intl.DateTimeFormat().resolvedOptions().timeZone
                            ? `${tz} (Local)`
                            : tz}
                        </option>
                      ))}
                    </select>
                  </div>

                  {eventForm.timezone !==
                    Intl.DateTimeFormat().resolvedOptions().timeZone && (
                    <div
                      className={`p-4 rounded-lg ${darkMode ? "bg-gray-700/50" : "bg-gray-50"} border ${darkMode ? "border-gray-600" : "border-gray-200"}`}
                    >
                      <h4
                        className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Time conversion:
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span
                            className={`block ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                          >
                            Local time:
                          </span>
                          <span className="font-medium">
                            {formatInTimezone(
                              eventForm.start,
                              Intl.DateTimeFormat().resolvedOptions().timeZone,
                            )}
                          </span>
                        </div>
                        <div>
                          <span
                            className={`block ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                          >
                            Event timezone:
                          </span>
                          <span className="font-medium">
                            {formatInTimezone(
                              eventForm.start,
                              eventForm.timezone,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-4 mt-8 pt-5 border-t border-gray-200 dark:border-gray-700">
                    {selectedEvent && (
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="px-6 py-3 bg-red-500/90 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center transition-all duration-200 shadow-md hover:shadow-lg hover:translate-y-[-2px]"
                      >
                        <Trash2 size={18} className="mr-2" />
                        Delete
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center transition-all duration-200 shadow-md hover:shadow-lg hover:translate-y-[-2px]"
                    >
                      {selectedEvent ? (
                        <>
                          <Edit2 size={18} className="mr-2" />
                          Update
                        </>
                      ) : (
                        <>
                          <Plus size={18} className="mr-2" />
                          Create
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </PermissionGuard>
    </div>
  );
};

export default CalendarView;
