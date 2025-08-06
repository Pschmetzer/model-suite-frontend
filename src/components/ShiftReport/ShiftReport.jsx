// components/ShiftReport/ShiftReport.jsx
import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  Square,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { postDataAPI, getDataAPI } from "../../utils/fetchData";

const ShiftReport = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [timerState, setTimerState] = useState("idle"); // idle, running, paused, stopped
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeSession, setActiveSession] = useState(null);
  const [taskDescription, setTaskDescription] = useState("");
  const [reportData, setReportData] = useState({
    workSummary: "",
    tasksCompleted: [],
    challenges: "",
    tomorrowPriorities: "",
    productivityRating: 3,
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);

  // Timer effect - runs continuously when active
  useEffect(() => {
    let interval;
    if (timerState === "running") {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerState]);

  // Check for active sessions and today's report on mount
  useEffect(() => {
    checkActiveSession();
    checkTodayReport();
  }, []);

  const checkActiveSession = async () => {
    try {
      const response = await getDataAPI("/shift-report/active");
      if (response.data.sessions && response.data.sessions.length > 0) {
        const session = response.data.sessions[0];
        setActiveSession(session);
        setTaskDescription(session.taskDescription);
        setTimerState("running");

        // Calculate elapsed time from session start
        const startTime = new Date(session.startTime);
        const now = new Date();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);

        setMessage({
          text: "Resumed active session from where you left off",
          type: "success",
        });
      }
    } catch (error) {
      console.error("Error checking active session:", error);
    }
  };

  const checkTodayReport = async () => {
    try {
      const response = await getDataAPI("/shift-report/my-reports?limit=1");
      const today = new Date().toISOString().split("T")[0];

      if (response.data.reports && response.data.reports.length > 0) {
        const latestReport = response.data.reports[0];
        if (latestReport.date === today) {
          setHasSubmittedToday(true);
          setMessage({
            text: "You have already submitted your report for today",
            type: "success",
          });
        }
      }
    } catch (error) {
      console.error("Error checking today report:", error);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startTimer = async () => {
    if (!taskDescription.trim()) {
      setMessage({ text: "Please enter a task description", type: "error" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await postDataAPI("/shift-report/start", {
        taskDescription: taskDescription.trim(),
      });

      setActiveSession(response.data.session);
      setTimerState("running");
      setElapsedTime(0);
      setMessage({
        text: "Work session started! Timer is running.",
        type: "success",
      });
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Failed to start session";
      setMessage({ text: errorMsg, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const pauseTimer = () => {
    setTimerState("paused");
    setMessage({
      text: "Timer paused. You can resume anytime or close the browser.",
      type: "success",
    });
  };

  const resumeTimer = () => {
    setTimerState("running");
    setMessage({ text: "Timer resumed. Keep working!", type: "success" });
  };

  const stopTimer = async () => {
    if (!activeSession) {
      setMessage({ text: "No active session to stop", type: "error" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await postDataAPI("/shift-report/end", {
        sessionId: activeSession._id,
        taskDescription: taskDescription,
      });

      setTimerState("stopped");
      setIsExpanded(true);
      setActiveSession(response.data.session); // Store completed session

      setMessage({
        text: `Work session completed! Total time: ${(response.data.session.duration / 60).toFixed(1)} hours. Please fill your daily report.`,
        type: "success",
      });
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Failed to end session";
      setMessage({ text: errorMsg, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const submitReport = async () => {
    if (!reportData.workSummary.trim()) {
      setMessage({ text: "Please provide a work summary", type: "error" });
      return;
    }

    if (!activeSession?.duration) {
      setMessage({
        text: "Please complete a work session first",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    try {
      const submitData = {
        workSummary: reportData.workSummary.trim(),
        tasksCompleted: reportData.tasksCompleted,
        challenges: reportData.challenges.trim(),
        tomorrowPriorities: reportData.tomorrowPriorities.trim(),
        totalHours: parseFloat((activeSession.duration / 60).toFixed(2)), // Convert minutes to hours
        productivityRating: parseInt(reportData.productivityRating),
      };

      const response = await postDataAPI(
        "/shift-report/submit-report",
        submitData,
      );

      setMessage({
        text: "Daily report submitted successfully! See you tomorrow.",
        type: "success",
      });
      setHasSubmittedToday(true);

      // Reset everything after successful submission
      setTimeout(() => {
        setTimerState("idle");
        setElapsedTime(0);
        setActiveSession(null);
        setTaskDescription("");
        setReportData({
          workSummary: "",
          tasksCompleted: [],
          challenges: "",
          tomorrowPriorities: "",
          productivityRating: 3,
        });
        setIsExpanded(false);
      }, 3000);
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to submit report";
      setMessage({ text: errorMsg, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // If already submitted today, show completion message
  if (hasSubmittedToday && timerState === "idle") {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 text-center">
        <div className="mb-4">
          <Clock className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            All Done for Today! 🎉
          </h3>
          <p className="text-gray-600">
            You have successfully submitted your daily report.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Come back tomorrow to track your next work session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center px-5 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5" />
          <h3 className="font-semibold text-lg">Daily Work Tracker</h3>
        </div>
        {(timerState === "stopped" || isExpanded) && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-white/10 transition-colors duration-200"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Timer Display */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
          <div className="flex flex-col">
            <div className="text-3xl font-bold text-gray-800 font-mono leading-none">
              {formatTime(elapsedTime)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {timerState === "idle" && "Ready to start your work session"}
              {timerState === "running" &&
                "🟢 Working... Session is being tracked"}
              {timerState === "paused" &&
                "⏸️ Paused (session continues on server)"}
              {timerState === "stopped" &&
                "✅ Session completed - Fill your daily report"}
            </div>
            {activeSession && timerState !== "idle" && (
              <div className="text-xs text-gray-400 mt-1">
                Started:{" "}
                {new Date(activeSession.startTime).toLocaleTimeString()}
                {activeSession.duration &&
                  ` • Duration: ${(activeSession.duration / 60).toFixed(1)}h`}
              </div>
            )}
          </div>
          <div className="text-sm font-semibold text-right">
            <span
              className={`px-3 py-1 rounded-full text-xs ${
                timerState === "running"
                  ? "bg-green-100 text-green-700"
                  : timerState === "paused"
                    ? "bg-yellow-100 text-yellow-700"
                    : timerState === "stopped"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
              }`}
            >
              {timerState === "idle"
                ? "Not Started"
                : timerState === "running"
                  ? "Working"
                  : timerState === "paused"
                    ? "On Break"
                    : "Report Due"}
            </span>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`px-4 py-3 rounded-md text-sm mb-4 ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Task Description Input - Only when starting */}
        {timerState === "idle" && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What will you work on today?
            </label>
            <input
              type="text"
              placeholder="e.g., Frontend development, Client calls, Bug fixes..."
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm transition-colors focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-black placeholder-gray-400"
              maxLength="200"
            />
          </div>
        )}

        {/* Timer Controls */}
        <div className="mb-4">
          <div className="flex gap-3 flex-wrap">
            {timerState === "idle" && (
              <button
                onClick={startTimer}
                disabled={
                  isLoading || !taskDescription.trim() || hasSubmittedToday
                }
                className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg text-sm font-medium transition-all hover:bg-green-600 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex-1 justify-center"
              >
                <Play className="w-5 h-5" />
                {isLoading ? "Starting..." : "Start Work Session"}
              </button>
            )}

            {timerState === "running" && (
              <>
                <button
                  onClick={pauseTimer}
                  className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg text-sm font-medium transition-all hover:bg-orange-600 hover:scale-105 flex-1 justify-center"
                >
                  <Pause className="w-5 h-5" />
                  Take Break
                </button>
                <button
                  onClick={stopTimer}
                  disabled={isLoading || elapsedTime < 60} // Minimum 1 minute
                  className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg text-sm font-medium transition-all hover:bg-red-600 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex-1 justify-center"
                  title={
                    elapsedTime < 60
                      ? "Work for at least 1 minute before ending"
                      : "End work session"
                  }
                >
                  <Square className="w-5 h-5" />
                  {isLoading ? "Ending..." : "End Session"}
                </button>
              </>
            )}

            {timerState === "paused" && (
              <>
                <button
                  onClick={resumeTimer}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg text-sm font-medium transition-all hover:bg-blue-600 hover:scale-105 flex-1 justify-center"
                >
                  <Play className="w-5 h-5" />
                  Resume Work
                </button>
                <button
                  onClick={stopTimer}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg text-sm font-medium transition-all hover:bg-red-600 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex-1 justify-center"
                >
                  <Square className="w-5 h-5" />
                  {isLoading ? "Ending..." : "End Session"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Daily Report Form - Only show when session is stopped */}
        {timerState === "stopped" && (
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h4 className="flex items-center gap-2 mb-6 text-gray-800 text-lg font-semibold">
              <FileText className="w-5 h-5" />
              Daily Work Report
            </h4>

            <div className="space-y-6">
              {/* Session Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-700 mb-2">
                  Session Summary
                </h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Task:</span>
                    <p className="font-medium">{taskDescription}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Time Worked:</span>
                    <p className="font-medium text-green-600">
                      {activeSession?.duration
                        ? `${(activeSession.duration / 60).toFixed(1)} hours`
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Work Summary */}
              <div>
                <label className="block font-semibold text-gray-600 mb-2 text-sm">
                  What did you accomplish today? *
                </label>
                <textarea
                  rows="4"
                  maxLength="1000"
                  value={reportData.workSummary}
                  onChange={(e) =>
                    setReportData({
                      ...reportData,
                      workSummary: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm transition-colors focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-black placeholder-gray-400"
                  placeholder="Describe your achievements, completed tasks, progress made..."
                />
                <div className="text-xs text-gray-500 mt-1">
                  {reportData.workSummary.length}/1000 characters
                </div>
              </div>

              {/* Challenges */}
              <div>
                <label className="block font-semibold text-gray-600 mb-2 text-sm">
                  Any roadblocks or challenges faced?
                </label>
                <textarea
                  rows="3"
                  maxLength="500"
                  value={reportData.challenges}
                  onChange={(e) =>
                    setReportData({ ...reportData, challenges: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm transition-colors focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-black placeholder-gray-400"
                  placeholder="Technical issues, blockers, missing resources..."
                />
              </div>

              {/* Tomorrow's Priorities */}
              <div>
                <label className="block font-semibold text-gray-600 mb-2 text-sm">
                  Tomorrow's priorities
                </label>
                <textarea
                  rows="3"
                  maxLength="500"
                  value={reportData.tomorrowPriorities}
                  onChange={(e) =>
                    setReportData({
                      ...reportData,
                      tomorrowPriorities: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm transition-colors focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-black placeholder-gray-400"
                  placeholder="What will you focus on tomorrow?"
                />
              </div>

              {/* Productivity Rating */}
              <div>
                <label className="block font-semibold text-gray-600 mb-2 text-sm">
                  How productive were you today? *
                </label>
                <select
                  value={reportData.productivityRating}
                  onChange={(e) =>
                    setReportData({
                      ...reportData,
                      productivityRating: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm transition-colors focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-black"
                >
                  <option value={1}>1 - Very Low (Many distractions)</option>
                  <option value={2}>2 - Low (Some challenges)</option>
                  <option value={3}>3 - Average (Normal pace)</option>
                  <option value={4}>4 - High (Great focus)</option>
                  <option value={5}>5 - Excellent (Peak performance)</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={submitReport}
                  disabled={isLoading || !reportData.workSummary.trim()}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-sm font-medium transition-all hover:scale-105 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? "Submitting Report..." : "Submit Daily Report"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftReport;
