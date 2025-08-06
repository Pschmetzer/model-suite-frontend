import React, { useEffect, useState } from "react";
import ButtonLoading from "../../../../resuable/loaders/ButtonLoader";

const AccountDetails = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    username: "",
    agencyName: "",
    timezone: "GMT+00:00",
  });
  const [loading, setLoading] = useState(false);
  const settings = JSON.parse(localStorage.getItem("auth"))?.user;
  console.log(settings);

  useEffect(() => {
    if (settings) {
      setFormData({
        // firstName: settings.personalInfo.firstName || '',
        // lastName: settings.personalInfo.lastName || '',
        email: settings.agencyEmail || "",
        // phoneNumber: settings.personalInfo.phoneNumber || '',
        username: settings.username || "",
        agencyName: settings.agencyName || "",
        timezone: settings.timezone || "GMT+00:00",
      });
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/v1/settings/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          username: formData.username,
          agencyName: formData.agencyName,
          timezone: formData.timezone,
        }),
      });

      if (response.ok) {
        const updatedSettings = await response.json();
        updateSettings(updatedSettings);
        showToast("Profile updated successfully", "success");
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      showToast("Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Account Details</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture */}
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 border rounded-full">
            {/* <span className="text-2xl text-gray-400"> */}
            {/* {formData.firstName ? formData.firstName[0].toUpperCase() : 'P'}
             */}
            <img
              src={settings.profilePhoto || ""}
              alt="no"
              className="w-full h-full object-cover rounded-full"
            />
            {/* </span> */}
          </div>
          <button
            type="button"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
          >
            Change Photo
          </button>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, firstName: e.target.value }))
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Patrick"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, lastName: e.target.value }))
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Schmetzer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-3 py-2 bg-gray-600 border border-gray-600 rounded-md text-gray-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  phoneNumber: e.target.value,
                }))
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, username: e.target.value }))
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Agency Name
            </label>
            <input
              type="text"
              value={formData.agencyName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, agencyName: e.target.value }))
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Schmetzer Media"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Timezone
          </label>
          <select
            value={formData.timezone}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, timezone: e.target.value }))
            }
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="GMT-12:00">GMT-12:00</option>
            <option value="GMT-11:00">GMT-11:00</option>
            <option value="GMT-10:00">GMT-10:00</option>
            <option value="GMT-09:00">GMT-09:00</option>
            <option value="GMT-08:00">GMT-08:00</option>
            <option value="GMT-07:00">GMT-07:00</option>
            <option value="GMT-06:00">GMT-06:00</option>
            <option value="GMT-05:00">GMT-05:00</option>
            <option value="GMT-04:00">GMT-04:00</option>
            <option value="GMT-03:00">GMT-03:00</option>
            <option value="GMT-02:00">GMT-02:00</option>
            <option value="GMT-01:00">GMT-01:00</option>
            <option value="GMT+00:00">GMT+00:00</option>
            <option value="GMT+01:00">GMT+01:00</option>
            <option value="GMT+02:00">GMT+02:00</option>
            <option value="GMT+03:00">GMT+03:00</option>
            <option value="GMT+04:00">GMT+04:00</option>
            <option value="GMT+05:00">GMT+05:00</option>
            <option value="GMT+06:00">GMT+06:00</option>
            <option value="GMT+07:00">GMT+07:00</option>
            <option value="GMT+08:00">GMT+08:00</option>
            <option value="GMT+09:00">GMT+09:00</option>
            <option value="GMT+10:00">GMT+10:00</option>
            <option value="GMT+11:00">GMT+11:00</option>
            <option value="GMT+12:00">GMT+12:00</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-6 rounded-md transition-colors flex items-center"
        >
          {loading ? <ButtonLoading size="sm" className="mr-2" /> : null}
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default AccountDetails;
