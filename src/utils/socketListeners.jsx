// src/components/SocketEventsListener.jsx
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  addNewDmconversation,
  addNewDmMessage,
  addNewReaction,
  deleteMessage,
  editMessage,
  setMessageSeen,
  setMessageSent,
  setTyping,
  updatePinnedStatus,
  updateUserStatus,
} from "../globalstate/dmSlice";

import socket from "./socket";

const SocketEventsListener = () => {
  const dispatch = useDispatch();
  const user = JSON.parse(localStorage.getItem("auth"))?.user;

  useEffect(() => {
    // DM: receive new message
    socket.on("dm:new_message", (message) => {
      dispatch(addNewDmMessage(message));
    });

    socket.on("dm:message_sent", (message) => {
      dispatch(setMessageSent(message));
    });

    socket.on("dm:set_typing", (data) => {
      dispatch(setTyping(data));
    });
    socket.on("update_user_status", (statusList) => {
      dispatch(updateUserStatus(statusList));
    });
    socket.on("dm:add_incoming_dm", (dmconversation) => {
      dispatch(addNewDmconversation([dmconversation, user._id]));
    });
    socket.on("dm:message_seen", (data) => {
      dispatch(
        setMessageSeen({ convoId: data.convoId, messageId: data.messageId }),
      );
    });
    socket.on("dm:new_reaction", (data) => {
      const { convoId, messageId, reactions } = data;
      dispatch(addNewReaction({ convoId, messageId, reactions }));
    });

    socket.on("dm:removed_reaction", ({ convoId, messageId, reactions }) => {
      dispatch(addNewReaction({ convoId, messageId, reactions }));
    });

    socket.on("dm:message_edited", ({ convoId, messageId, newText }) => {
      dispatch(editMessage({ convoId, messageId, newText }));
    });

    socket.on("dm:updated_message_pin", ({ convoId, messageId, pinned }) => {
      dispatch(updatePinnedStatus({ convoId, messageId, pinned }));
    });

    socket.on(
      "dm:message_deleted",
      ({ messageId, convoId, typeOfDelete, userId }) => {
        dispatch(deleteMessage({ messageId, convoId, typeOfDelete, userId }));
      },
    );

    // Cleanup on unmount
    return () => {
      socket.off("dm:new_message");
      socket.off("dm:message_sent");
      socket.off("dm:set_typing");
      socket.off("dm:update_user_status");
      socket.off("dm:add_incoming_dm");
      socket.off("dm:message_seen");
      socket.off("dm:dm:new_reaction");
      socket.off("dm:removed_reaction");
      socket.off("dm:message_edited");
      socket.off("dm:updated_message_pin");
      socket.off("dm:message_deleted");
    };
  }, [dispatch]);

  return null; // doesn't render anything
};

export default React.memo(SocketEventsListener);
