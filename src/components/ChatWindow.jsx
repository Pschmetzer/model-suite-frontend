import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useId,
} from "react";
import {
  Send,
  Loader2,
  Smile,
  ChevronLeft,
  Info,
  Loader,
  ChevronDown,
  Pin,
  File,
  Settings,
  Search,
  LogOut,
} from "lucide-react";
import Picker from "emoji-picker-react";
import { useDispatch, useSelector } from "react-redux";
import {
  formateTime,
  scrollIntoViewMsg,
  useScrollToMsg,
} from "../utils/functions";
import TypingIndicator from "./ui/TypingIndicator";
import socket from "../utils/socket";
import {
  addNewDmMessage,
  addNewerMessages,
  addNewReaction,
  addOlderMessages,
  addSpecificMessages,
  deleteMessage,
  editMessage,
  removeFailedMessage,
  removeReaction,
  setMessageSeen,
  updatePinnedStatus,
  updateUploadForFile,
} from "../globalstate/dmSlice";
import { ObjectId } from "bson";
import ChatMessage from "./ui/ChatMessage";
import axios from "axios";
import { throttle } from "lodash";
import { MessageContextMenu } from "./ui/MessageContextMenu";
import ChatSender from "./ui/ChatSender";
import MessageList from "./ui/MessageList";
import PinnedMessagesUI from "./ui/PinnedMessageUI";
import MessageSearcher from "./ui/MessageSearcher";
import MediaGallery from "./ui/MediaGallery";

const ChatWindow = ({ type, convoId, onBack }) => {
  const user = JSON.parse(localStorage.getItem("auth"))?.user;
  const dispatch = useDispatch();
  let lastDate = null;
  const conversation = useSelector((state) =>
    state[type]?.conversations?.find((c) => c.convoId == convoId),
  );

  // Memoize messages to prevent unnecessary recalculations
  const messages = useMemo(() => {
    return conversation?.messages || [];
  }, [conversation?.messages, conversation?.convoId]); // More specific deps

  // Memoize members
  const members = useMemo(
    () => conversation?.members || [],
    [conversation?.members],
  );
  const dmOpponent = members.find((m) => m.userId !== user._id);

  // State & refs
  const [expandedMessages, setExpandedMessages] = useState({});
  const [showDetails, setShowDetails] = useState(false);
  const messagesEndRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const [isNearBottom, setIsNearBottom] = useState(true);
  // Global audio tracker
  const activeAudios = new Set();

  const isLoading = false;
  const [isFetchingMoreOlder, setIsFetchingMoreOlder] = useState(false);
  const [isFetchingMoreNewer, setIsFetchingMoreNewer] = useState(false);
  const [isFetchingSpecific, setIsFetchingSpecific] = useState(false);
  const isInitialLoad = useRef(true);
  const hasMoreOlder = conversation?.hasMoreOlder;
  const hasMoreNewer = conversation?.hasMoreNewer;
  const containerRef = useRef(null);
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const token = JSON.parse(localStorage.getItem("auth"))?.token;
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    message: null,
    isOwn: null,
  });
  const [ReplyData, setReplyData] = useState(null);
  const [editingData, setEditingData] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const messageRef = useRef(null);
  const [attachments, setAttachments] = useState([]);
  const [previewAttachmentsIds, setPreviewAttachmentsIds] = useState([]);
  const [showMessageSearcher, setShowMessageSearcher] = useState(false);

  const scrollToMsg = useScrollToMsg();

  // New refs for preventing duplicates and managing scroll
  const lastFetchTimestamp = useRef(null);
  const isScrollingProgrammatically = useRef(false);
  const fetchCooldown = useRef(false);
  const scrollStateRef = useRef();

  // Enhanced fetchOlderDmMessages with duplicate prevention and smooth scrolling
  const fetchOlderDmMessages = useCallback(async () => {
    if (
      !containerRef.current ||
      isFetchingMoreOlder ||
      !messages.length ||
      !hasMoreOlder
    ) {
      return;
    }

    // Prevent rapid successive calls
    if (fetchCooldown.current) return;
    fetchCooldown.current = true;
    setTimeout(() => {
      fetchCooldown.current = false;
    }, 1000);

    const el = containerRef.current;
    const oldestMessage = messages[0];
    const oldestTimestamp = new Date(oldestMessage.createdAt).toISOString();

    // Prevent duplicate requests with same timestamp
    if (lastFetchTimestamp.current === oldestTimestamp) {
      return;
    }
    lastFetchTimestamp.current = oldestTimestamp;

    // Step 1: Show loader immediately
    setIsFetchingMoreOlder(true);

    // Step 2: Wait for loader to render, then calculate positions
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Now loader is rendered and included in scroll calculations
          const prevScrollHeight = el.scrollHeight;
          const prevScrollTop = el.scrollTop;

          // Store these values for later use
          scrollStateRef.current = {
            prevScrollHeight,
            prevScrollTop,
          };

          resolve();
        });
      });
    });

    // Temporarily disable interactions and smooth scrolling
    el.style.pointerEvents = "none";
    el.style.touchAction = "none";
    el.style.scrollBehavior = "auto";
    isScrollingProgrammatically.current = true;

    try {
      const res = await axios.get(
        `${baseURL}/messanger/dm/fetchOlderDmMessages?convoId=${convoId}&oldestTimestamp=${oldestTimestamp}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        },
      );

      const { messages: newMessages, hasMoreOlder: newhasMoreOlder } = res.data;

      if (newMessages && newMessages.length > 0) {
        // Client-side duplicate check as backup
        const existingMessageIds = new Set(
          messages.map((msg) => msg.id || msg._id),
        );
        const uniqueNewMessages = newMessages.filter(
          (msg) => !existingMessageIds.has(msg.id || msg._id),
        );

        if (uniqueNewMessages.length > 0) {
          // Dispatch new messages
          dispatch(
            addOlderMessages({
              convoId,
              messages: uniqueNewMessages,
              hasMoreOlder: newhasMoreOlder,
            }),
          );

          // Wait for DOM updates with new messages (loader will disappear)
          await new Promise((resolve) => {
            requestAnimationFrame(() => {
              const { prevScrollHeight, prevScrollTop } =
                scrollStateRef.current;
              const newScrollHeight = el.scrollHeight;
              const heightDifference = newScrollHeight - prevScrollHeight;

              // Maintain visual scroll position
              const newScrollTop = prevScrollTop + heightDifference;
              el.scrollTop = Math.max(newScrollTop, 50); // Keep some buffer from top
              resolve();
            });
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch older messages:", err);
      // Reset timestamp on error to allow retry
      lastFetchTimestamp.current = null;
    } finally {
      // Always restore interaction state
      el.style.pointerEvents = "";
      el.style.touchAction = "";
      el.style.scrollBehavior = "smooth";
      isScrollingProgrammatically.current = false;
      setIsFetchingMoreOlder(false);
    }
  }, [
    convoId,
    token,
    messages,
    hasMoreOlder,
    isFetchingMoreOlder,
    dispatch,
    baseURL,
  ]);

  // Enhanced fetchNewerDmMessages with duplicate prevention and smooth scrolling
  const fetchNewerDmMessages = useCallback(async () => {
    if (
      !containerRef.current ||
      isFetchingMoreNewer ||
      !messages.length ||
      !hasMoreNewer
    ) {
      return;
    }

    // Prevent rapid successive calls
    if (fetchCooldown.current) return;
    fetchCooldown.current = true;
    setTimeout(() => {
      fetchCooldown.current = false;
    }, 1000);

    const el = containerRef.current;
    const NewestMessage = messages[messages.length - 1];
    const NewestTimestamp = new Date(NewestMessage.createdAt).toISOString();

    // Prevent duplicate requests with same timestamp
    if (lastFetchTimestamp.current === NewestTimestamp) {
      return;
    }
    lastFetchTimestamp.current = NewestTimestamp;

    // Step 1: Show loader immediately
    setIsFetchingMoreNewer(true);

    // Step 2: Wait for loader to render, then calculate positions
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Now loader is rendered and included in scroll calculations
          const prevScrollHeight = el.scrollHeight;
          const prevScrollTop = el.scrollTop;

          // Store these values for later use
          scrollStateRef.current = {
            prevScrollHeight,
            prevScrollTop,
          };

          resolve();
        });
      });
    });

    // Temporarily disable interactions and smooth scrolling
    el.style.pointerEvents = "none";
    el.style.touchAction = "none";
    el.style.scrollBehavior = "auto";
    isScrollingProgrammatically.current = true;

    try {
      const res = await axios.get(
        `${baseURL}/messanger/dm/fetchNewerDmMessages?convoId=${convoId}&newestTimestamp=${NewestTimestamp}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        },
      );

      const { messages: newMessages, hasMoreNewer: newHasMoreNewer } = res.data;

      if (newMessages && newMessages.length > 0) {
        // Client-side duplicate check as backup
        const existingMessageIds = new Set(
          messages.map((msg) => msg.id || msg._id),
        );
        const uniqueNewMessages = newMessages.filter(
          (msg) => !existingMessageIds.has(msg.id || msg._id),
        );

        if (uniqueNewMessages.length > 0) {
          // Dispatch new messages
          dispatch(
            addNewerMessages({
              convoId,
              messages: uniqueNewMessages,
              hasMoreNewer: newHasMoreNewer,
            }),
          );

          // Wait for DOM updates with new messages (loader will disappear)
          await new Promise((resolve) => {
            requestAnimationFrame(() => {
              const { prevScrollHeight, prevScrollTop } =
                scrollStateRef.current;
              const newScrollHeight = el.scrollHeight;
              const heightDifference = newScrollHeight - prevScrollHeight;

              // Maintain visual scroll position
              const newScrollTop = prevScrollTop + heightDifference;
              resolve();
            });
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch older messages:", err);
      // Reset timestamp on error to allow retry
      lastFetchTimestamp.current = null;
    } finally {
      // Always restore interaction state
      el.style.pointerEvents = "";
      el.style.touchAction = "";
      el.style.scrollBehavior = "smooth";
      isScrollingProgrammatically.current = false;
      setIsFetchingMoreNewer(false);
    }
  }, [
    convoId,
    token,
    messages,
    hasMoreNewer,
    isFetchingMoreNewer,
    dispatch,
    baseURL,
  ]);

  const fetchSpecificDmMessages = useCallback(
    async (messageId, convoId) => {
      console.log("inside fetch specific its:", isFetchingSpecific);
      if (
        !containerRef.current ||
        isFetchingMoreNewer ||
        isFetchingMoreOlder ||
        !messages.length ||
        isFetchingSpecific
      ) {
        return;
      }

      console.log("feching specific");

      // Prevent rapid successive calls
      if (fetchCooldown.current) return;
      fetchCooldown.current = true;
      setTimeout(() => {
        fetchCooldown.current = false;
      }, 1000);

      const el = containerRef.current;

      // Step 1: Show loader immediately
      setIsFetchingSpecific(true);

      // Step 2: Wait for loader to render, then calculate positions
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Now loader is rendered and included in scroll calculations
            const prevScrollHeight = el.scrollHeight;
            const prevScrollTop = el.scrollTop;

            // Store these values for later use
            scrollStateRef.current = {
              prevScrollHeight,
              prevScrollTop,
            };

            resolve();
          });
        });
      });

      // Temporarily disable interactions and smooth scrolling
      el.style.pointerEvents = "none";
      el.style.touchAction = "none";
      el.style.scrollBehavior = "auto";
      isScrollingProgrammatically.current = true;

      try {
        const res = await axios.get(
          `${baseURL}/messanger/dm/fetchSpecificDmMessages?convoId=${convoId}&messageId=${messageId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000,
          },
        );

        const { messages: newMessages } = res.data;

        if (newMessages && newMessages.length > 0) {
          // Client-side duplicate check as backup
          const existingMessageIds = new Set(
            messages.map((msg) => msg.id || msg._id),
          );
          const uniqueNewMessages = newMessages.filter(
            (msg) => !existingMessageIds.has(msg.id || msg._id),
          );

          if (uniqueNewMessages.length > 0) {
            // Dispatch new messages
            dispatch(
              addSpecificMessages({
                convoId,
                messages: uniqueNewMessages,
              }),
            );
          }
        }
      } catch (err) {
        console.error("Failed to fetch older messages:", err);
        // Reset timestamp on error to allow retry
        lastFetchTimestamp.current = null;
      } finally {
        // Always restore interaction state
        el.style.pointerEvents = "";
        el.style.touchAction = "";
        el.style.scrollBehavior = "smooth";
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollIntoViewMsg(messageId);
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      isScrollingProgrammatically.current = false;
                      setIsFetchingSpecific(false);
                      console.log("now specific is false again");
                    });
                  });
                });
              });
            });
          });
        });
      }
    },
    [isFetchingSpecific],
  );

  // Enhanced scroll handler with better threshold detection
  // Replace isNearBottom state with ref

  const handleScroll = useCallback(
    throttle((e) => {
      if (!containerRef.current) return;

      const el = containerRef.current;
      const { scrollTop, scrollHeight, clientHeight } = el;

      // Use ref instead of state to avoid re-renders
      const nearBottom = scrollHeight - scrollTop - clientHeight < 100;

      if (isNearBottomRef.current !== nearBottom) {
        isNearBottomRef.current = nearBottom;
        setIsNearBottom(nearBottom);
      }

      const nearTop = scrollTop < 10;
      if (
        nearTop &&
        hasMoreOlder &&
        !isFetchingMoreOlder &&
        !isFetchingSpecific &&
        !isInitialLoad.current
      ) {
        fetchOlderDmMessages();
      }
      if (
        nearBottom &&
        hasMoreNewer &&
        !isFetchingMoreNewer &&
        !isFetchingSpecific
      ) {
        fetchNewerDmMessages();
      }
    }, 150),
    [
      hasMoreOlder,
      isFetchingMoreOlder,
      isFetchingMoreNewer,
      isFetchingSpecific,
    ], // Remove fetchOlderDmMessages from deps
  );

  const checkScrollPosition = (e) => {
    handleScroll(e);
  };

  const handleRightClick = (e, message, isOwn) => {
    e.preventDefault();
    console.log(message);
    if (
      message.deletedFor?.includes(user._id) ||
      message.deletedFor?.includes("everyone")
    )
      return;

    setContextMenu({
      isOpen: true,
      message,
      isOwn,
    });
  };
  const handleReactionsClick = (e, message, isOwn) => {
    e.preventDefault();

    setContextMenu({
      isOpen: true,
      message,
      isOwn,
      type: "reactionsList",
    });
  };

  const handleTouchStart = (e, message, isOwn) => {
    const timer = setTimeout(() => {
      setContextMenu({
        isOpen: true,
        message,
        isOwn,
      });

      // Add haptic feedback if supported
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms long press

    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleTouchMove = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const closeContextMenu = () => {
    setContextMenu({
      isOpen: false,
      message: null,
      isOwn: null,
    });
  };

  const uploadFilesToCloudinary = async (attachments, messageId, convoId) => {
    const formData = new FormData();

    attachments.forEach((attachment) => {
      formData.append("files", attachment.file);
      formData.append("fileIds", attachment.fileId);
    });

    try {
      const response = await fetch(
        `${baseURL}/messanger/chat/attachments/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Message-Id": messageId,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        attachments.forEach((a) => {
          dispatch(
            updateUploadForFile({
              convoId,
              messageId,
              attachmentData: {
                id: a.fileId,
                status: "error",
                progress: 100,
                cloudinaryUrl: null,
                publicId: null,
              },
            }),
          );
        });
        throw new Error("Upload failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalResults = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // Keep incomplete chunk

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const data = JSON.parse(line);

            if (data.type === "progress") {
              // optional: handle progress
            } else if (data.type === "complete") {
              setAttachments((prev) =>
                prev.filter((a) => a.fileId !== data.fileId),
              );
              dispatch(
                updateUploadForFile({
                  convoId,
                  messageId,
                  attachmentData: {
                    fileId: data.result.fileId,
                    status: "uploaded",
                    progress: data.progress,
                    duration: data.result.duration || 0,
                    cloudinaryUrl: data.result.url,
                    publicId: data.result.cloudinaryId,
                  },
                }),
              );
            } else if (data.type === "error") {
              dispatch(
                updateUploadForFile({
                  convoId,
                  messageId,
                  attachmentData: {
                    fileId: data.fileId,
                    status: "error",
                    progress: 100,
                    cloudinaryUrl: null,
                    publicId: null,
                  },
                }),
              );
            } else if (data.type === "finished") {
              finalResults = data.results || [];
              return data.results || [];
            }
          } catch (e) {
            console.error("Failed to parse upload event:", e, line);
          }
        }
      }
      return finalResults;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleSendMessage = async ({ messageId = null, text, setText }) => {
    if (!text.trim() && attachments.length === 0) return;

    if (type === "dm") {
      const opponent = members.find((m) => m.userId !== user._id);
      const tempId = new ObjectId().toString();

      let attachmentData;
      let messageData;

      if (messageId) {
        const existingMessage = messages.find((m) => m._id === messageId);
        messageData = existingMessage;
        attachmentData = existingMessage.attachments;
        dispatch(removeFailedMessage(convoId, messageId));
      } else {
        // Prepare attachments data for Redux (without file objects)
        const filteredAttachments = attachments.filter((a) =>
          previewAttachmentsIds.includes(a.fileId),
        );
        attachmentData = filteredAttachments.map((att) => ({
          fileId: att.fileId,
          file: att.file,
          type: att.type,
          name: att.name,
          size: att.size,
          width: att.naturalWidth || null,
          height: att.naturalHeight || null,
          localUrl: att.localUrl,
          thumbnailUrl: att.thumbnailUrl,
          mimeType: att.mimeType,
          status: "pending",
          progress: 0,
          cloudinaryUrl: null,
          error: null,
        }));

        const SafeAttachmentData = attachmentData.map((att) => {
          const { file, ...safeAtt } = att;
          return safeAtt;
        });

        messageData = {
          _id: tempId,
          convoId: convoId,
          senderId: user._id,
          receiverId: opponent.userId,
          senderName: user.fullName,
          text: text.trim(),
          type:
            attachments.length === 0
              ? "textonly"
              : attachments.length > 0 && !!text
                ? "mixed"
                : "attachmentonly",
          status: null,
          attachments: SafeAttachmentData,
          deletedFor: [],
          reactions: [],
          replyTo: ReplyData || null,
          createdAt: new Date().toISOString(),
        };
      }

      setPreviewAttachmentsIds([]);
      // Add message to Redux immediately

      dispatch(addNewDmMessage(messageData));

      requestAnimationFrame(() => {
        scrollToBottom();
      });

      // Clear input and attachments
      setText("");
      const pendingAttachments = attachmentData.filter(
        (a) => a.status === "pending" || a.status === "error",
      );
      const compeletedAttachments = attachmentData.filter(
        (a) => a.status === "uploaded",
      );
      setAttachments([]);
      setReplyData(null);

      try {
        if (pendingAttachments.length > 0) {
          // Upload files to Cloudinary
          const uploadedAttachments = await uploadFilesToCloudinary(
            pendingAttachments,
            tempId,
            convoId,
          );

          const allAttachments = [
            ...compeletedAttachments,
            ...uploadedAttachments,
          ];

          // Update message with uploaded attachment URLs
          const updatedMessageData = {
            ...messageData,
            status: null,
            attachments: allAttachments.map((att) => ({
              fileId: att.fileId,
              type: att.resourceType,
              name: att.originalName,
              size: att.size,
              mimeType: att.mimeType,
              cloudinaryUrl: att.url,
              publicId: att.cloudinaryId,
              duration: att.duration,
              width: att.width,
              height: att.height,
              status: "uploaded",
              progress: 100,
            })),
          };

          // Update Redux with final data

          // Emit socket event with uploaded files
          socket.emit("dm:send_message", updatedMessageData);
        } else {
          // No attachments, just emit the message
          socket.emit("dm:send_message", messageData);
        }
      } catch (error) {
        console.error("Message send failed:", error);

        // Update message status to error
      }
    }
  };

  const handleSendAudio = async (audioAttachment) => {
    if (type === "dm") {
      try {
        const opponent = members.find((m) => m.userId !== user._id);
        const tempId = new ObjectId().toString();
        const { file, ...safeAudioAtt } = audioAttachment;

        const AudiomessageData = {
          _id: tempId,
          convoId: convoId,
          senderId: user._id,
          receiverId: opponent.userId,
          senderName: user.fullName,
          text: "",
          type: "attachmentonly",
          status: null,
          attachments: [safeAudioAtt],
          reactions: [],
          replyTo: ReplyData?._id || null,
          createdAt: new Date().toISOString(),
        };

        setReplyData(null);
        dispatch(addNewDmMessage(AudiomessageData));

        requestAnimationFrame(() => {
          scrollToBottom();
        });

        const uploadedAudio = await uploadFilesToCloudinary(
          [audioAttachment],
          tempId,
          convoId,
        );

        const updatedAudioMessageData = {
          ...AudiomessageData,
          status: null,
          attachments: uploadedAudio.map((att) => ({
            fileId: att.fileId,
            type: att.resourceType,
            name: att.originalName,
            size: att.size,
            mimeType: att.mimeType,
            cloudinaryUrl: att.url,
            publicId: att.cloudinaryId,
            duration: att.duration,
            width: null,
            height: null,
            status: "uploaded",
            progress: 100,
          })),
        };

        socket.emit("dm:send_message", updatedAudioMessageData);
      } catch (err) {
        console.log(err);
      }
    }
  };

  const handleSendGif = (file) => {
    const tempId = new ObjectId().toString();
    const fileId = new ObjectId().toString();
    const opponent = members.find((m) => m.userId !== user._id);

    if (type == "dm") {
      const messageData = {
        _id: tempId,
        convoId: convoId,
        senderId: user._id,
        receiverId: opponent.userId,
        senderName: user.fullName,
        text: "",
        type: "attachmentonly",
        status: null,
        attachments: [
          {
            fileId: fileId,
            type: file.type,
            name: file.name,
            size: file.size,
            mimeType: file.type,
            cloudinaryUrl: file.url,
            publicId: file.id,
            width: file.width,
            height: file.height,
            status: "uploaded",
            progress: 100,
          },
        ],
        reactions: [],
        replyTo: ReplyData?._id || null,
        createdAt: new Date().toISOString(),
      };

      setReplyData(null);
      dispatch(addNewDmMessage(messageData));

      requestAnimationFrame(() => {
        scrollToBottom();
      });

      socket.emit("dm:send_message", messageData);
    }
  };

  const handleReact = (messageId, emoji) => {
    const userId = user._id;
    const avatar = members.find((m) => m.userId === user._id).avatar;
    const fullName = user.fullName ? user.fullName : user.agencyName;
    const message = messages.find((m) => m._id === messageId);

    // Create new reactions array
    const reactions = message.reactions.filter((r) => r.userId !== userId);
    reactions.push({ userId, avatar, fullName, emoji });

    // Optimistic update
    dispatch(addNewReaction({ convoId, messageId, reactions }));

    // Emit to server
    socket.emit("dm:add_reaction", {
      convoId,
      messageId,
      data: { userId, avatar, fullName, emoji },
    });
  };

  const handleRemoveReaction = (userId) => {
    const messageId = contextMenu.message._id;

    // Optimistic update
    dispatch(removeReaction({ convoId, messageId, userId }));

    // Emit to server
    socket.emit("dm:remove_reaction", {
      convoId,
      messageId,
      userId,
    });

    closeContextMenu();
  };

  const handleReply = (message) => {
    setEditingData(null);
    setReplyData(message);
  };

  const handleEdit = (message) => {
    setReplyData(null);
    setEditingData(message);
    console.log(editingData);
  };

  const handleEditMessage = ({ newText, setText }) => {
    const convoId = editingData.convoId;
    const messageId = editingData._id;
    const receiverId = dmOpponent.userId;
    dispatch(editMessage({ convoId, messageId, newText }));
    socket.emit("dm:edit_message", { convoId, messageId, receiverId, newText });
    setEditingData(null);
    setText("");
  };

  const handlePin = (messageId) => {
    const receiverId = dmOpponent.userId;
    dispatch(updatePinnedStatus({ convoId, messageId, pinned: true }));
    socket.emit("dm:update_message_pin", {
      convoId,
      messageId,
      receiverId,
      pinned: true,
    });
  };
  const handleUnPin = (messageId) => {
    const receiverId = dmOpponent.userId;

    dispatch(updatePinnedStatus({ convoId, messageId, pinned: false }));
    socket.emit("dm:update_message_pin", {
      convoId,
      messageId,
      receiverId,
      pinned: false,
    });
  };

  const handleCopyText = (messageId) => {
    console.log("Copy text:", messageId);
    // Implement copy logic
    const message = messages.find((msg) => msg._id === messageId);
    if (message && navigator.clipboard) {
      navigator.clipboard.writeText(message.content || message.text);
    }
  };

  const handleDelete = (messageId, typeOfDelete) => {
    dispatch(
      deleteMessage({ userId: user._id, messageId, convoId, typeOfDelete }),
    );
    socket.emit("dm:delete_message", {
      userId: user._id,
      receiverId: dmOpponent.userId,
      messageId,
      convoId,
      typeOfDelete,
    });
  };

  // Helper function to get formatted date label
  const getDateLabel = (msgDate, today, yesterday) => {
    if (msgDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (msgDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return msgDate.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  // Enhanced scroll to bottom that respects user intent
  const scrollToBottom = () => {
    const container = containerRef.current;
    setTimeout(() => {
      if (container) {
        // Fallback to scrollHeight
        container.scrollTop = container.scrollHeight;

        // Still attempt scrollIntoView for smoother animation
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({
              behavior: "auto",
              block: "nearest",
            });
          });
        });
      }
    }, 50);
  };

  // Auto-scroll effect for new messages (only when user is near bottom)
  useEffect(() => {
    if (
      isNearBottomRef.current &&
      messages.length > 0 &&
      !isScrollingProgrammatically.current
    ) {
      setTimeout(() => {
        requestAnimationFrame(() => {
          console.log("scrolling to bottom");
          scrollToBottom();
        });
      }, 80);
    }
  }, [messages.length]);

  useEffect(() => {
    let interval;
    interval = setInterval(() => {
      const nearTop = containerRef.current.scrollTop < 15;
      if (!nearTop) {
        isInitialLoad.current = false;
        clearInterval(interval);
      }
      console.log("running interval");
    }, 1000);
  }, [convoId]);

  // Reset fetch timestamp when conversation changes
  useEffect(() => {
    lastFetchTimestamp.current = null;
    fetchCooldown.current = false;
  }, [convoId]);

  useEffect(() => {
    console.log("it changed to :", isFetchingSpecific);
  }, [isFetchingSpecific]);

  const toggleReadMore = (index) =>
    setExpandedMessages((prev) => ({ ...prev, [index]: !prev[index] }));

  const handleMessageSeen = (msg) => {
    if (!msg || msg.senderId === user._id || msg.status === "seen") return;

    socket.emit("dm:message_seen", {
      convoId: convoId,
      messageId: msg._id,
    });

    dispatch(setMessageSeen({ convoId, messageId: msg._id }));
  };

  // Header components (keeping original)
  const DMHeader = () => {
    const opponent = members.find((m) => m.userId !== user._id);
    const chatLogo = opponent.avatar;
    const chatName = opponent.name;
    const status = opponent.status;
    const [showMoreOptions, setShowMoreOPtions] = useState(false);
    return (
      <div
        className="flex w-full items-center gap-3 px-8 py-4 bg-[#232e3c] border-b border-[#232e3c] relative cursor-pointer"
        onClick={() => setShowDetails(true)}
      >
        <button
          className="mr-4 text-gray-400 hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
        <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex justify-center items-center">
          {chatLogo ? (
            <img
              src={chatLogo}
              alt="chat logo"
              className="w-full h-full object-cover"
            />
          ) : (
            chatName?.[0]?.toUpperCase() || "U"
          )}
        </div>
        <div className="flex flex-col">
          <div className="font-semibold text-white text-lg">{chatName}</div>
          <p className="text-xs text-gray-400 mt-0">
            {status.isTyping ? (
              <TypingIndicator />
            ) : status.isOnline ? (
              <span className="text-green-500 tracking-wider font-bold">
                {" "}
                ● online
              </span>
            ) : status.lastOnline ? (
              `Last online: ${formateTime(status.lastOnline)}`
            ) : (
              "Direct Messages"
            )}
          </p>
        </div>
        <div className="menu-options relative flex gap-4 items-center ml-auto">
          <Search
            className={` w-8 h-8 text-gray-400 hover:text-blue-400 hover:bg-gray-700 p-1 rounded-full ${
              showMessageSearcher && "bg-gray-700"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setShowMessageSearcher(true);
            }}
          />
          <Settings
            className={`w-8 h-8 text-gray-400  hover:text-blue-400 hover:rotate-180 duration-500 hover:bg-gray-700 p-1 rounded-full ${
              showMoreOptions && "bg-gray-700"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setShowMoreOPtions((prev) => !prev);
            }}
          />
          {showMoreOptions && (
            <div className="absolute w-fit -bottom-1 right-0 translate-y-full z-50 flex flex-col gap-1 rounded p-3 bg-gray-700">
              <button className=" flex gap-1 hover:cursor-pointer hover:bg-gray-800 px-3 py-2 rounded">
                <Info
                  className="w-5 h-5 text-gray-400 "
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails(true);
                  }}
                />{" "}
                Details
              </button>
              <button className=" flex gap-1 hover:cursor-pointer hover:bg-gray-800 px-3 py-2 rounded">
                <LogOut
                  className="w-5 h-5 text-gray-400 "
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                />{" "}
                Leave
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const GroupHeader = () => {
    return (
      <div
        className="flex items-center gap-3 px-8 py-5 bg-[#232e3c] border-b border-[#232e3c] relative cursor-pointer"
        onClick={() => setShowDetails(true)}
      >
        <button
          className="mr-4 text-gray-400 hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
        <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex justify-center items-center">
          {/* chatLogo and chatName are not defined in this scope - need to be passed from props or state */}
          G
        </div>
        <div className="flex flex-col">
          <div className="font-semibold text-white text-lg">Group Chat</div>
          <p className="text-xs text-gray-400 mt-1">Group Chat</p>
        </div>
        <Info className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-400" />
      </div>
    );
  };

  const ChannelHeader = () => {
    return (
      <div
        className="flex items-center gap-3 px-8 py-5 bg-[#232e3c] border-b border-[#232e3c] relative cursor-pointer"
        onClick={() => setShowDetails(true)}
      >
        <button
          className="mr-4 text-gray-400 hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
        <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex justify-center items-center">
          C
        </div>
        <div className="flex flex-col">
          <div className="font-semibold text-white text-lg">Channel</div>
          <p className="text-xs text-gray-400 mt-1">Channel</p>
        </div>
        <Info className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-400" />
      </div>
    );
  };

  // Info slider components (keeping original structure)

  const DMInfoSlider = () => {
    const [showMediaGallery, setShowMediaGallery] = useState(false);

    const opponent = members?.find((m) => m.userId !== user._id);
    const avatar = opponent?.avatar;
    const name = opponent?.name || "Unknown";
    const status = opponent?.status;
    const createdAtFormatted = formateTime(conversation.createdAt);

    const handleCloseMediaGallery = () => {
      setShowMediaGallery(false);
    };

    return (
      <div
        className={`absolute top-0 right-0 h-full flex flex-col overflow-hidden max-h-full   w-[40%] bg-[#10161f] shadow-2xl z-40 transition-transform duration-300 ${
          showDetails ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-800 px-6 py-5 flex items-center justify-between">
          <div className="text-xl font-bold text-white">
            {showMediaGallery ? "Shared Media" : "Chat Info"}
          </div>
          <button
            className="text-white hover:text-gray-100"
            onClick={() => {
              if (showMediaGallery) {
                setShowMediaGallery(false);
              } else {
                setShowDetails(false);
              }
            }}
          >
            <ChevronLeft className="w-7 h-7 rotate-180" />
          </button>
        </div>

        {/* Content */}
        {showMediaGallery ? (
          <div className="flex-1 overflow-hidden">
            <MediaGallery
              convoId={convoId}
              onMediaClick={scrollToMsg}
              onClose={handleCloseMediaGallery}
              onCloseDetails={() => setShowDetails(false)}
              fetchSpecificDmMessages={fetchSpecificDmMessages}
            />
          </div>
        ) : (
          <div className="h-full flex flex-col overflow-auto">
            {/* Profile Section */}
            <div className="p-6 flex flex-col items-center text-white">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-700 shadow-lg mb-3">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-4xl font-bold">
                    {name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
              <div className="text-xl font-semibold">{name}</div>

              <div className="text-sm text-gray-400 mt-1">
                {status?.isTyping ? (
                  <TypingIndicator />
                ) : status?.isOnline ? (
                  <span>Online</span>
                ) : status?.lastOnline ? (
                  `Last seen: ${formateTime(status.lastOnline)}`
                ) : (
                  "Offline"
                )}
              </div>

              <div className="mt-6 text-center text-sm text-gray-400">
                <p>Chat started on</p>
                <p className="text-white font-medium">{createdAtFormatted}</p>
              </div>
            </div>

            {/* Actions Section */}
            <div className="px-6 mb-6">
              <div className="space-y-3">
                <button className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-left transition-colors">
                  Notifications
                </button>
                <button className="w-full p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-left transition-colors">
                  Block User
                </button>
                <button className="w-full p-3 bg-red-600 hover:bg-red-700 rounded-lg text-white text-left transition-colors">
                  Delete Chat
                </button>
              </div>
            </div>

            {/* Media Gallery Trigger */}
            <div className="flex-1 px-6">
              <button
                onClick={() => setShowMediaGallery(true)}
                className="w-full p-4 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 rounded-lg text-white text-center transition-all duration-200 transform hover:scale-105"
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="font-semibold">View Shared Media</span>
                  <ChevronLeft className="w-5 h-5 rotate-180" />
                </div>
                <div className="text-sm opacity-75 mt-1">
                  Photos, videos, files & more
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const GroupInfoSlider = () => {
    return (
      <div
        className={`absolute top-0 right-0 h-full w-[400px] bg-[#181f29] shadow-2xl z-40 transition-transform duration-300 ${
          showDetails ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
          <div className="text-xl font-bold text-white">Group Details</div>
          <button
            className="text-gray-400 hover:text-white"
            onClick={() => setShowDetails(false)}
          >
            <ChevronLeft className="w-7 h-7 rotate-180" />
          </button>
        </div>
        <div className="p-6 text-gray-400">
          Placeholder group info content here...
        </div>
      </div>
    );
  };

  const ChannelInfoSlider = () => {
    return (
      <div
        className={`absolute top-0 right-0 h-full w-[400px] bg-[#181f29] shadow-2xl z-40 transition-transform duration-300 ${
          showDetails ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
          <div className="text-xl font-bold text-white">Channel Details</div>
          <button
            className="text-gray-400 hover:text-white"
            onClick={() => setShowDetails(false)}
          >
            <ChevronLeft className="w-7 h-7 rotate-180" />
          </button>
        </div>
        <div className="p-6 text-gray-400">
          Placeholder channel info content here...
        </div>
      </div>
    );
  };

  const renderHeader = () => {
    switch (type) {
      case "dm":
        return <DMHeader />;
      case "group":
        return <GroupHeader />;
      case "channel":
        return <ChannelHeader />;
      default:
        return null;
    }
  };

  const renderInfoSlider = () => {
    switch (type) {
      case "dm":
        return <DMInfoSlider />;
      case "group":
        return <GroupInfoSlider />;
      case "channel":
        return <ChannelInfoSlider />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full  w-full bg-[#222e35] text-white relative  overflow-hidden">
      {renderHeader()}
      {renderInfoSlider()}
      {/* Messages */}
      <div className="flex-1 px-0 py-0  h-max-[100%] scroll-smooth relative overflow-hidden   bg-contain bg-center  ">
        <PinnedMessagesUI
          pinnedMessages={conversation?.pinnedMessages || []}
          onUnpin={handleUnPin}
          scrollToMsg={scrollToMsg}
          fetchSpecificDmMessages={fetchSpecificDmMessages}
          convoId={convoId} // Pass convoId for fresh data fetching
        />
        <MessageSearcher
          isOpen={showMessageSearcher}
          onClose={() => setShowMessageSearcher(false)}
          convoId={convoId}
          fetchSpecificDmMessages={fetchSpecificDmMessages}
          scrollToMsg={scrollToMsg}
          baseURL={baseURL}
          token={token}
          type={type}
        />
        {isFetchingSpecific && (
          <div className="absolute flex items-center justify-center w-full h-full z-50 bg-[#000000af]">
            <Loader2 size={40} className="animate-spin" />
          </div>
        )}
        <div className="absolute inset-0 bg-[url(../public\chat-bg-dark.png)] bg-cover bg-center opacity-5 pointer-events-none z-0" />
        <div
          className="flex overflow-y-auto  h-full scroll-smooth  custom-scrollbar flex-col gap-1  w-full max-w-full"
          onScroll={() => checkScrollPosition()}
          ref={containerRef}
          style={{ minHeight: 0 }}
        >
          <MessageList
            messages={messages}
            user={user}
            type={type}
            convoId={convoId}
            fetchSpecificDmMessages={fetchSpecificDmMessages}
            scrollToMsg={scrollToMsg}
            hasMoreOlder={hasMoreOlder}
            hasMoreNewer={hasMoreNewer}
            expandedMessages={expandedMessages}
            toggleReadMore={toggleReadMore}
            handleMessageSeen={handleMessageSeen}
            handleRightClick={handleRightClick}
            handleSendMessage={handleSendMessage}
            handleTouchEnd={handleTouchEnd}
            handleTouchStart={handleTouchStart}
            handleTouchMove={handleTouchMove}
            messageRef={messageRef}
            isFetchingMoreOlder={isFetchingMoreOlder}
            isFetchingMoreNewer={isFetchingMoreNewer}
            isFetchingSpecific={isFetchingSpecific}
            activeAudios={activeAudios}
            handleReactionsClick={handleReactionsClick}
          />
          <MessageContextMenu
            isOpen={contextMenu.isOpen}
            onClose={closeContextMenu}
            message={contextMenu.message}
            isOwn={contextMenu.isOwn}
            containerRef={containerRef} // Pass the container reference
            // Context menu handlers
            onReact={handleReact}
            onReply={handleReply}
            onEdit={handleEdit}
            onPin={handlePin}
            onUnPin={handleUnPin}
            onCopyText={handleCopyText}
            onDelete={handleDelete}
            handleRemoveReaction={handleRemoveReaction}
            type={contextMenu?.type || "messageOptions"}
          />

          {isFetchingMoreNewer && (
            <div className="flex justify-center py-4">
              <Loader className="animate-spin text-blue-400" size={20} />
            </div>
          )}
          <div ref={messagesEndRef} className="mt-3" />
        </div>
        {!isNearBottom && (
          <div
            className="scrolltobottom flex items-center justify-center absolute bottom-4 right-5 w-11 h-11 shadow-lg rounded-full bg-green-600 hover:bg-green-700 hover:cursor-pointer active:scale-95"
            onClick={() => scrollToBottom()}
          >
            <ChevronDown className="w-8 h-8 inline-block" />
          </div>
        )}
      </div>
      {/* Input */}
      <ChatSender
        chatType={type}
        convoId={convoId}
        members={members}
        ReplyData={ReplyData}
        setReplyData={setReplyData}
        editingData={editingData}
        setEditingData={setEditingData}
        attachments={attachments}
        setAttachments={setAttachments}
        previewAttachmentsIds={previewAttachmentsIds}
        setPreviewAttachmentsIds={setPreviewAttachmentsIds}
        handleSendMessage={handleSendMessage}
        handleSendGif={handleSendGif}
        handleSendAudio={handleSendAudio}
        handleEditMessage={handleEditMessage}
      />
    </div>
  );
};

export default React.memo(ChatWindow);
