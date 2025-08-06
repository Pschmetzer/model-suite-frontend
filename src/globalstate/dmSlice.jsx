import { createSlice } from "@reduxjs/toolkit";
import socket from "../utils/socket";

const initialState = {
  conversations: [
    {
      convoId: "",
      type: "dm",
      members: [],
      createdBy: {},
      createdAt: "",
      messages: [],
      hasMoreOlder: null,
      hasMoreNewer: null,
      isLoading: true,
    },
  ],
  isLoading: true,
};

const dmSlice = createSlice({
  name: "dm",
  initialState,
  reducers: {
    setAllDmCoversations: (state, action) => {
      state.conversations = action.payload;
      state.isLoading = false;
    },
    addNewDmconversation: (state, action) => {
      state.conversations.push(action.payload[0]);
      action.payload[0].members.forEach((m) => {
        if (m.userId !== action.payload[1]) {
          socket.emit("fetch_user_status", [m.userId]);
        }
      });
    },
    addNewDmMessage: (state, action) => {
      const conversation = state.conversations.find(
        (c) => c.convoId == action.payload.convoId,
      );
      conversation.messages.push(action.payload);
    },
    setMessageSent: (state, action) => {
      const conversation = state.conversations.find(
        (c) => c.convoId == action.payload.convoId,
      );
      const message = conversation.messages.find(
        (m) => m._id === action.payload._id,
      );
      message.status = "sent";
    },
    setTyping: (state, action) => {
      const conversation = state.conversations.find(
        (c) => c.convoId == action.payload.convoId,
      );
      const member = conversation.members.find(
        (m) => m.userId === action.payload.userId,
      );
      member.status.isTyping = action.payload.state;
    },
    updateUserStatus: (state, action) => {
      const statusMap = new Map();
      action.payload.forEach((s) => {
        statusMap.set(s.userId, {
          isOnline: s.isOnline,
          lastOnline: s.lastOnline,
        });
      });

      state.conversations.forEach((convo) => {
        convo.members.forEach((member) => {
          if (statusMap.has(member.userId)) {
            const updatedValues = statusMap.get(member.userId);
            member.status = { ...member.status, ...updatedValues };
          }
        });
      });
    },
    setMessageSeen: (state, action) => {
      const { convoId, messageId } = action.payload;
      const conversation = state.conversations.find(
        (c) => c.convoId === convoId,
      );

      if (!conversation || !conversation.messages) return;

      const message = conversation.messages.find((m) => m._id === messageId);
      if (message) {
        message.status = "seen";
      }
    },
    addOlderMessages: (state, action) => {
      const { convoId, messages, hasMoreOlder } = action.payload;
      const convo = state.conversations.find((c) => c.convoId === convoId);
      if (convo) {
        convo.messages = [...messages, ...convo.messages]; // prepend
        convo.hasMoreOlder = hasMoreOlder;
      }
    },
    addNewerMessages: (state, action) => {
      const { convoId, messages, hasMoreNewer } = action.payload;
      const convo = state.conversations.find((c) => c.convoId === convoId);
      if (convo) {
        convo.messages = [...convo.messages, ...messages]; // append
        convo.hasMoreNewer = hasMoreNewer;
      }
    },
    addSpecificMessages: (state, action) => {
      const { convoId, messages } = action.payload;
      const convo = state.conversations.find((c) => c.convoId === convoId);
      if (convo) {
        convo.messages = messages; // replace
        convo.hasMoreNewer = true;
        convo.hasMoreOlder = true;
      }
    },
    removeFailedMessage: (state, action) => {
      const { convoId, messageId } = action.payload;
      const convo = state.conversations.find((c) => c.convoId === convoId);
      const filteredConvoMessages = convo.messages.filter(
        (m) => m._id !== messageId,
      );
      convo.messages = filteredConvoMessages;
    },
    updateUploadForFile: (state, action) => {
      const { convoId, messageId, attachmentData } = action.payload;
      const convo = state.conversations.find((c) => c.convoId === convoId);
      if (!convo) return;

      const message = convo.messages.find((m) => m._id === messageId);
      if (!message) return;

      const attachment = message.attachments.find(
        (a) => a.fileId === attachmentData.fileId,
      );
      if (attachment) {
        attachment.status = attachmentData.status;
        attachment.progress = attachmentData.progress;
        attachment.duration = attachmentData.duration || 0;
        attachment.cloudinaryUrl = attachmentData.cloudinaryUrl;
        attachment.publicId = attachmentData.publicId;
      }
    },
    addNewReaction: (state, action) => {
      const { convoId, messageId, reactions } = action.payload;

      const convo = state.conversations.find((c) => c.convoId === convoId);
      if (!convo) return;

      const message = convo.messages.find((m) => m._id === messageId);
      if (!message) return;

      message.reactions = reactions;
    },
    removeReaction: (state, action) => {
      const { convoId, messageId, userId } = action.payload;
      const convo = state.conversations.find((c) => c.convoId === convoId);
      if (!convo) return;

      const message = convo.messages.find((m) => m._id === messageId);
      if (!message) return;

      message.reactions = message.reactions.filter(
        (r) => !(r.userId === userId),
      );
    },
    editMessage: (state, action) => {
      const convo = state.conversations.find(
        (c) => c.convoId === action.payload.convoId,
      );
      if (!convo) return;

      const message = convo.messages.find(
        (m) => m._id === action.payload.messageId,
      );
      if (!message) return;

      // Determine new type based on updated text and existing attachments
      const hasText = action.payload.newText.trim().length > 0;
      const hasAttachments =
        message.attachments && message.attachments.length > 0;

      let newType = "textonly";
      if (hasText && hasAttachments) newType = "mixed";
      else if (!hasText && hasAttachments) newType = "attachmentonly";
      else if (hasText && !hasAttachments) newType = "textonly";

      console.log(newType);
      message.text = action.payload.newText;
      message.type = newType;
      message.edited = true;
    },
    updatePinnedStatus: (state, action) => {
      const convo = state.conversations.find(
        (c) => c.convoId === action.payload.convoId,
      );
      if (!convo) return;

      const message = convo.messages.find(
        (m) => m._id === action.payload.messageId,
      );
      if (message) {
        message.pinned = action.payload.pinned;
      }
      if (action.payload.pinned) {
        convo.pinnedMessages.push(message);
      } else {
        convo.pinnedMessages = convo.pinnedMessages?.filter(
          (m) => m._id !== action.payload.messageId,
        );
      }
    },
    updatePinnedMessagesList: (state, action) => {
      const convo = state.conversations.find(
        (c) => c.convoId === action.payload.convoId,
      );
      if (!convo) return;
      convo.pinnedMessages = action.payload.pinnedMessages;
    },
    deleteMessage: (state, action) => {
      const { userId, messageId, convoId, typeOfDelete } = action.payload;
      const convo = state.conversations.find((c) => c.convoId === convoId);
      if (!convo) return;
      const message = convo.messages.find((m) => m._id === messageId);
      if (!message) return;

      if (typeOfDelete === "forMe") {
        message.deletedFor.push(userId);
        console.log("its deleted");
      } else if (typeOfDelete === "forAll") {
        message.deletedFor = ["everyone"];
      }
    },
  },
});

export const {
  deleteMessage,
  updatePinnedMessagesList,
  updatePinnedStatus,
  editMessage,
  removeReaction,
  addNewReaction,
  updateUploadForFile,
  removeFailedMessage,
  addOlderMessages,
  setMessageSeen,
  updateUserStatus,
  setTyping,
  setMessageSent,
  addNewDmMessage,
  setAllDmCoversations,
  addNewDmconversation,
  addNewerMessages,
  addSpecificMessages,
} = dmSlice.actions;
export default dmSlice.reducer;
