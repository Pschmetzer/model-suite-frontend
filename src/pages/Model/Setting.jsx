import axios from "axios";
import React, { useState } from "react";
import { toast } from "react-hot-toast";

const Setting = () => {
  const [receiveEmails, setReceiveEmails] = useState(true);
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const token = JSON.parse(localStorage.getItem("auth"))?.token;

  const handleToggle = async () => {
    setReceiveEmails((prev) => !prev);
    const response = await axios.post(
      `${baseURL}/model/update-is-accepting-email`,
      {
        status: !receiveEmails,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (response.data.isAcceptingEmail) {
      toast.success(response.data.message);
    } else {
      toast.error(response.data.message);
    }
  };
  return (
    <div className="flex p-4 flex-col">
      <h2 className="text-2xl font-semibold mb-4">Settings</h2>
      <div className="p-6 rounded-xl bg-gray-900 shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-medium">Receive Emails</h4>
            <p className="text-sm text-gray-500">
              Toggle to receive important updates via email.
            </p>
          </div>

          {/* Toggle Button */}
          <button
            onClick={handleToggle}
            className={`w-12 h-6 flex items-center rounded-full p-1 duration-300 ${
              receiveEmails ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${
                receiveEmails ? "translate-x-6" : "translate-x-0"
              }`}
            ></div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Setting;
