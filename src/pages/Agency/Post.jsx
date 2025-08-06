import React, { useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import "./NewPost.css"; // import the CSS file
import axios from "axios";

const post = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const user = JSON.parse(localStorage.getItem("auth"));
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const [userPost, setUserPost] = useState({
    title: "",
    audience: "",
    content: "",
    expirationDate: "",
  });
  const [allPost, setAllPost] = useState([]);

  const getAllPost = async () => {
    const allpost = await axios.get(`${baseUrl}/post/allpost`);
    setAllPost(allPost);
  };

  useEffect(() => {
    getAllPost();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserPost((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        placeholder: "Write your post...",
        theme: "snow",
        modules: {
          toolbar: [
            ["bold", "italic", "underline"],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ align: [] }],
            ["link", "image"],
          ],
        },
      });
    }
  }, []);
  const handleSave = async (e) => {
    e.preventDefault();
    const content = quillRef.current.root.innerHTML;

    const finalPost = {
      title: userPost.title,
      post: content,
      image: "hgfhfhhg",
      userId: user.user._id,
      Audience: userPost.audience,
      expirationDate: userPost.expirationDate,
    };

    try {
      await axios.post(`${baseUrl}/post/create`, finalPost);
      alert("Post saved successfully!");
    } catch (error) {
      console.error("Error saving post:", error);
    }
  };
  return (
    <div className="new-post-container">
      <div className="save_btn_right">
        <button className="save-button" onClick={handleSave}>
          Save
        </button>
      </div>
      <h3 className="title">New Post</h3>

      <input
        type="text"
        name="title"
        value={userPost.title}
        placeholder="Post Title"
        className="input-field"
        onChange={handleChange}
      />

      <div className="editor-wrapper">
        <div ref={editorRef} className="editor" />
      </div>

      <div className="audien">
        <span className="label">Audience</span>{" "}
        <span className="label">Language</span>{" "}
      </div>

      <div className="radio-group">
        <label>
          <input
            type="radio"
            name="audience"
            value="models and staff"
            onChange={handleChange}
          />
          <span>Models and staff</span>
        </label>
        <label>
          <input
            type="radio"
            name="audience"
            value="models only"
            onChange={handleChange}
          />
          <span>Models only</span>
        </label>
        <label>
          <input
            type="radio"
            name="audience"
            value="staff only"
            onChange={handleChange}
          />
          <span>Staff only</span>
        </label>
      </div>

      <div className="audien">
        <span className="label">Expiration Date</span>{" "}
        <span className="label">Englister</span>{" "}
      </div>
      <input
        type="date"
        name="expirationDate"
        value={userPost.expirationDate}
        className="date-picker"
        onChange={handleChange}
      />
      <div></div>
    </div>
  );
};

export default post;
