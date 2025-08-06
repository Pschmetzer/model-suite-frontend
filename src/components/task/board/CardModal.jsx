import { useState, useEffect } from "react";
import {
  X,
  AlignLeft,
  Calendar,
  User,
  Tag,
  Paperclip,
  Clock,
  Image,
  Video,
  FileText,
  Trash2,
  Edit2,
  Check,
  Save,
  Plus,
  MessageSquare,
  Send,
  AlertTriangle,
  PauseCircle,
} from "lucide-react";
import boardApi from "../../../utils/boardApi";
import AttachmentUpload from "./AttachmentUpload";
import { usePermissions } from "../../../hooks/usePermissions";
import PermissionGuard from "../../common/PermissionGuard";

const CardModal = ({ card, listTitle, onClose, onUpdate }) => {
  // Get user role from localStorage
  const auth = JSON.parse(localStorage.getItem("auth")) || {};
  const userRole = auth.user?.role;
  const isModel = userRole === "model";
  const { hasPermission, hasFullAccess } = usePermissions();

  const [title, setTitle] = useState(card?.title || "");
  const [description, setDescription] = useState(card?.description || "");
  const [dueDate, setDueDate] = useState(card?.dueDate || "");
  const [isEditing, setIsEditing] = useState(!card && !isModel);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [attachments, setAttachments] = useState(card?.attachments || []);
  const [showAttachmentUpload, setShowAttachmentUpload] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState({
    title: !card && !isModel,
    description: false,
  });
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [priority, setPriority] = useState(card?.priority || "medium");

  const priorityConfig = {
    critical: { color: "bg-red-500", text: "text-red-500", label: "Critical" },
    high: { color: "bg-orange-500", text: "text-orange-500", label: "High" },
    medium: {
      color: "bg-yellow-500",
      text: "text-yellow-500",
      label: "Medium",
    },
    low: { color: "bg-blue-500", text: "text-blue-500", label: "Low" },
  };

  useEffect(() => {
    if (card?._id) {
      loadAttachments();
      loadComments();
    }
  }, [card?._id]);

  const loadAttachments = async () => {
    try {
      const data = await boardApi.getTaskAttachments(card._id);
      setAttachments(data);
    } catch (error) {
      console.error("Failed to load attachments:", error);
    }
  };

  const loadComments = async () => {
    try {
      const data = await boardApi.getTaskComments(card._id);
      setComments(data);
    } catch (error) {
      console.error("Failed to load comments:", error);
    }
  };

  const handleSave = async () => {
    if (isModel) return; // Models cannot save changes

    if (!title.trim()) {
      return;
    }

    try {
      setIsSaving(true);
      const taskData = {
        title,
        description,
        dueDate,
        priority,
      };

      if (card) {
        // If card exists, it's an update
        await onUpdate({
          ...card,
          ...taskData,
        });
      } else {
        // If no card, it's a new task
        await onUpdate(taskData);
      }

      if (!card) {
        onClose();
      } else {
        setEditMode({ title: false, description: false });
      }
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAttachmentUpload = async (formData) => {
    try {
      await boardApi.uploadTaskAttachment(card._id, formData);
      await loadAttachments();
      setShowAttachmentUpload(false);
    } catch (error) {
      console.error("Failed to upload attachment:", error);
    }
  };

  const handleAttachmentDelete = async (attachmentId) => {
    try {
      await boardApi.deleteTaskAttachment(card._id, attachmentId);
      setAttachments(attachments.filter((a) => a._id !== attachmentId));
    } catch (error) {
      console.error("Failed to delete attachment:", error);
    }
  };

  const handleAttachmentClick = (attachment) => {
    if (attachment.type === "application/pdf") {
      // Create a temporary link to trigger download
      const link = document.createElement("a");
      link.href = attachment.url;
      link.download = attachment.originalName || "download.pdf"; // Use original filename or fallback
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // For other types, open in new tab
      window.open(attachment.url, "_blank");
    }
  };

  const getAttachmentPreview = (attachment) => {
    if (attachment.type.startsWith("image/")) {
      return (
        <img
          src={attachment.url}
          alt={attachment.originalName}
          className="max-h-32 rounded object-cover"
        />
      );
    }

    if (attachment.type.startsWith("video/")) {
      return (
        <video src={attachment.url} controls className="max-h-32 rounded">
          Your browser does not support the video tag.
        </video>
      );
    }

    const getIcon = () => {
      if (attachment.type.includes("pdf"))
        return <FileText className="w-8 h-8" />;
      if (attachment.type.startsWith("image/"))
        return <Image className="w-8 h-8" />;
      if (attachment.type.startsWith("video/"))
        return <Video className="w-8 h-8" />;
      return <FileText className="w-8 h-8" />;
    };

    return (
      <div className="flex items-center gap-3 p-3 bg-gray-700 rounded">
        {getIcon()}
        <span className="text-sm truncate">{attachment.originalName}</span>
      </div>
    );
  };

  const formatDueDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if date is invalid
    if (isNaN(d.getTime())) return "";

    // Format date
    const options = {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };

    // If it's today
    if (d.toDateString() === now.toDateString()) {
      return `Today at ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    }

    // If it's tomorrow
    if (d.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    }

    return d.toLocaleString("en-US", options);
  };

  const getDueDateStatus = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();

    if (isNaN(d.getTime())) return "";

    if (d < now) {
      return "text-red-500"; // overdue
    }

    const twoDaysFromNow = new Date(now);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    if (d <= twoDaysFromNow) {
      return "text-yellow-500"; // due soon
    }

    return "text-green-500"; // due later
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const comment = await boardApi.addTaskComment(card._id, {
        text: newComment.trim(),
      });

      // Update local state with the full comment data including author
      setComments((prevComments) => [...prevComments, comment]);
      setNewComment("");
      setIsAddingComment(false);

      // Reload comments to ensure we have the latest data with proper user info
      await loadComments();
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const formatCommentDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  // Close modal when Escape is pressed
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg w-full max-w-xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card Header */}
        <div className="p-4 relative border-b border-gray-700 bg-gray-800/90 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              {editMode.title || !card ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border-2 border-blue-500 rounded-lg text-white placeholder-gray-400 focus:outline-none text-base"
                    placeholder="Card title"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && title.trim()) {
                        handleSave();
                      }
                    }}
                  />
                </div>
              ) : (
                <h2 className="text-lg font-semibold text-white flex-1 group relative">
                  {title}
                  <PermissionGuard
                    permission="tasks.edit"
                    fallback={hasFullAccess}
                  >
                    {!isModel && (
                      <button
                        onClick={() =>
                          setEditMode({ ...editMode, title: true })
                        }
                        className="ml-2 p-1 text-gray-400 hover:text-white rounded opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 right-0"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </PermissionGuard>
                </h2>
              )}
              <div className="text-sm text-gray-400 mt-1">
                in list <span className="text-gray-300">{listTitle}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 space-y-6 flex-1 overflow-y-auto">
          {/* On Hold Status - Add this before Description */}
          {card?.isOnHold && (
            <div className="flex gap-3">
              <PauseCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-500 mb-2">
                  On Hold
                </h3>
                <div className="bg-yellow-500/10 rounded-lg p-3">
                  <p className="text-sm text-white mb-2">{card.onHoldReason}</p>
                  <div className="flex items-center gap-2 text-xs text-yellow-500">
                    <span>
                      Put on hold by{" "}
                      {card.onHoldBy?.userType === "ModelUser"
                        ? "Model"
                        : card.onHoldBy?.userType !== "ModelUser"
                          ? "Agency"
                          : "User"}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(card.onHoldBy?.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Priority Section - Add this before Description */}
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Priority
              </h3>
              <div className="flex items-center gap-2">
                {!isModel ? (
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${priorityConfig[priority].text} bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500`}
                  >
                    {Object.entries(priorityConfig).map(([value, config]) => (
                      <option key={value} value={value} className="bg-gray-700">
                        {config.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${priorityConfig[priority].text} bg-gray-700`}
                  >
                    {priorityConfig[priority].label}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="flex gap-3">
            <AlignLeft className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center justify-between">
                Description
                <PermissionGuard
                  permission="tasks.edit"
                  fallback={hasFullAccess}
                >
                  {!editMode.description && !isModel && card && (
                    <button
                      onClick={() =>
                        setEditMode({ ...editMode, description: true })
                      }
                      className="p-1 text-gray-400 hover:text-white rounded transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </PermissionGuard>
              </h3>
              {(editMode.description || !card) && !isModel ? (
                <div className="space-y-2">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border-2 border-blue-500 rounded-lg text-white placeholder-gray-400 focus:outline-none resize-none h-20 text-sm"
                    placeholder="Add a more detailed description..."
                  />
                </div>
              ) : (
                <p className="text-sm text-gray-300 whitespace-pre-wrap">
                  {description || "No description provided"}
                </p>
              )}
            </div>
          </div>

          {/* Due Date Section */}
          <div className="flex gap-3">
            <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Due Date
              </h3>
              <div className="flex items-center gap-2">
                {showDatePicker && !isModel ? (
                  <div className="space-y-2">
                    <input
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border-2 border-blue-500 rounded-lg text-white focus:outline-none text-sm"
                    />
                  </div>
                ) : (
                  <div className="px-3 py-2 bg-gray-700 rounded-lg text-sm text-white font-medium flex items-center gap-2">
                    {dueDate ? (
                      <>
                        <Clock
                          className={`w-4 h-4 ${card.isComplete ? "text-green-400" : getDueDateStatus(dueDate)}`}
                        />
                        {formatDueDate(dueDate)}
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4" />
                        No due date set
                      </>
                    )}
                  </div>
                )}
                {!isModel && !showDatePicker && (
                  <button
                    onClick={() => setShowDatePicker(true)}
                    className="px-3 py-2 hover:bg-gray-600 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {dueDate ? "Edit" : "Set due date"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Members Section */}
          <div className="flex gap-3">
            <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Members
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Existing members */}
                {card?.assignedTo && card.assignedTo.length > 0 ? (
                  card.assignedTo.map((member, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2"
                    >
                      <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                        {member.profilePhoto ? (
                          <img
                            src={member.profilePhoto}
                            alt={member.fullName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white text-xs font-medium">
                            {member.fullName?.[0] || "U"}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-white">
                        {member.fullName}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">
                    No members assigned
                  </span>
                )}
                {!isModel && (
                  <button className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition-colors font-medium flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Member
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Labels Section */}
          <div className="flex gap-3">
            <Tag className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Labels</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Existing labels */}
                {card?.labels && card.labels.length > 0 ? (
                  card.labels.map((label, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: label.color || "#6B7280" }}
                    >
                      {label.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">
                    No labels assigned
                  </span>
                )}
                {!isModel && (
                  <button className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition-colors font-medium flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Label
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Only show attachments section for existing cards */}
          {card && (
            <div className="flex gap-3">
              <Paperclip className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  Attachments
                </h3>

                {/* Attachment List */}
                {attachments.length > 0 && (
                  <div className="space-y-2 mb-2">
                    {attachments.map((attachment) => (
                      <div key={attachment._id} className="group relative">
                        <div
                          onClick={() => handleAttachmentClick(attachment)}
                          className="cursor-pointer hover:opacity-90 transition-opacity"
                        >
                          {getAttachmentPreview(attachment)}
                        </div>
                        {/* Only agency can delete attachments */}
                        {!isModel && (
                          <button
                            onClick={() =>
                              handleAttachmentDelete(attachment._id)
                            }
                            className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3 text-white" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button or Component - Allow both agency and model to upload */}
                {showAttachmentUpload ? (
                  <AttachmentUpload
                    onUpload={handleAttachmentUpload}
                    onCancel={() => setShowAttachmentUpload(false)}
                  />
                ) : (
                  <button
                    onClick={() => setShowAttachmentUpload(true)}
                    className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition-colors font-medium flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add attachment
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Comments Section - Last Section */}
          {card && (
            <div className="flex gap-3">
              <MessageSquare className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  Comments
                </h3>

                {/* Comments List */}
                <div className="space-y-3 mb-3">
                  {comments.map((comment) => (
                    <div
                      key={comment._id}
                      className="bg-gray-700/50 rounded-lg p-3"
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                          {comment.author?.profilePhoto ? (
                            <img
                              src={comment.author.profilePhoto}
                              alt={
                                comment.author.fullName ||
                                comment.author.agencyName
                              }
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-xs font-medium">
                              {(comment.author?.fullName ||
                                comment.author?.agencyName)?.[0] || "U"}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-white">
                              {comment.author?.fullName ||
                                comment.author?.agencyName ||
                                "Unknown User"}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatCommentDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Comment */}
                {isAddingComment ? (
                  <div className="space-y-2">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="w-full px-3 py-2 bg-gray-700 border-2 border-blue-500 rounded-lg text-white placeholder-gray-400 focus:outline-none resize-none h-20 text-sm"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setNewComment("");
                          setIsAddingComment(false);
                        }}
                        className="px-3 py-1.5 hover:bg-gray-700 rounded-lg text-xs text-gray-400 hover:text-white transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs"
                      >
                        <Send className="w-3 h-3" />
                        Send
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingComment(true)}
                    className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition-colors font-medium flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Comment
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Action Buttons */}
        <PermissionGuard
          permission={card ? "tasks.edit" : "tasks.create"}
          fallback={hasFullAccess}
        >
          {!isModel && (
            <div className="p-4 border-t border-gray-700 bg-gray-800/95 backdrop-blur sticky bottom-0">
              <div className="flex items-center justify-end gap-3">
                {/* Cancel Button - Only show when editing existing card */}
                {card && (editMode.title || editMode.description) && (
                  <button
                    onClick={() => {
                      setTitle(card.title);
                      setDescription(card.description);
                      setEditMode({ title: false, description: false });
                    }}
                    className="px-4 py-2 hover:bg-gray-700 rounded-lg text-sm text-gray-400 hover:text-white transition-colors font-medium"
                  >
                    Cancel
                  </button>
                )}

                {/* Main Action Button */}
                <button
                  onClick={handleSave}
                  disabled={!title.trim() || isSaving}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm min-w-[120px] justify-center"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {card ? "Save Changes" : "Create Card"}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </PermissionGuard>

        {/* Model View Footer - Read-only message */}
        {isModel && (
          <div className="p-4 border-t border-gray-700 bg-gray-800/95 backdrop-blur">
            <div className="text-center text-sm text-gray-400">
              You can view this card but cannot make changes
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardModal;
