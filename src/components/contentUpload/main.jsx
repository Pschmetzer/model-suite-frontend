import { useState } from "react";
import { X, UploadCloud, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
const baseUrl = import.meta.env.VITE_API_BASE_URL;
const ContentUpload = () => {
  const [files, setFiles] = useState([]);
  const [category, setCategory] = useState("none");
  const [note, setNote] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };
  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };
  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!files || files.length === 0) {
      setLoading(false);
      return toast.error("please upload atleast one file");
    }
    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}");
      const name = auth?.user?.username || "anonymous";

      const form = new FormData();
      files.forEach((file) => form.append("files", file));
      if (category) {
        form.append("category", category);
      }
      if (note) {
        form.append("note", note);
      }
      form.append("name", name);
      const response = await axios.post(`${baseUrl}/contentupload/model`, form);
      if (!response.data?.success) {
        setLoading(false);
        return toast.error(response.data.message);
      } else if (response.data?.success) {
        setLoading(false);
        toast.success(response.data?.message);
        setFiles([]);
        setCategory("none");
        setNote("");
      }
    } catch (err) {
      toast.error("check your internet connection");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-[400px] bg-[#1f2937] text-white rounded-xl shadow-xl p-6 z-50">
      <form onSubmit={handleUpload}>
        <div className="flex justify-center w-full">
          <h2 className="text-lg font-semibold mb-4">Upload Content</h2>
        </div>

        {/* Drag and Drop Area */}
        <label
          htmlFor="file-upload"
          className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-500 rounded-lg p-4 text-gray-400 cursor-pointer hover:bg-gray-700 ${
            dragOver ? "bg-gray-700 border-blue-500" : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDrop={(e) => {
            e.preventDefault();
            const droppedFiles = e.dataTransfer.files;
            if (droppedFiles && droppedFiles.length > 0) {
              setFiles((prev) => [...prev, ...Array.from(droppedFiles)]);
            }
          }}
          onDragEnter={() => setDragOver(true)}
          onDragLeave={() => setDragOver(false)}
        >
          <UploadCloud className="w-8 h-8 mb-2" />
          <p>
            Drag and drop files here or
            <span className="text-blue-400 underline"> Browse</span>
          </p>
          <input
            id="file-upload"
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            accept=".mp4,.mp3,.jpg,.png,video/*,audio/*,image/*,text/plain,application/pdf,.pdf"
            draggable
          />
        </label>

        {/* File List */}
        <div className="mt-4 max-h-32 overflow-y-auto space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex justify-between items-center bg-[#374151] p-2 rounded text-sm"
            >
              <span className="truncate">{file.name}</span>

              <X
                className="w-4 h-4 text-gray-400 hover:text-red-400 cursor-pointer"
                onClick={() => removeFile(index)}
              />
            </div>
          ))}
        </div>

        {/* Category Select */}
        <div className="mt-4">
          <label className="text-sm">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full bg-[#111827] text-white border border-gray-600 rounded px-3 py-2 text-sm cursor-pointer"
          >
            <option>none</option>
            <option>Twitter Feed</option>
            <option>Instagram Story</option>
            <option>Drive Folder</option>
          </select>
        </div>

        {/* Notes */}
        <div className="mt-4">
          <label className="text-sm">Notes</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note"
            className="mt-1 w-full bg-[#111827] text-white border border-gray-600 rounded px-3 py-2 text-sm resize-none"
          />
        </div>

        <div className="mt-6 flex justify-center">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
            type="submit"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Upload"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContentUpload;
