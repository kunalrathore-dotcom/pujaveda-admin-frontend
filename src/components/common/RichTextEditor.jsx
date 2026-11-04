import { useState, useRef, useEffect } from "react";
import { extractMeaningfulText } from "../../utils/blogContentValidator";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Link2,
  Image as ImageIcon,
  RotateCcw,
  RotateCw,
  Minus,
  RemoveFormatting,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  X,
  Check,
} from "lucide-react";

export default function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Start writing your article here...",
  minHeight = "320px",
  onImageUpload,
}) {
  const editorRef = useRef(null);
  const isInternalChange = useRef(false);

  // Link Dialog Modal State
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const savedSelectionRef = useRef(null);

  // Image Dialog Modal State
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");

  // Sync external value with editor innerHTML without losing cursor position
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
    isInternalChange.current = false;
  }, [value]);

  // Handle user typing or formatting changes
  const handleInput = () => {
    if (editorRef.current) {
      isInternalChange.current = true;
      const html = editorRef.current.innerHTML;
      if (onChange) {
        // If empty HTML (like <br> or empty <p>), treat as empty string
        const clean = html === "<p><br></p>" || html === "<br>" ? "" : html;
        onChange(clean);
      }
    }
  };

  // Execute standard formatting command
  const executeCommand = (command, commandValue = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    handleInput();
  };

  // Block format helper (Heading 1, 2, 3, Paragraph, Blockquote)
  const formatBlock = (tag) => {
    editorRef.current?.focus();
    // In execCommand, formatBlock requires enclosing tag like "<H2>" or "<P>"
    document.execCommand("formatBlock", false, `<${tag.toUpperCase()}>`);
    handleInput();
  };

  // Save current text selection before opening modal
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
      const text = sel.toString();
      setLinkText(text || "");
    }
  };

  // Restore saved text selection
  const restoreSelection = () => {
    const sel = window.getSelection();
    if (savedSelectionRef.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
  };

  // Open Link Dialog
  const openLinkDialog = () => {
    saveSelection();
    setLinkUrl("");
    setLinkModalOpen(true);
  };

  // Apply Link
  const applyLink = (e) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    restoreSelection();
    editorRef.current?.focus();

    const formattedUrl = linkUrl.startsWith("http://") || linkUrl.startsWith("https://") || linkUrl.startsWith("/")
      ? linkUrl.trim()
      : `https://${linkUrl.trim()}`;

    if (linkText.trim()) {
      // Insert link with custom text
      const html = `<a href="${formattedUrl}" target="_blank" rel="noopener noreferrer">${linkText.trim()}</a>`;
      document.execCommand("insertHTML", false, html);
    } else {
      document.execCommand("createLink", false, formattedUrl);
    }

    handleInput();
    setLinkModalOpen(false);
    setLinkUrl("");
    setLinkText("");
  };

  // Open Image Dialog
  const openImageDialog = () => {
    saveSelection();
    setImageUrl("");
    setImageAlt("");
    setImageModalOpen(true);
  };

  // Apply Image
  const applyImage = (e) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;

    restoreSelection();
    editorRef.current?.focus();

    const altAttr = imageAlt.trim() ? ` alt="${imageAlt.trim()}"` : ` alt="Article illustration"`;
    const html = `<p><img src="${imageUrl.trim()}"${altAttr} class="rounded-2xl shadow-sm my-4 max-w-full" /></p>`;
    document.execCommand("insertHTML", false, html);

    handleInput();
    setImageModalOpen(false);
    setImageUrl("");
    setImageAlt("");
  };

  // Word and character count calculation based on meaningful text and raw HTML
  const meaningfulText = extractMeaningfulText(value);
  const meaningfulCharCount = meaningfulText.length;
  const wordCount = meaningfulText ? meaningfulText.split(/\s+/).length : 0;
  const rawCharCount = value ? value.length : 0;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-xs focus-within:border-[#5C0F17] transition flex flex-col">
      {/* 1. Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-neutral-200 bg-[#FAF6F0] p-2 text-neutral-700">
        {/* Block Type Buttons */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-neutral-300">
          <button
            type="button"
            onClick={() => formatBlock("p")}
            title="Normal Paragraph"
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold hover:bg-white hover:text-neutral-900 transition"
          >
            <AlignLeft size={14} />
            <span className="hidden sm:inline">Normal</span>
          </button>
          <button
            type="button"
            onClick={() => formatBlock("h2")}
            title="Heading 2 (Main Section)"
            className="flex items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-bold hover:bg-white hover:text-[#5C0F17] transition"
          >
            <Heading2 size={15} className="text-[#5C0F17]" />
            <span className="hidden sm:inline">H2</span>
          </button>
          <button
            type="button"
            onClick={() => formatBlock("h3")}
            title="Heading 3 (Subsection)"
            className="flex items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-bold hover:bg-white hover:text-[#5C0F17] transition"
          >
            <Heading3 size={15} />
            <span className="hidden sm:inline">H3</span>
          </button>
          <button
            type="button"
            onClick={() => formatBlock("h1")}
            title="Heading 1"
            className="flex items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-bold hover:bg-white hover:text-[#5C0F17] transition"
          >
            <Heading1 size={15} />
            <span className="hidden sm:inline">H1</span>
          </button>
        </div>

        {/* Inline Formatting */}
        <div className="flex items-center gap-0.5 px-1 border-r border-neutral-300">
          <button
            type="button"
            onClick={() => executeCommand("bold")}
            title="Bold (Ctrl+B)"
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white hover:text-neutral-900 transition font-bold"
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("italic")}
            title="Italic (Ctrl+I)"
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white hover:text-neutral-900 transition italic"
          >
            <Italic size={14} />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("underline")}
            title="Underline (Ctrl+U)"
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white hover:text-neutral-900 transition underline"
          >
            <Underline size={14} />
          </button>
        </div>

        {/* Lists & Blockquote */}
        <div className="flex items-center gap-0.5 px-1 border-r border-neutral-300">
          <button
            type="button"
            onClick={() => executeCommand("insertUnorderedList")}
            title="Bullet List"
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white hover:text-neutral-900 transition"
          >
            <List size={14} />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("insertOrderedList")}
            title="Numbered List"
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white hover:text-neutral-900 transition"
          >
            <ListOrdered size={14} />
          </button>
          <button
            type="button"
            onClick={() => formatBlock("blockquote")}
            title="Quote Box"
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white hover:text-[#DA9B26] transition"
          >
            <Quote size={14} />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("insertHorizontalRule")}
            title="Divider Line"
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white hover:text-neutral-900 transition"
          >
            <Minus size={14} />
          </button>
        </div>

        {/* Links & Images */}
        <div className="flex items-center gap-0.5 px-1 border-r border-neutral-300">
          <button
            type="button"
            onClick={openLinkDialog}
            title="Insert Link"
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold hover:bg-white hover:text-[#5C0F17] transition"
          >
            <Link2 size={14} />
            <span className="hidden md:inline">Link</span>
          </button>
          <button
            type="button"
            onClick={openImageDialog}
            title="Insert Image"
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold hover:bg-white hover:text-[#5C0F17] transition"
          >
            <ImageIcon size={14} />
            <span className="hidden md:inline">Image</span>
          </button>
        </div>

        {/* Undo, Redo, Clear */}
        <div className="flex items-center gap-0.5 pl-1">
          <button
            type="button"
            onClick={() => executeCommand("undo")}
            title="Undo (Ctrl+Z)"
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white hover:text-neutral-900 transition text-neutral-500"
          >
            <RotateCcw size={13} />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("redo")}
            title="Redo (Ctrl+Y)"
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white hover:text-neutral-900 transition text-neutral-500"
          >
            <RotateCw size={13} />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("removeFormat")}
            title="Clear Formatting"
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white hover:text-rose-600 transition text-neutral-400"
          >
            <RemoveFormatting size={13} />
          </button>
        </div>
      </div>

      {/* 2. Visual ContentEditable Surface */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        style={{ minHeight }}
        data-placeholder={placeholder}
        className="legal-document-body p-5 text-sm outline-none overflow-y-auto leading-relaxed text-[#2D1C13] bg-white
          empty:before:content-[attr(data-placeholder)] empty:before:text-neutral-400 empty:before:pointer-events-none"
      />

      {/* 3. Bottom Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 bg-[#FAF6F0]/70 px-4 py-2 text-[11px] font-medium">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[#5C0F17] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-[#DA9B26]" />
            WYSIWYG Article Editor
          </span>
          <span className="text-neutral-300">•</span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              meaningfulCharCount >= 100
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : "bg-rose-100 text-rose-800 border border-rose-200"
            }`}
          >
            {meaningfulCharCount >= 100
              ? "✓ Minimum 100 characters met"
              : `Minimum 100 characters required (${100 - meaningfulCharCount} more needed)`}
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-neutral-600">
          <span>{wordCount} words</span>
          <span>•</span>
          <span
            className={
              meaningfulCharCount < 100
                ? "text-rose-600 font-bold"
                : rawCharCount > 20000
                ? "text-rose-600 font-bold"
                : "text-emerald-700 font-bold"
            }
          >
            {meaningfulCharCount.toLocaleString()} / 20,000 chars
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Link Dialog Modal                                            */}
      {/* ============================================================ */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h4 className="text-xs font-black text-neutral-900 flex items-center gap-1.5">
                <Link2 size={14} className="text-[#5C0F17]" />
                <span>Insert Web Link</span>
              </h4>
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={applyLink} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Destination URL <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="https://pujaveda.com/category/brass-idols"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  autoFocus
                  required
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-mono outline-none focus:border-[#5C0F17] focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Link Text <span className="text-neutral-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pure Brass Ganesha"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-medium outline-none focus:border-[#5C0F17] focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLinkModalOpen(false)}
                  className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-xl bg-[#5C0F17] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#4A0D15] shadow-xs"
                >
                  <Check size={13} />
                  <span>Insert</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Image Dialog Modal                                           */}
      {/* ============================================================ */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h4 className="text-xs font-black text-neutral-900 flex items-center gap-1.5">
                <ImageIcon size={14} className="text-[#DA9B26]" />
                <span>Insert Article Image</span>
              </h4>
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={applyImage} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Image URL <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  autoFocus
                  required
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-mono outline-none focus:border-[#5C0F17] focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Alt Caption <span className="text-neutral-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Description of image"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-medium outline-none focus:border-[#5C0F17] focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setImageModalOpen(false)}
                  className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-xl bg-[#5C0F17] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#4A0D15] shadow-xs"
                >
                  <Check size={13} />
                  <span>Insert Image</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
