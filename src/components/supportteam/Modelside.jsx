import React, { useState } from "react";

const contacts = [
  {
    id: 1,
    name: "Account Manager",
    message: "Let’s talk about your onboarding.",
    profile: "https://i.pravatar.cc/150?img=4",
  },
  {
    id: 2,
    name: "Technical Support",
    message: "Having any issues with the system?",
    profile: "https://i.pravatar.cc/150?img=5",
  },
  {
    id: 3,
    name: "Content Strategy",
    message: "Need help planning your content?",
    profile: "https://i.pravatar.cc/150?img=6",
  },
  {
    id: 4,
    name: "Branding Specialist",
    message: "Let’s improve your brand presence.",
    profile: "https://i.pravatar.cc/150?img=7",
  },
];

const messagesData = {
  1: [
    { from: "user", text: "Hey! Can you walk me through onboarding?" },
    { from: "support", text: "Of course! Let’s get started." },
  ],
  2: [
    { from: "user", text: "The dashboard isn’t loading." },
    { from: "support", text: "Try clearing your cache and reloading." },
  ],
  3: [
    { from: "user", text: "What content works best for my audience?" },
    { from: "support", text: "We recommend short videos and blogs." },
  ],
  4: [
    { from: "user", text: "Any tips to improve our visual branding?" },
    {
      from: "support",
      text: "Definitely! Let’s refine your color palette and tone.",
    },
  ],
};

const Modelside = () => {
  const [selectedContactId, setSelectedContactId] = useState(null);
  const selectedMessages = messagesData[selectedContactId] || [];

  return (
    <div className="h-screen bg-blue-800 text-white flex flex-col">
      <header className="p-4 text-2xl font-bold bg-blue-900 text-center shadow-md">
        ModelSideDash Support Dashboard
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <div className="w-full sm:w-[40%] bg-blue-700 p-4 overflow-y-auto">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => setSelectedContactId(contact.id)}
              className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer hover:bg-blue-600 transition ${selectedContactId === contact.id ? "bg-blue-600" : ""}`}
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

        {/* Right Panel */}
        <div className="w-full sm:w-2/3 bg-white text-black flex flex-col">
          {!selectedContactId ? (
            <div className="text-gray-500 text-xl flex items-center justify-center flex-1">
              Select a support section to start chatting
            </div>
          ) : (
            <>
              <div className="border-b px-4 py-3 flex items-center gap-3 font-bold text-xl">
                <img
                  src={
                    contacts.find((c) => c.id === selectedContactId)?.profile
                  }
                  alt="profile"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div>
                    {contacts.find((c) => c.id === selectedContactId)?.name}
                  </div>
                  <div className="text-sm text-gray-600">🟢Online</div>
                </div>
              </div>

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

              {/* Message Input */}
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

export default Modelside;
