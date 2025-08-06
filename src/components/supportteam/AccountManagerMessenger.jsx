import React, { useState } from "react";

const contacts = [
  {
    id: 1,
    name: "John Doe",
    message: "Hi, I need help with my account.",
    profile: "https://i.pravatar.cc/150?img=1",
  },
  {
    id: 2,
    name: "Alice Smith",
    message: "Payment issue on my last order.",
    profile: "https://i.pravatar.cc/150?img=2",
  },
  {
    id: 3,
    name: "Mark Lee",
    message: "Can’t log into my dashboard.",
    profile: "https://i.pravatar.cc/150?img=3",
  },
];

const messagesData = {
  1: [
    { from: "user", text: "Hi, I need help with my account." },
    { from: "support", text: "Sure! What seems to be the problem?" },
  ],
  2: [
    { from: "user", text: "Payment issue on my last order." },
    { from: "support", text: "Let me check that for you!" },
  ],
  3: [
    { from: "user", text: "Can’t log into my dashboard." },
    { from: "support", text: "Try resetting your password." },
  ],
};

const AccountManagerMessenger = () => {
  const [selectedContactId, setSelectedContactId] = useState(null);
  const selectedMessages = messagesData[selectedContactId] || [];

  return (
    <div className="h-screen bg-blue-800  text-white flex flex-col">
      <header className="p-4 text-2xl font-bold bg-blue-900 text-center shadow-md">
        Account Manager System Dashboard
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Contact List */}
        <div className="w-full sm:w-[40%] bg-blue-700 p-4 overflow-y-auto">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => setSelectedContactId(contact.id)}
              className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer hover:bg-blue-600 transition ${
                selectedContactId === contact.id ? "bg-blue-600" : ""
              }`}
            >
              <img
                src={contact.profile}
                alt="profile"
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold">{contact.name}</p>
                <p className="text-sm text-gray-300 truncate">
                  {contact.message}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Chat Area */}
        <div className="w-full sm:w-2/3 bg-white text-black flex flex-col">
          {!selectedContactId ? (
            <div className="text-gray-500 text-xl flex items-center justify-center flex-1">
              Select a conversation to view messages
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="border-b px-4 py-3 font-bold text-xl">
                Chat with{" "}
                {contacts.find((c) => c.id === selectedContactId)?.name}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {selectedMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.from === "user" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-lg shadow text-white ${
                        msg.from === "user" ? "bg-blue-500" : "bg-green-600"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Box */}
              <div className="border-t px-4 py-3 flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button className="text-2xl">😄</button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-full transition">
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountManagerMessenger;
