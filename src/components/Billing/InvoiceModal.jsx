import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { searchModelsAction } from "../../globalstate/Actions/invoiceActions"; // ✅ import API action
import { X } from "lucide-react";
import Button from "./Button";

const InvoiceModal = ({ onClose, onSubmit, formData, setFormData }) => {
  const dispatch = useDispatch();

  const [typingName, setTypingName] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (typingName.trim().length >= 2) {
        try {
          const result = await dispatch(searchModelsAction(typingName));
          setSuggestions(result || []);
        } catch (err) {
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    }, 500); // ⏱ debounce delay

    return () => clearTimeout(handler); // 🔁 cleanup previous timer
  }, [typingName, dispatch]);

  const handleChange = async (e) => {
    const { name, value, files } = e.target;

    if (name === "client") {
      setTypingName(value);
      setShowSuggestions(true);
    } else if (name === "dueDate") {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        alert("❌ Due date cannot be in the past");
        return;
      }

      setFormData((prev) => ({ ...prev, [name]: value }));
    } else {
      if (files) {
        const file = files[0];
        const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];

        if (file.size > 2 * 1024 * 1024) {
          alert("❌ File size should be less than or equal to 2MB");
          return;
        }

        if (!allowedTypes.includes(file.type)) {
          alert("❌ Only PDF, JPG, or PNG files are allowed");
          return;
        }

        setFormData((prev) => ({ ...prev, [name]: file }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    }
  };

  const handleClientSelect = (model) => {
    setFormData((prev) => ({ ...prev, client: model._id }));
    setTypingName(model.fullName);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex md:items-center justify-center bg-black bg-opacity-60">
      <div className="bg-gray-900 text-white w-full md:max-w-xl max-w-sm p-6 rounded-lg relative shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-semibold mb-4">Create New Invoice</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* ✅ CLIENT FIELD WITH AUTOCOMPLETE */}
            <div className="relative col-span-2">
              <label
                htmlFor="client"
                className="text-sm text-gray-400 mb-1 block"
              >
                Client Name
              </label>
              <input
                name="client"
                type="text"
                value={typingName}
                onChange={handleChange}
                placeholder="e.g. Akula Agency"
                autoComplete="off"
                className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-50 bg-gray-800 border border-gray-600 w-full mt-1 rounded shadow-md max-h-40 overflow-y-auto">
                  {suggestions.map((model) => (
                    <li
                      key={model._id}
                      className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                      onClick={() => handleClientSelect(model)}
                    >
                      {model.fullName} ({model.username})
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label
                htmlFor="campaign"
                className="text-sm text-gray-400 mb-1 block"
              >
                Campaign
              </label>
              <input
                name="campaign"
                type="text"
                value={formData.campaign}
                onChange={handleChange}
                placeholder="e.g. Summer Offer"
                className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="amount"
                className="text-sm text-gray-400 mb-1 block"
              >
                Amount
              </label>
              <input
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                placeholder="e.g. 5000"
                className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="dueDate"
                className="text-sm text-gray-400 mb-1 block"
              >
                Due Date
              </label>
              <input
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onClick={(e) => e.target.showPicker()}
                onChange={handleChange}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="currency"
                className="text-sm text-gray-400 mb-1 block"
              >
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2"
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="status"
                className="text-sm text-gray-400 mb-1 block"
              >
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2"
              >
                {["Unpaid"].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="file"
                className="text-sm text-gray-400 mb-1 block"
              >
                Upload PDF
              </label>
              <input
                name="file"
                type="file"
                accept=".pdf .jpg, .jpeg, .png"
                onChange={handleChange}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2"
              />
            </div>
          </div>

          <textarea
            name="note"
            value={formData.note}
            placeholder="Note..."
            onChange={handleChange}
            className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 md:h-24 h-12 resize-none"
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceModal;
