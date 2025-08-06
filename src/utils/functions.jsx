import dayjs from "dayjs";
import { useRef } from "react";

import React, { useEffect, useState, useCallback } from "react";

import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Send,
  RotateCcw,
} from "lucide-react";
import { useSelector } from "react-redux";

export function useTypingIndicator(socket, userId, delay = 1000) {
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false); // track current typing status

  const handleTyping = () => {
    // If not already typing, emit isTyping: true
    if (!isTypingRef.current) {
      socket.emit("typing", { userId, isTyping: true });
      isTypingRef.current = true;
    }

    // Clear existing timer
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Start new timer: after delay of no typing, send isTyping: false
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", { userId, isTyping: false });
      isTypingRef.current = false; // reset flag
      typingTimeoutRef.current = null; // cleanup
    }, delay);
  };

  return handleTyping;
}

export function formateTime(TimeString, type) {
  let formattedTimeString;

  if (!TimeString) return;

  const rawdate = dayjs(TimeString);

  if (type === "msg") {
    formattedTimeString = `${rawdate.format("h:mm A")}`;
    return formattedTimeString;
  }

  if (dayjs().isSame(rawdate, "day")) {
    formattedTimeString = `Today ${rawdate.format("h:mm A")}`;
  } else if (dayjs().subtract(1, "day").isSame(rawdate, "day")) {
    formattedTimeString = `Yesterday ${rawdate.format("h:mm A")}`;
  } else {
    formattedTimeString = rawdate.format("M/D/YYYY h:mm A"); // e.g., 6/12/2024 1:45 PM
  }
  return formattedTimeString;
}

export const formatActiveTime = (minutes) => {
  if (!minutes) return "0h";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

export function scrollIntoViewMsg(messageId, setIsFetchingSpecific) {
  const targetMessageParent = document.getElementById(`${messageId}`);
  const targetMessage = targetMessageParent?.firstElementChild;

  if (!targetMessage) {
    if (setIsFetchingSpecific) {
      setIsFetchingSpecific(false);
    }
    return;
  }

  // Scroll smoothly to center
  targetMessage.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
  });

  // Wait until scroll is visually complete
  const waitForScrollEnd = (cb) => {
    let lastY = window.scrollY;
    let sameCount = 0;

    function checkScroll() {
      const currentY = window.scrollY;

      if (Math.abs(currentY - lastY) < 2) {
        sameCount++;
        if (sameCount > 20) return cb(); // ~83ms of scroll stability
      } else {
        sameCount = 0;
      }

      lastY = currentY;
      requestAnimationFrame(checkScroll);
    }

    requestAnimationFrame(checkScroll);
  };

  // Animate after scroll finishes
  waitForScrollEnd(() => {
    targetMessageParent.classList.add(
      "animate-pulse",
      "bg-[#fdfce613]",
      "transition-all",
      "duration-50",
    );
    targetMessage.classList.add("shake-x");

    setTimeout(() => {
      targetMessageParent.classList.remove(
        "animate-pulse",
        "bg-[#fdfce613]",
        "transition-all",
        "duration-50",
      );
      targetMessage.classList.remove("shake-x");
    }, 1500);

    if (setIsFetchingSpecific) {
      setIsFetchingSpecific(false);
    }
  });
}

export const useScrollToMsg = () => {
  const conversations = useSelector((state) => state.dm.conversations);

  const scrollToMsg = useCallback(
    (messageId, convoId, fetchSpecificMessages) => {
      const convo = conversations.find((c) => c.convoId === convoId);
      const target = convo?.messages?.find((m) => m._id === messageId);

      if (!target && typeof fetchSpecificMessages === "function") {
        fetchSpecificMessages(messageId, convoId);
        return; // Don't scroll yet
      }

      scrollIntoViewMsg(messageId);
    },
    [conversations], // 💡 Depend only on conversations
  );

  return scrollToMsg;
};
