import { useState, useEffect } from "react";
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3,
  Save,
  Globe,
  Lock,
  RefreshCw,
} from "lucide-react";
import { legalService } from "../services/legalService";
import RichTextEditor from "../components/common/RichTextEditor";

export default function LegalPagesPage() {
  const [activeSlug, setActiveSlug] = useState("terms-and-conditions");
  const [pages, setPages] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [viewMode, setViewMode] = useState("edit"); // "edit" | "preview"

  // Current page state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  const fetchPages = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await legalService.getAll();
      const map = {};
      data.forEach((p) => {
        map[p.slug] = p;
      });
      setPages(map);

      // Load active page into form
      const current = map[activeSlug];
      if (current) {
        setTitle(current.title || "");
        setContent(current.content || "");
        setIsPublished(current.isPublished !== false);
      }
    } catch (err) {
      console.error("Fetch legal pages error:", err);
      setError(err.message || "Failed to load legal pages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  // When tab changes, update form values
  const handleSelectTab = (slug) => {
    setActiveSlug(slug);
    setViewMode("edit");
    setError("");
    setSuccess("");
    const target = pages[slug];
    if (target) {
      setTitle(target.title || "");
      setContent(target.content || "");
      setIsPublished(target.isPublished !== false);
    } else {
      setTitle(slug === "terms-and-conditions" ? "Terms and Conditions" : "Privacy Policy");
      setContent("");
      setIsPublished(true);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a title for this legal page.");
      return;
    }
    if (!content.trim() || content.trim().length < 10) {
      setError("Please provide meaningful content for this legal page (minimum 10 characters).");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updated = await legalService.update(activeSlug, {
        title: title.trim(),
        content: content.trim(),
        isPublished,
      });

      setPages((prev) => ({
        ...prev,
        [activeSlug]: updated,
      }));

      setSuccess(`✓ ${updated.title} saved and updated successfully.`);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error("Save legal page error:", err);
      setError(err.message || "Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const currentPageData = pages[activeSlug];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2.5">
            <FileText className="text-[#5C0F17]" size={24} />
            Legal Pages
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Manage Terms & Conditions and Privacy Policy displayed on the Customer storefront.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPages}
          disabled={loading || saving}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition shadow-2xs"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs font-semibold text-rose-800">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs font-semibold text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Page Tabs: Terms & Conditions vs Privacy Policy */}
      <div className="flex flex-wrap items-center gap-3 border-b border-neutral-200 pb-3">
        {[
          { slug: "terms-and-conditions", label: "Terms & Conditions" },
          { slug: "privacy-policy", label: "Privacy Policy" },
        ].map((tab) => {
          const isSelected = activeSlug === tab.slug;
          const pageItem = pages[tab.slug];
          const isPub = pageItem ? pageItem.isPublished : true;

          return (
            <button
              key={tab.slug}
              type="button"
              onClick={() => handleSelectTab(tab.slug)}
              className={`flex items-center gap-2.5 rounded-2xl px-5 py-3 text-xs sm:text-sm font-bold transition shadow-2xs ${
                isSelected
                  ? "bg-[#5C0F17] text-white shadow-xs"
                  : "bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                  isSelected
                    ? isPub
                      ? "bg-emerald-500/30 text-emerald-100"
                      : "bg-amber-500/40 text-amber-100"
                    : isPub
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {isPub ? "Published" : "Draft"}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="rounded-3xl border border-neutral-200/80 bg-white p-12 text-center">
          <RefreshCw size={24} className="mx-auto animate-spin text-[#5C0F17]" />
          <p className="mt-3 text-xs font-bold text-neutral-600">Loading legal document content...</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          {/* Top Controls: Title, Publish Toggle, View Mode */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end pb-6 border-b border-neutral-200">
            {/* Title Input */}
            <div className="lg:col-span-6">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 block mb-1.5">
                Page Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Terms and Conditions"
                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-900 outline-none focus:border-[#5C0F17] focus:ring-2 focus:ring-[#5C0F17]/10"
              />
            </div>

            {/* Publication Status Switch */}
            <div className="lg:col-span-3">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 block mb-1.5">
                Publication Status
              </label>
              <button
                type="button"
                onClick={() => setIsPublished(!isPublished)}
                className={`flex w-full items-center justify-between rounded-2xl border p-2.5 text-xs font-bold transition ${
                  isPublished
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {isPublished ? <Globe size={15} /> : <Lock size={15} />}
                  <span>{isPublished ? "Published (Live on Store)" : "Draft (Unpublished)"}</span>
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] shadow-2xs font-mono">
                  {isPublished ? "ON" : "OFF"}
                </span>
              </button>
            </div>

            {/* View Mode Toggle: Edit vs Preview */}
            <div className="lg:col-span-3 flex items-center gap-2">
              <div className="flex w-full rounded-2xl border border-neutral-200 bg-neutral-100 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("edit")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
                    viewMode === "edit"
                      ? "bg-white text-neutral-900 shadow-xs"
                      : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  <Edit3 size={14} />
                  <span>Editor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("preview")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
                    viewMode === "preview"
                      ? "bg-white text-neutral-900 shadow-xs"
                      : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  <Eye size={14} />
                  <span>Preview</span>
                </button>
              </div>
            </div>
          </div>

          {/* Editor or Preview Pane */}
          {viewMode === "edit" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                  Document Content (WYSIWYG Rich-Text Editor) *
                </label>
                <span className="text-[11px] text-neutral-400">
                  Supports Headings, Bold, Italic, Bullet Lists, Numbered Lists, Quotes, and Links
                </span>
              </div>

              <div className="rounded-2xl border border-neutral-200 overflow-hidden">
                <RichTextEditor
                  value={content}
                  onChange={(val) => setContent(val)}
                  placeholder={`Write the official ${title || "legal content"} here...`}
                  minHeight="420px"
                />
              </div>
            </div>
          ) : (
            /* Live Devotee Preview Pane */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span className="font-bold uppercase tracking-wider">
                  Live Devotee Storefront Preview
                </span>
                <span>Rendered with Customer typography and theme</span>
              </div>

              <div className="rounded-3xl border border-[#EEDBC5] bg-[#FFFDF9] p-6 sm:p-10 shadow-xs">
                <div className="border-b border-[#EEDBC5] pb-5 mb-6">
                  <h2 className="font-serif text-2xl sm:text-3xl font-black text-[#5C0F17]">
                    {title || "Untitled Document"}
                  </h2>
                  <p className="text-xs text-[#756255] mt-1 font-semibold">
                    Last published: {currentPageData?.publishedAt ? new Date(currentPageData.publishedAt).toLocaleDateString("en-IN", { dateStyle: "long" }) : "Today"} • Pujaveda Official Legal
                  </p>
                </div>

                <div
                  className="prose prose-sm max-w-none text-neutral-700 leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{ __html: content || "<p><i>No content written yet.</i></p>" }}
                />
              </div>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-neutral-200">
            <div className="text-xs text-neutral-400">
              Canonical Storefront URL:{" "}
              <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] text-neutral-700">
                /{activeSlug}
              </code>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-[#5C0F17] hover:bg-[#43080E] px-8 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#5C0F17]/20 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Saving Document...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

