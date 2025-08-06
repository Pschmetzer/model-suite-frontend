import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  Play,
  Pause,
  Download,
  CheckCircle,
  XCircle,
  MessageSquare,
  Clock,
  User,
  Calendar,
  Filter,
  Search,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { voiceAPI } from "../../../services/voiceAPI";

const VoiceReviewCenter = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [filterStatus, setFilterStatus] = useState("submitted");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching agency assignments with status:", filterStatus);
      const response = await voiceAPI.getAgencyAssignments({
        status: filterStatus,
      });
      console.log("✅ Agency assignments response:", response);
      console.log("✅ Response data:", response.data);
      console.log(
        "✅ Number of assignments found:",
        response.data.data?.assignments?.length || 0,
      );

      const assignments = response.data.data?.assignments || [];
      console.log(
        "✅ Assignments with recordings info:",
        assignments.map((a) => ({
          id: a._id,
          title: a.title,
          status: a.status,
          recordingsInfo: a.recordingsInfo,
          hasRecordings: a.recordings?.length > 0,
        })),
      );

      setAssignments(assignments);
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      toast.error(
        `Failed to fetch assignments: ${
          error.response?.data?.message || error.message
        }`,
      );
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const matchesSearch =
        assignment.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.modelId?.username
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        assignment.modelId?.fullName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [assignments, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Voice Review Center
            </h1>
            <p className="text-white mt-2 text-lg">
              Review and approve submitted voice assignments from your models
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-700">
                  {filteredAssignments.length} assignments pending review
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Filter & Search
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search Assignments
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by assignment title, model name, or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Filter by Status
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-colors"
                >
                  <option value="submitted">📋 Pending Review</option>
                  <option value="in_progress">🔄 In Progress</option>
                  <option value="approved">✅ Approved</option>
                  <option value="rejected">❌ Rejected</option>
                  <option value="draft">📝 Draft</option>
                  <option value="all">📊 All Assignments</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Assignments and Review Checklist */}
        <div className="lg:col-span-1 space-y-6">
          {/* Assignments List */}
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
            <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Assignments</h2>
                  <p className="text-sm text-gray-300 mt-1">
                    {filteredAssignments.length} assignments found
                  </p>
                </div>
                <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {
                    filteredAssignments.filter((a) => a.status === "submitted")
                      .length
                  }{" "}
                  pending
                </div>
              </div>
            </div>
            <div className="h-80 overflow-y-auto">
              {filteredAssignments.map((assignment) => (
                <AssignmentListItem
                  key={assignment._id}
                  assignment={assignment}
                  isSelected={selectedAssignment?._id === assignment._id}
                  onClick={() => setSelectedAssignment(assignment)}
                />
              ))}
              {filteredAssignments.length === 0 && (
                <div className="p-12 text-center text-gray-400">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-3">
                    No assignments found
                  </h3>
                  <p className="text-gray-400 mb-4">
                    {filterStatus === "submitted"
                      ? "No assignments are currently pending review"
                      : filterStatus === "all"
                        ? "No assignments found. Check back later for new submissions"
                        : `No ${filterStatus} assignments at this time`}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-blue-400">
                    <Clock className="w-4 h-4" />
                    <span>Assignments refresh automatically</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Review Checklist - Separate Card */}
          {selectedAssignment && (
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
              <div className="p-6 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-b border-gray-700">
                <h3 className="text-lg font-bold text-white">
                  Review Checklist
                </h3>
                <p className="text-sm text-gray-300 mt-1">
                  Guidelines for reviewing recordings
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-300">
                      Does the recording clearly match the question text?
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-300">
                      Is the audio quality clear and understandable?
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-300">
                      Are all words pronounced correctly?
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-300">
                      Is the pace and tone appropriate?
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-300">
                      Does it match the intended mood/tags?
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Review Panel */}
        <div className="lg:col-span-2">
          {selectedAssignment ? (
            <AssignmentReviewPanel
              assignment={selectedAssignment}
              onUpdate={() => {
                fetchAssignments();
                setSelectedAssignment(null);
              }}
            />
          ) : (
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
              <div className="p-12 text-center">
                <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-12 h-12 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Select an assignment to review
                </h3>
                <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto">
                  Choose an assignment from the list to start the review process
                  and listen to voice recordings
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Listen</h4>
                    <p className="text-sm text-gray-600">
                      Play and review voice recordings
                    </p>
                  </div>

                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Approve
                    </h4>
                    <p className="text-sm text-gray-600">
                      Accept quality recordings
                    </p>
                  </div>

                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="w-12 h-12 mx-auto mb-3 bg-yellow-100 rounded-full flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-yellow-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Revise</h4>
                    <p className="text-sm text-gray-600">
                      Request improvements
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AssignmentListItem = ({ assignment, isSelected, onClick }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-600 text-white";
      case "rejected":
        return "bg-red-600 text-white";
      case "submitted":
        return "bg-blue-600 text-white";
      case "in_progress":
        return "bg-yellow-600 text-white";
      case "assigned":
        return "bg-gray-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors ${
        isSelected ? "bg-blue-600/20 border-blue-500" : ""
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-white text-sm line-clamp-2">
          {assignment.title || "Untitled Assignment"}
        </h3>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
            assignment.status,
          )}`}
        >
          {assignment.status.replace("_", " ")}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
        <User className="w-3 h-3" />
        <span>
          {assignment.modelId?.fullName || assignment.modelId?.username}
        </span>
        <span className="mx-1">•</span>
        <span>{assignment.recordingsInfo?.questionsCount || 0} questions</span>
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-400">
        <Calendar className="w-3 h-3" />
        <span>Submitted: {formatDate(assignment.completedAt)}</span>
      </div>
    </div>
  );
};

const AssignmentReviewPanel = ({ assignment, onUpdate }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [assignmentRecordings, setAssignmentRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(null);

  const fetchAssignmentRecordings = useCallback(async () => {
    if (!assignment?._id) return;

    try {
      setLoading(true);
      const response = await voiceAPI.getAssignmentRecordings(assignment._id);

      // The recordings are directly in response.data.data, not in a nested recordings property
      const recordings = response.data.data || [];

      setAssignmentRecordings(recordings);
      setCurrentQuestionIndex(0);
      // Reset audio player state when fetching new recordings
      setIsPlaying(false);
      setCurrentTime(0);
      setComment("");
    } catch (error) {
      console.error("Failed to fetch assignment recordings:", error);
      toast.error("Failed to load assignment recordings");
      setAssignmentRecordings([]);
    } finally {
      setLoading(false);
    }
  }, [assignment?._id]);

  useEffect(() => {
    if (assignment?._id) {
      fetchAssignmentRecordings();
    }
  }, [assignment?._id, fetchAssignmentRecordings]);

  const currentRecording = useMemo(() => {
    return assignmentRecordings[currentQuestionIndex];
  }, [assignmentRecordings, currentQuestionIndex]);

  // Reset audio when question index changes
  useEffect(() => {
    if (audioRef.current && currentRecording) {
      audioRef.current.load();
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setComment("");
  }, [currentQuestionIndex]);

  // Reset audio state when recording changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [currentRecording]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && audioRef.current.currentTime !== undefined) {
      const time = audioRef.current.currentTime;
      if (!isNaN(time) && isFinite(time)) {
        setCurrentTime(time);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration) {
      const audioDuration = audioRef.current.duration;
      if (!isNaN(audioDuration) && isFinite(audioDuration)) {
        setDuration(audioDuration);
      } else {
        setDuration(0);
      }
    }
  };

  const handleSeek = (e) => {
    if (!duration || isNaN(duration) || !isFinite(duration)) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    if (audioRef.current && !isNaN(newTime) && isFinite(newTime)) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) {
      return "0:00";
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleString();
  };

  const handleRecordingReview = async (action) => {
    if (!currentRecording) {
      toast.error("No recording selected");
      return;
    }

    if (!comment.trim() && action !== "approved") {
      toast.error("Please add a comment for this action");
      return;
    }

    setSubmitting(true);
    try {
      const reviewData = {
        status: action,
        comments: comment.trim(),
        rating: action === "approved" ? 5 : undefined,
      };

      await voiceAPI.reviewRecording(currentRecording._id, reviewData);

      toast.success(`Recording ${action} successfully`);

      // Refresh the recordings to get updated status
      await fetchAssignmentRecordings();

      // Clear comment after successful review
      setComment("");

      // Move to next recording if available
      if (currentQuestionIndex < assignmentRecordings.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    } catch (error) {
      console.error("Review error:", error);
      toast.error(`Failed to ${action} recording: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteAssignmentReview = async () => {
    if (!assignment) return;

    // Check if all recordings are reviewed
    const pendingRecordings = assignmentRecordings.filter(
      (r) => !r.status || r.status === "submitted" || r.status === "pending",
    );

    if (pendingRecordings.length > 0) {
      toast.error(
        `Please review all recordings first. ${pendingRecordings.length} recordings are still pending review.`,
      );
      return;
    }

    // Check if any recordings were rejected
    const rejectedRecordings = assignmentRecordings.filter(
      (r) => r.status === "rejected" || r.status === "requires_revision",
    );

    if (rejectedRecordings.length > 0) {
      toast.info(
        `Assignment has ${rejectedRecordings.length} rejected recordings. The model will need to re-record these.`,
      );
      onUpdate(); // Refresh the assignment list
      return;
    }

    // All recordings approved - complete the assignment
    try {
      setSubmitting(true);

      const response = await voiceAPI.completeAssignmentReview(assignment._id, {
        comments: "All recordings have been reviewed and approved.",
      });

      if (response.data.data.status === "completed") {
        toast.success(
          "All recordings approved! Assignment completed successfully.",
        );
      } else {
        toast.info(
          "Assignment review completed. Some recordings need revision.",
        );
      }

      onUpdate();
    } catch (error) {
      console.error("Complete assignment error:", error);
      toast.error(`Failed to complete assignment review: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-400">Loading assignment details...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              {assignment.title || "Untitled Assignment"}
            </h2>
            <p className="text-gray-300">
              by {assignment.modelId?.fullName || assignment.modelId?.username}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-white">
            {assignment.status.replace("_", " ")}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Submitted:</span>
            <span className="ml-2 font-medium text-white">
              {formatDate(assignment.completedAt)}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Questions:</span>
            <span className="ml-2 font-medium text-white">
              {assignmentRecordings.length} recorded
            </span>
          </div>
        </div>
      </div>

      {/* Question Navigation */}
      {assignmentRecordings.length > 0 && (
        <div className="p-6 border-b border-gray-700 bg-gray-700/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-white">
              Question {currentQuestionIndex + 1} of{" "}
              {assignmentRecordings.length}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
                }
                disabled={currentQuestionIndex === 0}
                className="px-3 py-1 border border-gray-600 rounded bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentQuestionIndex(
                    Math.min(
                      assignmentRecordings.length - 1,
                      currentQuestionIndex + 1,
                    ),
                  )
                }
                disabled={
                  currentQuestionIndex === assignmentRecordings.length - 1
                }
                className="px-3 py-1 border border-gray-600 rounded bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>

          {/* Recording Progress Indicators */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {assignmentRecordings.map((recording, index) => (
              <button
                key={recording._id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded-full text-xs font-medium border-2 transition-colors ${
                  index === currentQuestionIndex
                    ? "border-blue-500 bg-blue-500 text-white"
                    : recording.status === "approved"
                      ? "border-green-500 bg-green-500 text-white"
                      : recording.status === "rejected"
                        ? "border-red-500 bg-red-500 text-white"
                        : recording.status === "requires_revision"
                          ? "border-yellow-500 bg-yellow-500 text-white"
                          : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
                }`}
                title={`Question ${index + 1} - ${
                  recording.status === "approved"
                    ? "Approved"
                    : recording.status === "rejected"
                      ? "Rejected"
                      : recording.status === "requires_revision"
                        ? "Needs Revision"
                        : "Pending Review"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentRecording && (
            <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
              <h4 className="font-medium text-white mb-3">
                Question {currentQuestionIndex + 1} of{" "}
                {assignmentRecordings.length}
              </h4>
              <div className="bg-blue-600/20 p-4 rounded-lg border-l-4 border-blue-400">
                <h5 className="font-medium text-blue-300 mb-2">
                  Question Text:
                </h5>
                <p className="text-blue-200 text-lg leading-relaxed">
                  "
                  {currentRecording.questionText ||
                    "Question text not available"}
                  "
                </p>
              </div>
              <div className="mt-3 text-sm text-gray-300">
                <p>
                  <strong>Instructions:</strong> Listen to the recording and
                  verify if the model correctly read the above question text.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audio Player */}
      {currentRecording && (
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-white">Audio Recording</h3>
            <div className="text-sm text-gray-300">
              Duration:{" "}
              {currentRecording.formattedDuration ||
                `${Math.round(currentRecording.duration || 0)}s`}{" "}
              | Size:{" "}
              {currentRecording.formattedFileSize ||
                `${Math.round((currentRecording.fileSize || 0) / 1024)}KB`}
            </div>
          </div>

          <audio
            ref={audioRef}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={() => {
              console.error("Audio loading error");
              setDuration(0);
              setCurrentTime(0);
              setIsPlaying(false);
            }}
            onLoadStart={() => {
              setDuration(0);
              setCurrentTime(0);
            }}
            preload="metadata"
          >
            <source src={currentRecording.fileUrl} type="audio/mpeg" />
            <source src={currentRecording.fileUrl} type="audio/wav" />
            <source src={currentRecording.fileUrl} type="audio/ogg" />
            Your browser does not support the audio element.
          </audio>

          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={togglePlayPause}
              className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-1" />
              )}
            </button>

            <div className="flex-1">
              <div className="flex justify-between text-sm text-gray-300 mb-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <div
                className="w-full h-2 bg-gray-600 rounded-full cursor-pointer"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-100"
                  style={{
                    width: `${
                      duration && duration > 0
                        ? Math.min(
                            100,
                            Math.max(0, (currentTime / duration) * 100),
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-300">
            <p>Recorded: {formatDate(currentRecording.createdAt)}</p>
            {currentRecording.duration && (
              <p>Duration: {formatTime(currentRecording.duration)}</p>
            )}
          </div>
        </div>
      )}

      {/* Recording Status */}
      {currentRecording && (
        <div className="p-6 border-b border-gray-700 bg-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-white">Recording Status</h3>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentRecording.status === "approved"
                  ? "bg-green-600 text-white"
                  : currentRecording.status === "rejected"
                    ? "bg-red-600 text-white"
                    : currentRecording.status === "requires_revision"
                      ? "bg-yellow-600 text-white"
                      : "bg-gray-600 text-white"
              }`}
            >
              {currentRecording.status === "approved"
                ? "Approved"
                : currentRecording.status === "rejected"
                  ? "Rejected"
                  : currentRecording.status === "requires_revision"
                    ? "Needs Revision"
                    : "Pending Review"}
            </span>
          </div>
          {currentRecording.reviewComments && (
            <div className="bg-gray-800 p-3 rounded border border-gray-600 text-sm text-gray-300">
              <strong>Previous Review:</strong>{" "}
              {currentRecording.reviewComments}
            </div>
          )}
        </div>
      )}

      {/* Review Actions */}
      <div className="p-6">
        <h3 className="font-semibold text-white mb-4">Review This Recording</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Comments for this recording
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            rows={4}
            placeholder="Explain why you're approving/rejecting this recording. Be specific about pronunciation, clarity, or accuracy issues..."
          />
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => handleRecordingReview("approved")}
            disabled={submitting || !currentRecording}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            Approve Recording
          </button>

          <button
            onClick={() => handleRecordingReview("requires_revision")}
            disabled={submitting || !currentRecording}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <MessageSquare className="w-4 h-4" />
            Request Revision
          </button>

          <button
            onClick={() => handleRecordingReview("rejected")}
            disabled={submitting || !currentRecording}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            Reject Recording
          </button>
        </div>

        {/* Complete Assignment Review */}
        <div className="border-t border-gray-700 pt-4">
          <button
            onClick={handleCompleteAssignmentReview}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
          >
            <CheckCircle className="w-5 h-5" />
            Complete Assignment Review
          </button>
          <p className="text-sm text-gray-400 mt-2 text-center">
            Review all recordings individually first, then complete the
            assignment
          </p>
        </div>
      </div>

      {/* Assignment Summary */}
      <div className="p-6 border-t border-gray-700 bg-gray-700/50">
        <h3 className="font-semibold text-white mb-4">Assignment Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Total Questions:</span>
            <span className="ml-2 font-medium text-white">
              {assignment.questionIds?.length || 0}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Recordings Submitted:</span>
            <span className="ml-2 font-medium text-white">
              {assignmentRecordings.length}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Approved:</span>
            <span className="ml-2 font-medium text-green-400">
              {
                assignmentRecordings.filter((r) => r.status === "approved")
                  .length
              }
            </span>
          </div>
          <div>
            <span className="text-gray-400">Rejected:</span>
            <span className="ml-2 font-medium text-red-400">
              {
                assignmentRecordings.filter(
                  (r) =>
                    r.status === "rejected" || r.status === "requires_revision",
                ).length
              }
            </span>
          </div>
          <div>
            <span className="text-gray-400">Pending Review:</span>
            <span className="ml-2 font-medium text-yellow-400">
              {
                assignmentRecordings.filter(
                  (r) =>
                    !r.status ||
                    r.status === "submitted" ||
                    r.status === "pending",
                ).length
              }
            </span>
          </div>
          <div>
            <span className="text-gray-400">Priority:</span>
            <span className="ml-2 font-medium capitalize text-white">
              {assignment.priority || "normal"}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Deadline:</span>
            <span className="ml-2 font-medium text-white">
              {formatDate(assignment.deadline)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceReviewCenter;
