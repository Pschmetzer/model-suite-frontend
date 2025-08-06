import {
  AudioLines,
  File,
  Image,
  Loader2,
  Plus,
  Send,
  Smile,
  Video,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  X,
  Play,
  FileArchive,
  FileSpreadsheet,
  FileCode,
  Music,
  RefreshCw,
  AlertCircle,
  Sticker,
  Mic,
  Square,
  Pause,
  Trash2,
  ArrowDownIcon,
  Edit2,
} from "lucide-react";
// import { ObjectId } from "bson";
import React, { lazy, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import socket from "../../utils/socket";
import EmojiPicker from "emoji-picker-react";
import GifStickerPicker from "./GifPicker";
import VoiceRecorder from "./VoiceRecorder"; // Changed to named import with curly braces
import { ObjectId } from "bson";
const LazyEmojiPicker = lazy(() => import("emoji-picker-react"));
const ChatSender = ({
  chatType,
  convoId,
  members,
  ReplyData,
  setReplyData,
  editingData,
  setEditingData,
  attachments,
  setAttachments,
  previewAttachmentsIds,
  setPreviewAttachmentsIds,
  handleSendMessage,
  handleSendGif,
  handleSendAudio,
  handleEditMessage,
}) => {
  const user = JSON.parse(localStorage.getItem("auth"))?.user;

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [text, setText] = useState("");
  const dispatch = useDispatch();
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutref = useRef(null);
  const [ShowAddAttcahment, setShowAddAttcahment] = useState(false);
  const [ShowVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const HoverTimeout = useRef(null);
  const showItemTimeout = useRef(null);
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const previewAttachments = attachments.filter((a) =>
    previewAttachmentsIds.includes(a.fileId),
  );

  const fileInputRefs = {
    image: useRef(null),
    video: useRef(null),
    audio: useRef(null),
    document: useRef(null),
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const triggerFileInput = (type) => {
    fileInputRefs[type]?.current?.click();
    setShowAddAttcahment(false);
  };

  const getFileType = (file) => {
    const extension = file.name.split(".").pop().toLowerCase();
    const mimeType = file.type.toLowerCase();

    // Images
    if (mimeType.startsWith("image/")) return "image";

    // Videos
    if (mimeType.startsWith("video/") && !mimeType.includes("webm"))
      return "video";

    // Audio
    if (mimeType.includes("webm") || mimeType.includes("audio")) return "audio";

    // Archives
    if (
      ["zip", "rar", "7z", "tar", "gz"].includes(extension) ||
      mimeType.includes("zip") ||
      mimeType.includes("archive")
    ) {
      return "archive";
    }

    // PDFs
    if (extension === "pdf" || mimeType === "application/pdf") return "pdf";

    // Spreadsheets
    if (
      ["xlsx", "xls", "csv"].includes(extension) ||
      mimeType.includes("spreadsheet")
    ) {
      return "spreadsheet";
    }

    // Code files
    if (
      [
        "js",
        "jsx",
        "ts",
        "tsx",
        "html",
        "css",
        "json",
        "xml",
        "py",
        "java",
        "cpp",
        "c",
      ].includes(extension)
    ) {
      return "code";
    }

    // Documents
    if (
      ["doc", "docx", "txt", "rtf"].includes(extension) ||
      mimeType.includes("document") ||
      mimeType.includes("text")
    ) {
      return "document";
    }

    return "file";
  };

  const createVideoThumbnail = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        video.currentTime = 1; // Seek to 1 second
      };
      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);
        canvas.toBlob(resolve, "image/jpeg", 0.7);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files?.[0];
    console.log(file);
    if (!file) return;

    const fileId = new ObjectId().toString();
    const localUrl = URL.createObjectURL(file);
    const fileType = getFileType(file);

    let thumbnailUrl = null;

    // Generate thumbnails for videos
    if (fileType === "video") {
      try {
        const thumbnailBlob = await createVideoThumbnail(file);
        if (thumbnailBlob) {
          thumbnailUrl = URL.createObjectURL(thumbnailBlob);
        }
      } catch (error) {
        console.error("Error creating video thumbnail:", error);
      }
    }

    const newAttachment = {
      fileId,
      file,
      type: fileType,
      name: file.name,
      size: file.size,
      width: file.naturalWidth || null,
      height: file.naturalHeight || null,
      localUrl,
      thumbnailUrl,
      duration: 0,
      mimeType: file.type,
      status: "pending", // pending, uploading, uploaded, error
      progress: 0,
      cloudinaryUrl: null,
      error: null,
    };

    const newPreviewAttachmentId = fileId;

    setAttachments((prev) => [...prev, newAttachment]);
    setPreviewAttachmentsIds((prev) => [...prev, newPreviewAttachmentId]);
    e.target.value = null;
  };

  const prepareAudioMsg = (file) => {
    if (!file) return;

    const fileId = new ObjectId().toString();
    const localUrl = URL.createObjectURL(file);
    const fileType = "audio/recording";

    const audioAttachment = {
      fileId,
      file,
      type: fileType,
      name: file.name,
      size: file.size,
      width: file.naturalWidth || null,
      height: file.naturalHeight || null,
      localUrl,
      thumbnailUrl: null,
      duration: 0,
      mimeType: file.type,
      status: "pending", // pending, uploading, uploaded, error
      progress: 0,
      cloudinaryUrl: null,
      error: null,
    };

    handleSendAudio(audioAttachment);
  };

  const removeAttachment = (fileId) => {
    setAttachments((prev) => {
      const attachment = prev.find((a) => a.fileId === fileId);
      if (attachment) {
        // Clean up blob URLs
        URL.revokeObjectURL(attachment.localUrl);
        if (attachment.thumbnailUrl) {
          URL.revokeObjectURL(attachment.thumbnailUrl);
        }
      }
      return prev.filter((a) => a.fileId !== fileId);
    });

    setPreviewAttachmentsIds((prev) =>
      prev.filter((previewId) => previewId !== fileId),
    );
  };

  const formatSize = (size) =>
    size >= 1024 * 1024
      ? `${(size / (1024 * 1024)).toFixed(1)} MB`
      : `${(size / 1024).toFixed(1)} KB`;

  const getFileIcon = (type) => {
    switch (type) {
      case "image":
        return <FileImage size={20} className="text-green-600" />;
      case "video":
        return <FileVideo size={20} className="text-purple-600" />;
      case "audio":
        return <Music size={20} className="text-blue-600" />;
      case "archive":
        return <FileArchive size={20} className="text-yellow-600" />;
      case "pdf":
        return <File size={20} className="text-red-600" />;
      case "spreadsheet":
        return <FileSpreadsheet size={20} className="text-green-700" />;
      case "code":
        return <FileCode size={20} className="text-purple-700" />;
      case "document":
        return <FileText size={20} className="text-blue-700" />;
      default:
        return <File size={20} className="text-gray-600" />;
    }
  };

  const renderFilePreview = (attachment) => {
    const { type, localUrl, thumbnailUrl, name, size, status } = attachment;

    return (
      <div
        key={attachment.fileId}
        className="relative min-w-24 max-w-24 min-h-32 bg-[#1e262b] rounded-lg overflow-hidden border border-[#3a4651] group"
      >
        {/* Preview Area */}
        <div className="w-full h-20 bg-[#2a3942] flex items-center justify-center relative">
          {type === "image" && (
            <img
              src={localUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          )}

          {type === "video" && (
            <>
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#3a4651] flex items-center justify-center">
                  <FileVideo size={24} className="text-purple-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                <Play size={16} className="text-white" />
              </div>
            </>
          )}

          {type === "audio" && (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Music size={24} className="text-white" />
            </div>
          )}

          {type === "pdf" && (
            <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
              <File size={24} className="text-white" />
            </div>
          )}

          {type === "archive" && (
            <div className="w-full h-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
              <FileArchive size={24} className="text-white" />
            </div>
          )}

          {type === "spreadsheet" && (
            <div className="w-full h-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center">
              <FileSpreadsheet size={24} className="text-white" />
            </div>
          )}

          {type === "code" && (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
              <FileCode size={24} className="text-white" />
            </div>
          )}

          {(type === "document" || type === "file") && (
            <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
              {getFileIcon(type)}
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="p-2 h-12">
          <p className="text-xs text-white truncate font-medium">{name}</p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">{formatSize(size)}</p>
          </div>
        </div>

        {/* Remove Button */}
        {status !== "uploading" && (
          <button
            onClick={() => removeAttachment(attachment.fileId)}
            className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={12} className="text-white" />
          </button>
        )}
      </div>
    );
  };

  function handleTyping() {
    socket.emit("dm:typing", { convoId, userId: user._id, state: true });

    if (typingTimeoutref.current) clearTimeout(typingTimeoutref.current);

    typingTimeoutref.current = setTimeout(() => {
      socket.emit("dm:typing", { convoId, userId: user._id, state: false });
      typingTimeoutref.current = null;
    }, 1000);
  }

  const handleKeyPress = (e) => {
    handleTyping();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (!editingData) {
        handleSendMessage({ text: text, setText: setText });
      } else {
        handleEditMessage({ newText: text, setText: setText });
      }
    }
  };

  const handleMicClick = () => {
    setShowVoiceRecorder(true);
  };

  const preloadEmojiPicker = () => {
    import("emoji-picker-react");
  };

  useEffect(() => {
    setText(editingData?.text || "");
  }, [editingData?.text]);

  return (
    <div>
      <div className="border-t relative border-[#232e3c] bg-[#232e3c]">
        {ShowVoiceRecorder ? (
          <>
            {ReplyData && (
              <div className="reply-div-box p-2 relative">
                <div className="reply-div w-full h-auto px-3 py-2 bg-[#1e262b] border-l-4 border-green-500 rounded-md flex gap-3 items-start">
                  {/* Attachment preview (if replying to attachment) */}
                  {ReplyData.attachments?.length === 1 && (
                    <div className="w-12 h-12 min-w-12 rounded-md overflow-hidden bg-[#2a3942] flex items-center justify-center">
                      {ReplyData.attachments[0].mimeType.includes("image") && (
                        <img
                          src={
                            ReplyData.attachments[0].localUrl ||
                            ReplyData.attachments[0].cloudinaryUrl
                          }
                          alt="attachment"
                          className="w-full h-full object-cover"
                        />
                      )}

                      {(ReplyData.attachments[0].mimeType.includes("audio") ||
                        ReplyData.attachments[0].mimeType.includes("webm")) && (
                        <Music className="text-blue-400 w-5 h-5" />
                      )}

                      {ReplyData.attachments[0].type.includes("document") && (
                        <FileText className="text-white w-5 h-5" />
                      )}

                      {ReplyData.attachments[0].type.includes("video") &&
                        !ReplyData.attachments[0].type.includes("video") && (
                          <FileImage className="text-purple-400 w-5 h-5" />
                        )}
                    </div>
                  )}

                  {/* Text or File Name */}
                  <div className="flex-1">
                    <p className="text-green-300 font-medium">
                      {
                        members.find((m) => m.userId === ReplyData.senderId)
                          .name
                      }
                    </p>

                    {ReplyData.type === "textonly" ||
                    (ReplyData.type === "mixed" && ReplyData.text) ? (
                      <p className="text-sm opacity-60 text-ellipsis whitespace-nowrap overflow-hidden">
                        {ReplyData.text}
                      </p>
                    ) : (
                      ReplyData.attachments?.length === 1 && (
                        <p className="text-sm text-gray-400 truncate">
                          {ReplyData.attachments[0].name !== ""
                            ? ReplyData.attachments[0].name
                            : "File"}
                        </p>
                      )
                    )}
                  </div>

                  {/* Cancel button */}
                  <X
                    className="absolute w-4 h-4 top-2 right-2 hover:cursor-pointer text-gray-400 hover:text-white"
                    onClick={() => setReplyData(null)}
                  />
                </div>
              </div>
            )}
            <VoiceRecorder
              setShowVoiceRecorder={setShowVoiceRecorder}
              onSend={prepareAudioMsg}
              ReplyData={ReplyData}
              setReplyData={setReplyData}
            />
          </>
        ) : (
          <div className="flex items-end gap-3 w-full bg-[#1e2933] shadow-lg px-5 py-3">
            <div className="attachment-upload-box relative min-w-fit flex items-center justify-center">
              <button
                onMouseEnter={() => {
                  clearTimeout(HoverTimeout.current);

                  setShowEmojiPicker(false);
                  setShowGifPicker(false);

                  showItemTimeout.current = setTimeout(() => {
                    setShowAddAttcahment(true);
                  }, 200);
                }}
                onMouseLeave={() => {
                  clearTimeout(showItemTimeout.current);
                  HoverTimeout.current = setTimeout(() => {
                    setShowAddAttcahment(false);
                  }, 700);
                }}
                className="text-gray-300 min-h-[48px] flex justify-center items-center hover:text-white"
                disabled={isSending}
              >
                <Plus
                  className={`w-7 h-7 ${
                    ShowAddAttcahment ? "bg-[#212933]" : null
                  } hover:bg-[#212933] rounded-full`}
                />
              </button>
              {ShowAddAttcahment && (
                <div
                  className="absolute p-2 -top-2 z-50 -translate-y-full flex-nowrap left-0 min-w-fit text-nowrap flex-col rounded-xl bg-[#2b313a]"
                  onMouseEnter={() => {
                    clearTimeout(HoverTimeout.current);
                  }}
                  onMouseLeave={() => setShowAddAttcahment(false)}
                >
                  <li
                    onClick={() => triggerFileInput("image")}
                    className="px-2 py-3 flex justify-start gap-2 rounded-xl min-w-fit list-none hover:bg-[#24282e] hover:cursor-pointer"
                  >
                    <Image className="w-5" /> Upload Photo
                  </li>
                  <li
                    onClick={() => triggerFileInput("video")}
                    className="px-2 py-3 flex justify-start gap-2 rounded-xl min-w-fit list-none hover:bg-[#24282e] hover:cursor-pointer"
                  >
                    <Video className="w-5" /> Upload Video
                  </li>
                  <li
                    onClick={() => triggerFileInput("audio")}
                    className="px-2 py-3 flex justify-start gap-2 rounded-xl min-w-fit list-none hover:bg-[#24282e] hover:cursor-pointer"
                  >
                    <AudioLines className="w-5" /> Upload Audio
                  </li>
                  <li
                    onClick={() => triggerFileInput("document")}
                    className="px-2 py-3 flex justify-start gap-2 rounded-xl min-w-fit list-none hover:bg-[#24282e] hover:cursor-pointer"
                  >
                    <File className="w-5" /> Upload Document
                  </li>
                </div>
              )}
            </div>

            {["image", "video", "audio", "document"].map((type) => (
              <input
                key={type}
                ref={fileInputRefs[type]}
                type="file"
                accept={
                  type === "image"
                    ? "image/*"
                    : type === "video"
                      ? "video/*"
                      : type === "audio"
                        ? "audio/*"
                        : ".pdf,.doc,.docx,.txt,.zip,.rar,.7z,.xlsx,.xls,.csv,.js,.jsx,.ts,.tsx,.html,.css,.json,.xml,.py,.java,.cpp,.c"
                }
                onChange={(e) => handleFileChange(e, type)}
                className="hidden"
                disabled={isSending}
              />
            ))}

            <button
              onMouseEnter={() => {
                clearTimeout(HoverTimeout.current);

                setShowAddAttcahment(false);
                setShowGifPicker(false);
                showItemTimeout.current = setTimeout(() => {
                  setShowEmojiPicker(true);
                }, 200);
              }}
              onMouseLeave={() => {
                clearTimeout(showItemTimeout.current);
                HoverTimeout.current = setTimeout(() => {
                  setShowEmojiPicker(false);
                }, 700);
              }}
              className="text-gray-300 min-h-[48px] flex justify-center items-center hover:text-white"
              disabled={isSending}
            >
              <Smile className="w-7 h-7" />
            </button>
            <button
              onMouseEnter={() => {
                clearTimeout(HoverTimeout.current);
                setShowAddAttcahment(false);
                setShowEmojiPicker(false);
                showItemTimeout.current = setTimeout(() => {
                  setShowGifPicker(true);
                }, 200);
              }}
              onMouseLeave={() => {
                clearTimeout(showItemTimeout.current);
                HoverTimeout.current = setTimeout(() => {
                  setShowGifPicker(false);
                }, 700);
              }}
              className="text-gray-300 min-h-[48px] flex justify-center items-center hover:text-white"
              disabled={isSending}
            >
              <Sticker className="w-7 h-7" />
            </button>

            <div className="flex flex-col flex-1 rounded-2xl overflow-hidden bg-[#2a3942]">
              <div className="attachment-preview flex flex-col">
                {ReplyData && (
                  <div className="reply-div-box p-2 relative">
                    <div className="reply-div w-full h-auto px-3 py-2 bg-[#1e262b] border-l-4 border-green-500 rounded-md flex gap-3 items-start">
                      {/* Attachment preview (if replying to attachment) */}
                      {ReplyData.attachments?.length === 1 && (
                        <div className="w-12 h-12 min-w-12 rounded-md overflow-hidden bg-[#2a3942] flex items-center justify-center">
                          {ReplyData.attachments[0].mimeType.includes(
                            "image",
                          ) && (
                            <img
                              src={
                                ReplyData.attachments[0].localUrl ||
                                ReplyData.attachments[0].cloudinaryUrl
                              }
                              alt="attachment"
                              className="w-full h-full object-cover"
                            />
                          )}

                          {(ReplyData.attachments[0].mimeType.includes(
                            "audio",
                          ) ||
                            ReplyData.attachments[0].mimeType.includes(
                              "webm",
                            )) && <Music className="text-blue-400 w-5 h-5" />}

                          {ReplyData.attachments[0].type.includes(
                            "document",
                          ) && <FileText className="text-white w-5 h-5" />}

                          {ReplyData.attachments[0].type.includes("video") &&
                            !ReplyData.attachments[0].type.includes(
                              "video",
                            ) && (
                              <FileImage className="text-purple-400 w-5 h-5" />
                            )}
                        </div>
                      )}

                      {/* Text or File Name */}
                      <div className="flex-1">
                        <p className="text-green-300 flex gap-1 font-medium">
                          <p>Repling to - </p>
                          {ReplyData.senderId === user._id
                            ? "Yourself"
                            : members.find(
                                (m) => m.userId === ReplyData.senderId,
                              ).name}
                        </p>

                        {ReplyData.type === "textonly" ||
                        (ReplyData.type === "mixed" && ReplyData.text) ? (
                          <p className="text-sm opacity-60 text-ellipsis whitespace-nowrap overflow-hidden">
                            {ReplyData.text}
                          </p>
                        ) : (
                          ReplyData.attachments?.length === 1 && (
                            <p className="text-sm text-gray-400 truncate">
                              {ReplyData.attachments[0].name !== ""
                                ? ReplyData.attachments[0].name
                                : "File"}
                            </p>
                          )
                        )}
                      </div>

                      {/* Cancel button */}
                      <X
                        className="absolute w-4 h-4 top-2 right-2 hover:cursor-pointer text-gray-400 hover:text-white"
                        onClick={() => setReplyData(null)}
                      />
                    </div>
                  </div>
                )}

                {editingData && (
                  <div className="reply-div-box p-2 relative">
                    <div className="rounded bg-[#1e262b] p-2">
                      <p className="text-gray-300 flex gap-1 items-center justify-start">
                        Original message <ArrowDownIcon size={16} />{" "}
                      </p>
                      <p className="text-gray-400">
                        {editingData.text.length > 0
                          ? editingData.text
                          : "no text added previously"}
                      </p>
                      <X
                        className="absolute w-4 h-4 top-2 right-2 hover:cursor-pointer text-gray-400 hover:text-white"
                        onClick={() => setEditingData(null)}
                      />
                    </div>
                  </div>
                )}

                {/* Enhanced File Preview */}
                {previewAttachments.length > 0 && (
                  <div className="file-preview-container p-3 bg-[#1e262b]">
                    <div className="flex gap-3 overflow-x-auto custom-scrollbar">
                      {previewAttachments.map((attachment) =>
                        renderFilePreview(attachment),
                      )}
                    </div>
                  </div>
                )}
              </div>

              <input
                type="text"
                placeholder="Type your message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSending}
                className="flex-1 max-h-[48px] rounded-2xl px-5 py-3 bg-[#2a3942] text-white placeholder-gray-400 focus:outline-none text-base shadow-none"
                style={{ minWidth: 0 }}
              />
            </div>

            {!text.trim() && previewAttachments.length === 0 && !editingData ? (
              <button
                onClick={handleMicClick}
                className="relative w-11 h-11 rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50 bg-gradient-to-r from-green-500 to-green-600 shadow-lg shadow-green-500/30 focus:ring-green-400"
              >
                <div className="absolute inset-2 rounded-full flex items-center justify-center">
                  <Mic size={28} className="text-white" />
                </div>
              </button>
            ) : editingData ? (
              <button
                onClick={() =>
                  handleEditMessage({ newText: text, setText: setText })
                }
                disabled={!text.trim() || isSending}
                className={`p-3 rounded-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white shadow`}
              >
                {isSending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Edit2 className="h-5 w-5" />
                )}
              </button>
            ) : (
              <button
                onClick={() =>
                  handleSendMessage({ text: text, setText: setText })
                }
                disabled={
                  (!text.trim() && previewAttachments.length === 0) || isSending
                }
                className={`p-3 rounded-full flex items-center justify-center shadow ${
                  (!text.trim() && attachments.length === 0) || isSending
                    ? "bg-[#3a4651] text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isSending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
        )}

        <div
          className={`absolute ${
            showEmojiPicker ? "block" : "hidden"
          } bottom-20  left-8 bl z-50`}
          onMouseEnter={() => {
            clearTimeout(HoverTimeout.current);
            preloadEmojiPicker();
          }}
          onMouseLeave={() => setShowEmojiPicker(false)}
        >
          <LazyEmojiPicker
            theme="dark"
            onEmojiClick={(e) => setText((prev) => prev + e.emoji)}
          />
        </div>

        {showGifPicker && (
          <div
            className="absolute bottom-20 left-8 z-50"
            onMouseEnter={() => {
              clearTimeout(HoverTimeout.current);
            }}
            onMouseLeave={() => setShowGifPicker(false)}
          >
            <GifStickerPicker theme="dark" onSelect={handleSendGif} />
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(ChatSender);
