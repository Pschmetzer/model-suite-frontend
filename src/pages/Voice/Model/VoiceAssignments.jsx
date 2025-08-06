import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Play,
  CheckCircle,
  AlertCircle,
  Calendar,
  FileText,
  User,
  Zap,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { voiceAPI } from "../../../services/voiceAPI";
import VoiceErrorBoundary, {
  LoadingSpinner,
  ErrorAlert,
} from "../../../components/voice/VoiceErrorBoundary";

const VoiceAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignmentFilter, setAssignmentFilter] = useState("pending");

  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await voiceAPI.getMyAssignments();

      console.log("🔍 Full response in component:", response);
      console.log("🔍 Response.data:", response.data);
      console.log("🔍 Response.data.data:", response.data.data);

      // Handle the nested data structure from ApiResponse
      const responseData = response.data.data || response.data;
      const assignments = responseData.assignments || [];

      console.log("🔍 Extracted assignments:", assignments);
      console.log(
        "🔍 Assignment statuses:",
        assignments.map((a) => ({
          id: a._id,
          title: a.title,
          status: a.status,
        })),
      );

      setAssignments(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      setError(error);
      toast.error("Failed to fetch voice assignments");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "submitted":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_progress":
      case "recorded":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "assigned":
      case "pending":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "submitted":
        return <CheckCircle className="w-4 h-4" />;
      case "in_progress":
      case "recorded":
        return <Play className="w-4 h-4" />;
      case "assigned":
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4" />;
      case "overdue":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateProgress = (assignment) => {
    if (!assignment.questionIds || assignment.questionIds.length === 0) {
      return 0;
    }
    const totalQuestions = assignment.questionIds.length;
    const recordedQuestions = assignment.recordings?.length || 0;
    return Math.round((recordedQuestions / totalQuestions) * 100);
  };

  // const handleStartRecording = (assignment) => {
  //   navigate(`/model/voice/record/${assignment._id}`);
  // };

  // Calculate assignment type stats - for question assignments, we'll show "Questions" instead of script types
  const assignmentStats = assignments.reduce((acc, assignment) => {
    // All assignments are question-based now
    acc.questions = (acc.questions || 0) + 1;
    return acc;
  }, {});

  // Filter assignments with clearer logic: Pending → Active → Completed
  const filteredAssignments = assignments.filter((assignment) => {
    if (assignmentFilter === "pending")
      return ["assigned", "pending"].includes(assignment.status);
    if (assignmentFilter === "active")
      return ["in_progress", "recorded"].includes(assignment.status);
    if (assignmentFilter === "completed")
      return ["submitted", "approved", "completed"].includes(assignment.status);
    return true;
  });

  console.log(`🔍 Filtering with "${assignmentFilter}":`, {
    totalAssignments: assignments.length,
    filteredCount: filteredAssignments.length,
    statuses: assignments.map((a) => a.status),
    filteredStatuses: filteredAssignments.map((a) => a.status),
  });

  if (loading) {
    return (
      <LoadingSpinner size="lg" text="Loading your voice assignments..." />
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorAlert
          error={error}
          onRetry={fetchAssignments}
          title="Failed to load assignments"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Voice Assignments</h2>
          <p className="text-gray-400 mt-1">
            Complete your assigned voice recording assignments
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Assignments"
          value={assignments.length}
          color="blue"
          icon={<FileText className="w-5 h-5" />}
        />
        <StatCard
          title="Completed"
          value={
            assignments.filter((a) =>
              ["submitted", "approved", "completed"].includes(a.status),
            ).length
          }
          color="green"
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <StatCard
          title="Active"
          value={
            assignments.filter((a) =>
              ["in_progress", "recorded"].includes(a.status),
            ).length
          }
          color="yellow"
          icon={<Clock className="w-5 h-5" />}
        />
        <StatCard
          title="Pending"
          value={
            assignments.filter((a) =>
              ["assigned", "pending"].includes(a.status),
            ).length
          }
          color="red"
          icon={<AlertCircle className="w-5 h-5" />}
        />
      </div>

      {/* Assignment Status Filter */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Assignment Status
          </h3>
          <div className="text-sm text-gray-400">
            Total: {assignments.length} assignments
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setAssignmentFilter("pending")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              assignmentFilter === "pending"
                ? "bg-orange-600 text-white shadow-md"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            <Clock className="w-4 h-4" />
            Pending
            <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
              {
                assignments.filter((a) =>
                  ["assigned", "pending"].includes(a.status),
                ).length
              }
            </span>
          </button>

          <button
            onClick={() => setAssignmentFilter("active")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              assignmentFilter === "active"
                ? "bg-green-600 text-white shadow-md"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            <Zap className="w-4 h-4" />
            Active
            <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
              {
                assignments.filter((a) =>
                  ["in_progress", "recorded"].includes(a.status),
                ).length
              }
            </span>
          </button>

          <button
            onClick={() => setAssignmentFilter("completed")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              assignmentFilter === "completed"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Completed
            <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
              {
                assignments.filter((a) =>
                  ["submitted", "approved", "completed"].includes(a.status),
                ).length
              }
            </span>
          </button>
        </div>
      </div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          {assignmentFilter === "pending" ? (
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          ) : assignmentFilter === "active" ? (
            <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          ) : assignmentFilter === "completed" ? (
            <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          ) : (
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          )}
          <h3 className="text-lg font-medium text-white mb-2">
            {assignmentFilter === "pending"
              ? "No Pending Assignments"
              : assignmentFilter === "active"
                ? "No Active Assignments"
                : assignmentFilter === "completed"
                  ? "No Completed Assignments"
                  : "No Active Assignments"}
          </h3>
          <p className="text-gray-400">
            {assignmentFilter === "pending"
              ? "No pending assignments available at the moment."
              : assignmentFilter === "active"
                ? "No active assignments in progress at the moment."
                : assignmentFilter === "completed"
                  ? "No completed assignments available at the moment."
                  : "All your active assignments are listed below. Use the filters above to view pending or completed assignments."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredAssignments.map((assignment) => (
            <QuestionRecordingInterface
              key={assignment._id}
              assignment={assignment}
              navigate={navigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Enhanced Assignment Card Component
const AssignmentCard = ({ assignment, progress, onStartRecording }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "submitted":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_progress":
      case "recorded":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "assigned":
      case "pending":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "submitted":
        return <CheckCircle className="w-4 h-4" />;
      case "in_progress":
      case "recorded":
        return <Play className="w-4 h-4" />;
      case "assigned":
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4" />;
      case "overdue":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getAssignmentTypeInfo = (assignment) => {
    // For question assignments, we'll categorize based on number of questions
    const questionCount = assignment.questionIds?.length || 0;
    if (questionCount <= 3) {
      return {
        label: "Quick Assignment",
        icon: <Zap className="w-3 h-3" />,
        color: "bg-green-100 text-green-700 border-green-200",
        borderColor: "border-l-green-500",
      };
    } else {
      return {
        label: "Standard Assignment",
        icon: <FileText className="w-3 h-3" />,
        color: "bg-purple-100 text-purple-700 border-purple-200",
        borderColor: "border-l-purple-500",
      };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const assignmentType = getAssignmentTypeInfo(assignment);

  // Check if assignment is completed (submitted, approved, or rejected)
  const isCompleted = ["submitted", "approved", "completed"].includes(
    assignment.status,
  );
  const canRecord = [
    "assigned",
    "in_progress",
    "recorded",
    "rejected",
  ].includes(assignment.status);

  // Get assignment title - use first question text or fallback
  const assignmentTitle =
    assignment.questionIds && assignment.questionIds.length > 0
      ? `Voice Questions (${assignment.questionIds.length} questions)`
      : "Voice Assignment";

  // Get assignment description - combine section titles
  const sectionTitles =
    assignment.questionIds
      ?.map((q) => q.sectionId?.title)
      .filter(Boolean)
      .filter((title, index, arr) => arr.indexOf(title) === index) // Remove duplicates
      .join(", ") || "Voice recording assignment";

  return (
    <div
      className={`bg-white rounded-lg border-l-4 ${assignmentType.borderColor} shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-2">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {assignmentTitle}
              </h3>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${assignmentType.color}`}
              >
                {assignmentType.icon}
                {assignmentType.label}
              </span>
            </div>
            <p className="text-sm text-gray-600">{sectionTitles}</p>

            {/* Tags Display */}
            {assignment.questionIds &&
              assignment.questionIds.some(
                (q) => q.tags && q.tags.length > 0,
              ) && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {Array.from(
                    new Set(
                      assignment.questionIds
                        .filter((q) => q.tags && q.tags.length > 0)
                        .flatMap((q) => q.tags),
                    ),
                  ).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-200 capitalize"
                    >
                      {tag.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
              assignment.status,
            )}`}
          >
            {getStatusIcon(assignment.status)}
            <span className="ml-1 capitalize">
              {assignment.status.replace("_", " ")}
            </span>
          </span>
        </div>

        {/* Assignment Type Specific Info */}
        <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
          <FileText className="w-3 h-3" />
          {assignment.questionIds?.length || 0} questions to record
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm font-medium text-gray-900">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                isCompleted ? "bg-green-600" : "bg-blue-600"
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {assignment.recordings?.length || 0} of{" "}
            {assignment.questionIds?.length || 1} recordings completed
          </p>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Due: {formatDate(assignment.deadline)}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <User className="w-4 h-4 mr-2" />
            <span>By: {assignment.agencyId?.agencyName || "Agency"}</span>
          </div>
        </div>

        {/* Instructions */}
        {assignment.instructions && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Instructions:</strong> {assignment.instructions}
            </p>
          </div>
        )}

        {/* Submission Confirmation */}
        {isCompleted && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <p className="text-sm text-blue-700">
                <strong>Recording Submitted:</strong> Your recording has been
                submitted for review by the agency.
                {assignment.submittedAt && (
                  <span className="block text-xs text-blue-600 mt-1">
                    Submitted on {formatDate(assignment.submittedAt)}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {canRecord ? (
            <button
              onClick={onStartRecording}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Play className="w-4 h-4 mr-2" />
              {assignment.status === "rejected"
                ? "Re-record"
                : assignment.status === "in_progress" ||
                    assignment.status === "recorded"
                  ? "Continue Recording"
                  : "Start Recording"}
            </button>
          ) : (
            <button
              disabled
              className="flex-1 bg-gray-300 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed flex items-center justify-center"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {assignment.status === "submitted" ? "Submitted" : "Completed"}
            </button>
          )}

          {isCompleted && (
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              View Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Question Recording Interface Component
const QuestionRecordingInterface = ({ assignment, navigate }) => {
  const [questionStatuses, setQuestionStatuses] = useState({});
  const [recordings, setRecordings] = useState({});
  const [mediaRecorders, setMediaRecorders] = useState({});
  const [audioStreams, setAudioStreams] = useState({});
  const [recordingTimers, setRecordingTimers] = useState({});
  const [recordingDurations, setRecordingDurations] = useState({});
  const [playingAudio, setPlayingAudio] = useState(null);

  // New single MediaRecorder state
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioStream, setAudioStream] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Tag filtering state
  const [selectedTagFilter, setSelectedTagFilter] = useState("all");

  const questions = useMemo(
    () => assignment.questionIds || [],
    [assignment.questionIds],
  );
  const assignmentTitle = assignment.title || "Voice Recording Assignment";

  // Get available tags from questions
  const availableTags = useMemo(() => {
    const tagSet = new Set();
    questions.forEach((question) => {
      if (question.tags && question.tags.length > 0) {
        question.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [questions]);

  // Filter and sort questions based on selected tag
  const filteredAndSortedQuestions = useMemo(() => {
    if (selectedTagFilter === "all") {
      return questions;
    }

    const filtered = questions.filter(
      (question) => question.tags && question.tags.includes(selectedTagFilter),
    );
    const unfiltered = questions.filter(
      (question) =>
        !question.tags || !question.tags.includes(selectedTagFilter),
    );

    // Return filtered questions first, then unfiltered
    return [...filtered, ...unfiltered];
  }, [questions, selectedTagFilter]);

  // For completed assignments, show all questions as recorded
  const progress = ["submitted", "approved", "completed"].includes(
    assignment.status,
  )
    ? questions.length
    : Object.keys(questionStatuses).filter(
        (id) => questionStatuses[id] === "finished",
      ).length;

  // Question status handler
  const handleQuestionStatusChange = (questionId, status) => {
    setQuestionStatuses((prev) => ({
      ...prev,
      [questionId]: status,
    }));
  };

  // Cleanup function
  useEffect(() => {
    return () => {
      // Clean up all streams and timers
      Object.values(audioStreams).forEach((stream) => {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
      });
      Object.values(recordingTimers).forEach((timer) => {
        if (timer) clearInterval(timer);
      });
    };
  }, [audioStreams, recordingTimers]);

  // Cleanup MediaRecorder and audio stream
  useEffect(() => {
    return () => {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mediaRecorder, audioStream]);

  // Initialize question statuses based on existing recordings
  useEffect(() => {
    const initializeQuestionStatuses = async () => {
      try {
        const response = await voiceAPI.getAssignmentRecordings(assignment._id);
        const existingRecordings = response.data.data?.recordings || [];

        // Initialize all questions as not-started first
        const initialStatuses = {};
        questions.forEach((question) => {
          initialStatuses[question._id] = "not-started";
        });

        // Update status for questions that have recordings
        existingRecordings.forEach((recording) => {
          if (recording.questionId && recording.questionId._id) {
            initialStatuses[recording.questionId._id] = "submitted";
          }
        });

        setQuestionStatuses(initialStatuses);
      } catch (error) {
        console.error("Failed to load existing recordings:", error);
        // Fallback: initialize all as not-started
        const fallbackStatuses = {};
        questions.forEach((question) => {
          fallbackStatuses[question._id] = "not-started";
        });
        setQuestionStatuses(fallbackStatuses);
      }
    };

    if (assignment._id && questions.length > 0) {
      initializeQuestionStatuses();
    }
  }, [assignment._id, assignment.questionIds]);

  const startRecording = async (questionId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        setRecordings((prev) => ({
          ...prev,
          [questionId]: blob,
        }));

        // Stop and cleanup
        if (audioStreams[questionId]) {
          audioStreams[questionId].getTracks().forEach((track) => track.stop());
        }
        if (recordingTimers[questionId]) {
          clearInterval(recordingTimers[questionId]);
        }
      };

      mediaRecorder.start();

      // Update states
      setMediaRecorders((prev) => ({ ...prev, [questionId]: mediaRecorder }));
      setAudioStreams((prev) => ({ ...prev, [questionId]: stream }));
      setQuestionStatuses((prev) => ({ ...prev, [questionId]: "recording" }));
      setRecordingDurations((prev) => ({ ...prev, [questionId]: 0 }));

      // Start timer
      const timer = setInterval(() => {
        setRecordingDurations((prev) => ({
          ...prev,
          [questionId]: (prev[questionId] || 0) + 1,
        }));
      }, 1000);

      setRecordingTimers((prev) => ({ ...prev, [questionId]: timer }));
    } catch (error) {
      console.error("Failed to access microphone:", error);
      toast.error("Failed to access microphone. Please check permissions.");
    }
  };

  const stopRecording = (questionId) => {
    const mediaRecorder = mediaRecorders[questionId];
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setQuestionStatuses((prev) => ({ ...prev, [questionId]: "finished" }));
    }
  };

  const playRecording = (questionId) => {
    const recording = recordings[questionId];
    if (recording) {
      // Stop any currently playing audio
      if (playingAudio) {
        playingAudio.pause();
        playingAudio.currentTime = 0;
      }

      const audio = new Audio(URL.createObjectURL(recording));
      audio.play();
      setPlayingAudio(audio);

      audio.onended = () => {
        setPlayingAudio(null);
        URL.revokeObjectURL(audio.src);
      };
    }
  };

  const uploadRecording = async (questionId) => {
    const recording = recordings[questionId];
    const question = questions.find((q) => q._id === questionId);

    if (!recording || !question) {
      toast.error("No recording found for this question");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("audio", recording, `question_${questionId}.wav`);
      formData.append("questionId", questionId);
      formData.append("duration", recordingDurations[questionId] || 0);
      formData.append("questionText", question.text);

      const response = await voiceAPI.uploadRecording(
        assignment._id,
        questionId,
        formData,
      );

      toast.success("Recording uploaded successfully!");

      // Update question status to submitted
      setQuestionStatuses((prev) => ({ ...prev, [questionId]: "submitted" }));
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload recording. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const retakeRecording = (questionId) => {
    // Clear the recording for this question
    setRecordings((prev) => {
      const newRecordings = { ...prev };
      delete newRecordings[questionId];
      return newRecordings;
    });

    setQuestionStatuses((prev) => ({ ...prev, [questionId]: "not-started" }));
    setRecordingDurations((prev) => ({ ...prev, [questionId]: 0 }));
    toast.info("Recording cleared. You can now record again.");
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSaveProgress = async (notes = "") => {
    try {
      await voiceAPI.saveAssignmentProgress(assignment._id, {
        modelNotes: notes,
      });
      toast.success("Progress saved successfully!");

      // Refresh assignments to show updated status (e.g., assigned -> in_progress)
      await fetchAssignments();
    } catch (error) {
      console.error("Error saving progress:", error);
      toast.error("Failed to save progress. Please try again.");
    }
  };

  const handleSaveProgressQuick = () => {
    // Save progress without asking for notes
    handleSaveProgress("");
  };

  const handleCompleteAssignment = async () => {
    try {
      // Check if there are any recordings that haven't been submitted
      const pendingQuestions = questions.filter(
        (q) => questionStatuses[q._id] === "finished" && recordings[q._id],
      );

      if (pendingQuestions.length > 0) {
        const shouldSubmitPending = window.confirm(
          `You have ${pendingQuestions.length} recorded question(s) that haven't been submitted yet. Do you want to submit them before completing the assignment?`,
        );

        if (shouldSubmitPending) {
          // Submit all pending recordings
          for (const question of pendingQuestions) {
            const recording = recordings[question._id];
            const formData = new FormData();
            formData.append(
              "audio",
              recording,
              `question_${question._id}.webm`,
            );
            await voiceAPI.uploadRecording(
              assignment._id,
              question._id,
              formData,
            );
            setQuestionStatuses((prev) => ({
              ...prev,
              [question._id]: "submitted",
            }));
          }
          toast.success("All recordings submitted!");
        }
      }

      // Check if we have any submitted recordings
      const submittedCount = Object.values(questionStatuses).filter(
        (status) => status === "submitted",
      ).length;

      if (submittedCount === 0) {
        toast.error(
          "Please submit at least one recording before completing the assignment.",
        );
        return;
      }

      // Submit the assignment
      await voiceAPI.submitAssignment(assignment._id);
      toast.success(
        "Assignment completed successfully! Check the 'Completed' tab to see your finished assignments.",
      );

      // Refresh assignments to show updated status
      await fetchAssignments();

      // Switch to completed tab to show the user their completed assignment
      setAssignmentFilter("completed");

      // Navigate back to dashboard after showing the completion
      setTimeout(() => {
        navigate("/model/dashboard");
      }, 3000);
    } catch (error) {
      console.error("Error completing assignment:", error);
      toast.error("Failed to complete assignment. Please try again.");
    }
  };

  const handleRecordingAction = async (questionId, action) => {
    console.log(`Recording action: ${action} for question ${questionId}`);

    if (action === "record") {
      try {
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setAudioStream(stream);

        // Create MediaRecorder
        const recorder = new MediaRecorder(stream, {
          mimeType: "audio/webm;codecs=opus",
        });

        const chunks = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: "audio/webm" });
          setRecordings((prev) => ({
            ...prev,
            [questionId]: blob,
          }));
          console.log(`Recording saved for question ${questionId}`);
        };

        recorder.start();
        setMediaRecorder(recorder);
        console.log("Recording started");
        toast.success("Recording started!");
      } catch (error) {
        console.error("Error starting recording:", error);
        toast.error("Could not access microphone. Please check permissions.");
        // Reset status on error
        handleQuestionStatusChange(questionId, "not-started");
      }
    } else if (action === "stop") {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        setMediaRecorder(null);

        // Stop all tracks to release microphone
        if (audioStream) {
          audioStream.getTracks().forEach((track) => track.stop());
          setAudioStream(null);
        }
        console.log("Recording stopped");
        toast.success("Recording stopped!");
      }
    } else if (action === "preview") {
      const recording = recordings[questionId];
      if (recording) {
        const audioUrl = URL.createObjectURL(recording);
        const audio = new Audio(audioUrl);
        audio.play();
        console.log("Playing preview");
      }
    } else if (action === "play") {
      // Play submitted recording from server
      try {
        console.log(
          `🎵 Fetching submitted recording for question ${questionId}`,
        );

        // First get all recordings for this assignment
        const response = await voiceAPI.getAssignmentRecordings(assignment._id);
        console.log(`🔍 Assignment recordings response:`, response);

        // Try multiple data extraction paths
        const recordings = response.data?.data || response.data || [];
        console.log(`🔍 Found ${recordings.length} recordings:`, recordings);

        // Find the recording for this specific question
        const questionRecording = recordings.find((recording) => {
          const recordingQuestionId =
            recording.questionId?._id || recording.questionId;
          console.log(
            `🔍 Comparing question IDs: ${recordingQuestionId} === ${questionId}`,
          );
          return (
            recordingQuestionId === questionId ||
            recordingQuestionId?.toString() === questionId?.toString()
          );
        });

        console.log(`🔍 Found question recording:`, questionRecording);

        if (questionRecording) {
          console.log(`📥 Downloading recording ${questionRecording._id}`);

          // Use the download endpoint to get a signed URL
          const downloadResponse = await voiceAPI.downloadRecording(
            questionRecording._id,
          );
          console.log(`📥 Download response:`, downloadResponse);

          // Extract the download URL from the response
          const downloadUrl =
            downloadResponse.data?.data?.downloadUrl ||
            downloadResponse.data?.downloadUrl;
          console.log(`📥 Download URL:`, downloadUrl);

          if (!downloadUrl) {
            throw new Error("No download URL received from server");
          }

          // Use the signed URL directly for audio playback
          const audio = new Audio(downloadUrl);

          // Set additional properties for better compatibility
          audio.preload = "metadata";
          audio.controls = false;
          audio.crossOrigin = "anonymous"; // For signed URLs

          audio.play();
          console.log("🎵 Playing submitted recording");
          toast.success("Playing recording...");

          // Add event listeners
          audio.onended = () => {
            console.log("🎵 Playback ended");
          };
          audio.onerror = (error) => {
            console.error("🎵 Audio playback error:", error);
            console.error("🎵 Audio error details:", audio.error);
            toast.error("Error playing recording");
          };
          audio.onloadstart = () => {
            console.log("🎵 Audio loading started");
          };
          audio.oncanplay = () => {
            console.log("🎵 Audio can start playing");
          };
        } else {
          console.error(`❌ Recording not found for question ${questionId}`);
          console.log(
            `🔍 Available recordings:`,
            recordings.map((r) => ({
              id: r._id,
              questionId: r.questionId?._id || r.questionId,
            })),
          );
          toast.error("Recording not found for this question");
        }
      } catch (error) {
        console.error("❌ Error playing recording:", error);
        console.error(
          "❌ Error details:",
          error.response?.data || error.message,
        );
        toast.error(`Could not play recording: ${error.message}`);
      }
    } else if (action === "submit") {
      const recording = recordings[questionId];
      if (recording && assignment) {
        try {
          setIsUploading(true);
          const formData = new FormData();
          formData.append("audio", recording, `question_${questionId}.webm`);

          await voiceAPI.uploadRecording(assignment._id, questionId, formData);

          // Mark as submitted
          handleQuestionStatusChange(questionId, "submitted");

          // Remove from local recordings
          setRecordings((prev) => {
            const newRecordings = { ...prev };
            delete newRecordings[questionId];
            return newRecordings;
          });

          console.log("Recording submitted successfully");
          toast.success("Recording submitted successfully!");
        } catch (error) {
          console.error("Error submitting recording:", error);
          toast.error("Failed to submit recording. Please try again.");
        } finally {
          setIsUploading(false);
        }
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "finished":
        return "text-green-400 bg-green-900";
      case "recording":
        return "text-red-400 bg-red-900";
      case "submitted":
        return "text-blue-400 bg-blue-900";
      case "not-started":
      default:
        return "text-gray-400 bg-gray-700";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "finished":
        return "Recorded";
      case "recording":
        return "Recording";
      case "submitted":
        return "Recorded"; // Show "Recorded" instead of "Submitted" for better UX
      case "not-started":
      default:
        return "Not started";
    }
  };

  const getTagColor = (tag) => {
    const colors = {
      good_morning: "bg-yellow-900 text-yellow-300",
      good_night: "bg-purple-900 text-purple-300",
      flirty: "bg-pink-900 text-pink-300",
      sensual: "bg-red-900 text-red-300",
      affectionate: "bg-rose-900 text-rose-300",
      non_sexual: "bg-green-900 text-green-300",
      conversation_starter: "bg-blue-900 text-blue-300",
      mixed_tone: "bg-gray-700 text-gray-300",
      romantic: "bg-pink-900 text-pink-300",
      playful: "bg-orange-900 text-orange-300",
      intimate: "bg-red-900 text-red-300",
      casual: "bg-gray-700 text-gray-300",
      sweet: "bg-pink-900 text-pink-300",
      naughty: "bg-red-900 text-red-300",
      teasing: "bg-orange-900 text-orange-300",
      caring: "bg-green-900 text-green-300",
      loving: "bg-rose-900 text-rose-300",
      sleepy: "bg-indigo-900 text-indigo-300",
      energetic: "bg-yellow-900 text-yellow-300",
      soft_spoken: "bg-blue-900 text-blue-300",
    };
    return colors[tag] || "bg-gray-700 text-gray-300";
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {assignmentTitle}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              A set of {questions.length} voice recording questions.
            </p>
          </div>
          <button
            className="text-gray-400 hover:text-gray-300"
            onClick={() => navigate("/model/dashboard")}
          >
            ✕
          </button>
        </div>

        {/* Progress Bar and Tag Filter */}
        <div className="mt-4">
          {/* Progress Bar and Filter - Side by Side */}
          <div className="flex items-center gap-6 mb-4">
            {/* Progress Bar - Half Width */}
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                <span>Progress</span>
                <span>
                  {progress} of {questions.length} questions recorded
                </span>
              </div>
              <div className="bg-gray-700 rounded-full h-1">
                <div
                  className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      questions.length > 0
                        ? (progress / questions.length) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Tag Filter Dropdown - Beside Progress Bar */}
            {availableTags.length > 0 && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm text-gray-400 whitespace-nowrap">
                  Filter by tag:
                </span>
                <select
                  value={selectedTagFilter}
                  onChange={(e) => setSelectedTagFilter(e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-600 rounded-md bg-gray-700 text-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
                >
                  <option value="all">All Questions</option>
                  {availableTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Questions Table */}
      <div className="p-6">
        <div className="space-y-1">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-4 py-3 text-sm font-medium text-gray-400 border-b border-gray-700">
            <div className="col-span-4">Question</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Recording</div>
            <div className="col-span-3">Tags</div>
          </div>

          {/* Question Rows */}
          {filteredAndSortedQuestions.map((question, index) => {
            const questionId = question._id || question.id || index;
            // For completed assignments, show all questions as "submitted" (recorded)
            const status = ["submitted", "approved", "completed"].includes(
              assignment.status,
            )
              ? "submitted"
              : questionStatuses[questionId] || "not-started";
            const isRecording = status === "recording";
            const isFinished = status === "finished";

            // Check if this question matches the current filter
            const matchesFilter =
              selectedTagFilter === "all" ||
              (question.tags && question.tags.includes(selectedTagFilter));

            return (
              <div
                key={questionId}
                className={`grid grid-cols-12 gap-4 py-4 items-center border-b border-gray-700 hover:bg-gray-700 ${
                  !matchesFilter ? "opacity-60" : ""
                }`}
              >
                {/* Question Text */}
                <div className="col-span-4">
                  <p className="text-sm text-white leading-relaxed">
                    {question.text ||
                      question.question ||
                      `Question ${index + 1}`}
                  </p>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      status,
                    )}`}
                  >
                    {getStatusText(status)}
                  </span>
                </div>

                {/* Recording Actions */}
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    {["submitted", "approved", "completed"].includes(
                      assignment.status,
                    ) ? (
                      // Show "Recorded" status and Play button for completed assignments
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 text-xs font-medium">
                          ✓ Recorded
                        </span>
                        <button
                          onClick={() =>
                            handleRecordingAction(questionId, "play")
                          }
                          className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-medium hover:bg-blue-200 flex items-center gap-1"
                        >
                          ▶ Play
                        </button>
                      </div>
                    ) : isRecording ? (
                      <>
                        <button
                          onClick={() => {
                            handleQuestionStatusChange(questionId, "finished");
                            handleRecordingAction(questionId, "stop");
                          }}
                          className="bg-red-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-red-600"
                        >
                          ● Stop
                        </button>
                        <button
                          onClick={() =>
                            handleRecordingAction(questionId, "play")
                          }
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs font-medium hover:bg-gray-200"
                        >
                          ▶
                        </button>
                      </>
                    ) : isFinished ? (
                      <>
                        <button
                          onClick={() =>
                            handleRecordingAction(questionId, "preview")
                          }
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs font-medium hover:bg-gray-200"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() =>
                            handleRecordingAction(questionId, "submit")
                          }
                          className="bg-green-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          handleQuestionStatusChange(questionId, "recording");
                          handleRecordingAction(questionId, "record");
                        }}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-600"
                      >
                        Record
                      </button>
                    )}
                  </div>
                </div>

                {/* Tags Column */}
                <div className="col-span-3">
                  {question.tags && question.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {question.tags.slice(0, 2).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTagColor(
                            tag,
                          )}`}
                        >
                          {tag.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">No tags</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-gray-700 flex justify-between">
          <button
            onClick={() => navigate("/model/dashboard")}
            className="px-4 py-2 text-gray-400 hover:text-gray-300"
          >
            ← Back to Dashboard
          </button>

          {/* Only show action buttons for non-completed assignments */}
          {!["submitted", "approved", "completed"].includes(
            assignment.status,
          ) && (
            <div className="flex gap-3">
              <button
                onClick={handleSaveProgressQuick}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700"
              >
                Save Progress
              </button>
              <button
                onClick={handleCompleteAssignment}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Complete Assignment
              </button>
            </div>
          )}

          {/* Show status message for completed assignments */}
          {["submitted", "approved", "completed"].includes(
            assignment.status,
          ) && (
            <div className="text-right">
              <div className="inline-flex items-center px-3 py-2 bg-green-100 text-green-800 rounded-lg">
                <CheckCircle className="w-4 h-4 mr-2" />
                Assignment{" "}
                {assignment.status === "submitted" ? "Submitted" : "Completed"}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {assignment.status === "submitted"
                  ? "Waiting for agency review"
                  : "This assignment has been completed"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// StatCard Component to match project theme
const StatCard = ({ title, value, color, icon }) => {
  const colorClasses = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    yellow: "bg-yellow-600",
    red: "bg-red-600",
    gray: "bg-gray-600",
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-white text-2xl font-bold">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]} text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Wrap with error boundary
const VoiceAssignmentsWithErrorBoundary = () => (
  <VoiceErrorBoundary>
    <VoiceAssignments />
  </VoiceErrorBoundary>
);

export default VoiceAssignmentsWithErrorBoundary;
