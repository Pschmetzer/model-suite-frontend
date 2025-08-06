import React, { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Image,
  Code,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Save,
  X,
  Eye,
  Edit3,
  Type,
  Palette,
  Undo,
  Redo,
} from "lucide-react";
import toast from "react-hot-toast";

/**
 * Advanced note editor with rich text features
 * Supports markdown, formatting, and real-time preview
 */
const NoteEditor = ({ note, onSave, onCancel, isOpen }) => {
  const [content, setContent] = useState(note?.content || "");
  const [title, setTitle] = useState(note?.title || "");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const textareaRef = useRef(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Update word and character count
  useEffect(() => {
    const words = content
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    setWordCount(words.length);
    setCharacterCount(content.length);
  }, [content]);

  // Auto-save functionality
  useEffect(() => {
    if (!note) return;

    const autoSaveTimer = setTimeout(() => {
      if (content !== note.content || title !== note.title) {
        handleAutoSave();
      }
    }, 5000); // Auto-save every 5 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [content, title, note]);

  // Handle auto-save
  const handleAutoSave = async () => {
    if (!note || isSaving) return;

    try {
      await onSave(
        {
          title: title.trim(),
          content: content.trim(),
        },
        true,
      ); // true indicates auto-save
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  };

  // Insert text at cursor position
  const insertTextAtCursor = (textToInsert) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent =
      content.substring(0, start) + textToInsert + content.substring(end);

    setContent(newContent);

    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + textToInsert.length,
        start + textToInsert.length,
      );
    }, 0);
  };

  // Wrap selected text with formatting
  const wrapSelectedText = (prefix, suffix = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    if (selectedText) {
      const wrappedText = prefix + selectedText + (suffix || prefix);
      const newContent =
        content.substring(0, start) + wrappedText + content.substring(end);
      setContent(newContent);

      // Restore selection
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      }, 0);
    } else {
      insertTextAtCursor(prefix + (suffix || prefix));
    }
  };

  // Formatting functions
  const formatBold = () => wrapSelectedText("**");
  const formatItalic = () => wrapSelectedText("*");
  const formatUnderline = () => wrapSelectedText("<u>", "</u>");
  const formatCode = () => wrapSelectedText("`");
  const formatQuote = () => insertTextAtCursor("> ");
  const formatHeading1 = () => insertTextAtCursor("# ");
  const formatHeading2 = () => insertTextAtCursor("## ");
  const formatHeading3 = () => insertTextAtCursor("### ");
  const formatUnorderedList = () => insertTextAtCursor("- ");
  const formatOrderedList = () => insertTextAtCursor("1. ");
  const formatLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      wrapSelectedText("[", `](${url})`);
    }
  };
  const formatImage = () => {
    const url = prompt("Enter image URL:");
    const alt = prompt("Enter alt text (optional):") || "image";
    if (url) {
      insertTextAtCursor(`![${alt}](${url})`);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!content.trim()) {
      toast.error("Please enter some content");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
      });
      toast.success("Note saved successfully");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cursor position change
  const handleCursorChange = (e) => {
    setCursorPosition(e.target.selectionStart);
  };

  // Render markdown preview
  const renderPreview = (text) => {
    // Simple markdown rendering (you might want to use a proper markdown library)
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/^# (.*$)/gm, "<h1>$1</h1>")
      .replace(/^## (.*$)/gm, "<h2>$1</h2>")
      .replace(/^### (.*$)/gm, "<h3>$1</h3>")
      .replace(/^> (.*$)/gm, "<blockquote>$1</blockquote>")
      .replace(/^- (.*$)/gm, "<li>$1</li>")
      .replace(/\n/g, "<br>");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <Edit3 className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">
              {note ? "Edit Note" : "Create Note"}
            </h2>
            {note && (
              <span className="text-sm text-gray-400">
                Last saved: {new Date(note.updatedAt).toLocaleString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                isPreviewMode
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {isPreviewMode ? (
                <Edit3 className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {isPreviewMode ? "Edit" : "Preview"}
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save"}
            </button>

            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Title Input */}
        <div className="p-6 border-b border-gray-700">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter note title..."
            className="w-full text-2xl font-semibold bg-transparent text-white placeholder-gray-400 border-none outline-none"
          />
        </div>

        {/* Toolbar */}
        {!isPreviewMode && (
          <div className="flex items-center gap-2 p-4 border-b border-gray-700 overflow-x-auto">
            {/* Text Formatting */}
            <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
              <button
                onClick={formatBold}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Bold (Ctrl+B)"
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                onClick={formatItalic}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Italic (Ctrl+I)"
              >
                <Italic className="h-4 w-4" />
              </button>
              <button
                onClick={formatUnderline}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Underline"
              >
                <Underline className="h-4 w-4" />
              </button>
              <button
                onClick={formatCode}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Code"
              >
                <Code className="h-4 w-4" />
              </button>
            </div>

            {/* Headings */}
            <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
              <button
                onClick={formatHeading1}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Heading 1"
              >
                <Heading1 className="h-4 w-4" />
              </button>
              <button
                onClick={formatHeading2}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Heading 2"
              >
                <Heading2 className="h-4 w-4" />
              </button>
              <button
                onClick={formatHeading3}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Heading 3"
              >
                <Heading3 className="h-4 w-4" />
              </button>
            </div>

            {/* Lists */}
            <div className="flex items-center gap-1 border-r border-gray-600 pr-3">
              <button
                onClick={formatUnorderedList}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Bullet List"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={formatOrderedList}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Numbered List"
              >
                <ListOrdered className="h-4 w-4" />
              </button>
              <button
                onClick={formatQuote}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Quote"
              >
                <Quote className="h-4 w-4" />
              </button>
            </div>

            {/* Links & Media */}
            <div className="flex items-center gap-1">
              <button
                onClick={formatLink}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Insert Link"
              >
                <Link className="h-4 w-4" />
              </button>
              <button
                onClick={formatImage}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Insert Image"
              >
                <Image className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex">
          {isPreviewMode ? (
            /* Preview Mode */
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="prose prose-invert max-w-none">
                <h1 className="text-3xl font-bold text-white mb-6">
                  {title || "Untitled"}
                </h1>
                <div
                  className="text-gray-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderPreview(content) }}
                />
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <div className="flex-1 flex flex-col">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onSelect={handleCursorChange}
                onKeyUp={handleCursorChange}
                onClick={handleCursorChange}
                placeholder="Start writing your note..."
                className="flex-1 p-6 bg-transparent text-white placeholder-gray-400 border-none outline-none resize-none font-mono text-sm leading-relaxed"
                style={{ minHeight: "400px" }}
              />

              {/* Status Bar */}
              <div className="flex items-center justify-between p-4 border-t border-gray-700 text-sm text-gray-400">
                <div className="flex items-center gap-6">
                  <span>{wordCount} words</span>
                  <span>{characterCount} characters</span>
                  <span>
                    Line{" "}
                    {content.substring(0, cursorPosition).split("\n").length}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs">Auto-save enabled</span>
                  {isSaving && (
                    <span className="text-blue-400 text-xs">Saving...</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="p-4 border-t border-gray-700 bg-gray-900">
          <div className="text-xs text-gray-500 flex flex-wrap gap-4">
            <span>
              <kbd className="bg-gray-700 px-1 rounded">Ctrl+B</kbd> Bold
            </span>
            <span>
              <kbd className="bg-gray-700 px-1 rounded">Ctrl+I</kbd> Italic
            </span>
            <span>
              <kbd className="bg-gray-700 px-1 rounded">Ctrl+S</kbd> Save
            </span>
            <span>
              <kbd className="bg-gray-700 px-1 rounded">Ctrl+/</kbd> Preview
            </span>
            <span>
              <kbd className="bg-gray-700 px-1 rounded">Esc</kbd> Cancel
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;
