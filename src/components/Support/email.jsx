import { useState, useRef } from "react";
import faqsData from "./faqs.json";

export default function ContactForm() {
  const categories = [
    "All",
    ...Array.from(new Set(faqsData.map((faq) => faq.category))),
  ];

  const fileInputRef = useRef();

  const [form, setForm] = useState({
    name: "",
    email: "",
    category: "",
    urgency: "",
    message: "",
    attachment: null,
  });

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "attachment") {
      setForm({ ...form, attachment: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.message) {
      setStatus("Please fill in all required fields.");
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("category", form.category || "General Issue");
    formData.append("urgency", form.urgency || "Normal");
    formData.append("message", form.message);
    if (form.attachment) {
      formData.append("attachment", form.attachment);
    }

    setLoading(true);
    setStatus(null);

    try {
      const auth = JSON.parse(localStorage.getItem("auth"));
      const authToken = auth?.token;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/support/submit`,
        {
          method: "POST",
          headers: {
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
          body: formData,
        },
      );

      const data = await response.json();

      if (response.ok) {
        setStatus(
          "Thanks! We've received your request and will reply within 24–48 hours.",
        );
        setForm({
          name: "",
          email: "",
          category: "",
          urgency: "",
          message: "",
          attachment: null,
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setStatus(data?.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("Error submitting the form. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div
      id="contact-form-section"
      className="w-full md:w-1/3 bg-[#1e1e1e] p-4 rounded-md h-fit"
    >
      <h3 className="text-lg font-semibold mb-4 text-white">Contact Support</h3>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Name*"
          value={form.name}
          onChange={handleChange}
          className="w-full bg-[#121212] border border-gray-600 p-2 rounded-md text-white placeholder-gray-400 text-sm"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email*"
          value={form.email}
          onChange={handleChange}
          className="w-full bg-[#121212] border border-gray-600 p-2 rounded-md text-white placeholder-gray-400 text-sm"
          required
        />
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full bg-[#121212] border border-gray-600 p-2 rounded-md text-white text-sm"
        >
          <option value="">Select Category</option>
          {categories
            .filter((cat) => cat !== "All")
            .map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat}
              </option>
            ))}
        </select>
        <select
          name="urgency"
          value={form.urgency}
          onChange={handleChange}
          className="w-full bg-[#121212] border border-gray-600 p-2 rounded-md text-white text-sm"
        >
          <option value="">Select Priority</option>
          <option value="Low">Low</option>
          <option value="Normal">Normal</option>
          <option value="High">High</option>
        </select>
        <textarea
          name="message"
          placeholder="Message*"
          value={form.message}
          onChange={handleChange}
          required
          className="w-full bg-[#121212] border border-gray-600 p-2 rounded-md text-white placeholder-gray-400 text-sm h-24"
        />
        <input
          ref={fileInputRef}
          type="file"
          name="attachment"
          accept="image/*,.pdf"
          onChange={handleChange}
          className="text-sm text-gray-300"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#333] hover:bg-[#444] p-2 rounded-md text-sm text-white"
        >
          {loading ? "Sending..." : "Send Message"}
        </button>
        {status && (
          <div
            className={`text-center text-sm mt-2 ${
              status.startsWith("Thanks") ? "text-green-400" : "text-red-400"
            }`}
          >
            {status}
          </div>
        )}
      </form>
    </div>
  );
}