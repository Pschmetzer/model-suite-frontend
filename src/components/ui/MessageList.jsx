import React, { memo } from "react";
import ChatMessage from "./ChatMessage";
import { Loader } from "lucide-react";

const MessageList = memo(
  ({
    messages,
    user,
    type,
    convoId,
    scrollToMsg,
    fetchSpecificDmMessages,
    hasMoreOlder,
    expandedMessages,
    toggleReadMore,
    handleMessageSeen,
    handleRightClick,
    handleSendMessage,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove,
    messageRef,
    isFetchingMoreOlder,
    activeAudios,
    handleReactionsClick,
  }) => {
    let lastDate = null;

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

    return (
      <>
        {/* Loading indicator at top */}
        {isFetchingMoreOlder && (
          <div className="flex justify-center py-4">
            <Loader className="animate-spin text-blue-400" size={20} />
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, i) => {
            const msgDate = new Date(msg.createdAt);
            const msgDateString = msgDate.toDateString();
            const userId = JSON.parse(localStorage.getItem("auth")).user._id;
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);

            let dateLabel = null;

            if (i === 0) {
              // First message: set lastDate and show label only if no more messages to fetch
              lastDate = msgDateString;
              if (!hasMoreOlder) {
                dateLabel = getDateLabel(msgDate, today, yesterday);
                lastDate = msgDateString;
              }
            } else if (msgDateString !== lastDate) {
              dateLabel = getDateLabel(msgDate, today, yesterday);
              lastDate = msgDateString;
            }

            const isOwn = msg.senderId === user._id;
            let position;
            if (
              messages[i - 1]?.senderId !== msg.senderId &&
              messages[i + 1]?.senderId === msg.senderId
            )
              position = "top";
            if (
              messages[i - 1]?.senderId === msg.senderId &&
              messages[i + 1]?.senderId === msg.senderId
            )
              position = "center";
            if (
              messages[i - 1]?.senderId === msg.senderId &&
              messages[i + 1]?.senderId !== msg.senderId
            )
              position = "bottom";

            return (
              <MemoizedMessageItem
                key={msg._id || i}
                msg={msg}
                i={i}
                userId={userId}
                isOwn={isOwn}
                type={type}
                convoId={convoId}
                scrollToMsg={scrollToMsg}
                fetchSpecificDmMessages={fetchSpecificDmMessages}
                position={position}
                dateLabel={dateLabel}
                expandedMessages={expandedMessages}
                toggleReadMore={toggleReadMore}
                handleMessageSeen={handleMessageSeen}
                handleRightClick={handleRightClick}
                handleSendMessage={handleSendMessage}
                handleTouchStart={handleTouchStart}
                handleTouchEnd={handleTouchEnd}
                handleTouchMove={handleTouchMove}
                messageRef={messageRef}
                activeAudios={activeAudios}
                handleReactionsClick={handleReactionsClick}
              />
            );
          })
        )}
      </>
    );
  },
);

// Individual Message Item Component - Memoized to prevent re-renders
const MemoizedMessageItem = memo(
  ({
    msg,
    i,
    isOwn,
    userId,
    type,
    convoId,
    scrollToMsg,
    fetchSpecificDmMessages,
    position,
    dateLabel,
    replyTomsg,
    expandedMessages,
    toggleReadMore,
    handleMessageSeen,
    handleRightClick,
    handleSendMessage,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove,
    messageRef,
    activeAudios,
    handleReactionsClick,
  }) => {
    return (
      <div>
        {dateLabel && (
          <div className="flex w-full bg-[#1b252b] my-2 items-center justify-center text-sm text-gray-400 py-1">
            <span className="px-4 py-1 rounded-full bg-[#2a3942]">
              {dateLabel}
            </span>
          </div>
        )}
        <div
          ref={messageRef}
          onTouchStart={(e) => handleTouchStart(e, msg._id, isOwn)}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          className="select-none"
        >
          <ChatMessage
            msg={msg}
            i={i}
            key={msg._id}
            id={msg._id}
            userId={userId}
            isOwn={isOwn}
            convoType={type}
            scrollToMsg={scrollToMsg}
            convoId={convoId}
            fetchSpecificDmMessages={fetchSpecificDmMessages}
            msgType={msg.type}
            position={position}
            replyTomsg={replyTomsg}
            expandedMessages={expandedMessages}
            toggleReadMore={toggleReadMore}
            handleMessageSeen={handleMessageSeen}
            handleRightClick={handleRightClick}
            handleSendMessage={handleSendMessage}
            activeAudios={activeAudios}
            handleReactionsClick={handleReactionsClick}
          />
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function - only re-render if these specific props change
    return (
      prevProps.msg._id === nextProps.msg._id &&
      prevProps.msg.status === nextProps.msg.status &&
      prevProps.msg.edited === nextProps.msg.edited &&
      prevProps.msg.pinned === nextProps.msg.pinned &&
      prevProps.msg.text === nextProps.msg.text &&
      prevProps.fetchSpecificDmMessages === nextProps.fetchSpecificDmMessages &&
      prevProps.expandedMessages[prevProps.i] ===
        nextProps.expandedMessages[nextProps.i] &&
      prevProps.position === nextProps.position &&
      prevProps.dateLabel === nextProps.dateLabel &&
      JSON.stringify(prevProps.msg.attachments) ===
        JSON.stringify(nextProps.msg.attachments) &&
      JSON.stringify(prevProps.msg.reactions) ===
        JSON.stringify(nextProps.msg.reactions) &&
      JSON.stringify(prevProps.msg.deletedFor) ===
        JSON.stringify(nextProps.msg.deletedFor)
    );
  },
);

export default React.memo(MessageList);
