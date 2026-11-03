import { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  UploadCloud,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Heading,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Link2,
  Image as ImageIcon,
  Minus,
  RefreshCw,
  FileText,
} from "lucide-react";
import { blogService, BLOG_CATEGORIES } from "../services/blogService";
import { uploadService } from "../services/uploadService";
import { resolveImageUrl } from "../utils/imageHelper";

const INITIAL_FORM = {
  title: "",
  slug: "",
  category: "",
  shortDescription: "",
  coverImage: "",
  content: "",
  seoTitle: "",
  seoDescription: "",
  status: "draft",
};

// Helper to slugify a title string
const generateSlug = (text) =>
  (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function BlogPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({ total: 0, totalPublished: 0, totalDrafts: 0 });

  // Modal / Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);
  const [contentTab, setContentTab] = useState("edit"); // "edit" | "preview"
  const [uploadingCover, setUploadingCover] = useState(false);
  const contentTextareaRef = useRef(null);

  // Delete Confirmation State
  const [deletingArticle, setDeletingArticle] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch articles from backend
  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await blogService.getAll({
        page,
        limit: 10,
        search,
        category: categoryFilter,
        status: statusFilter,
      });

      if (res && res.success) {
        setArticles(res.articles || []);
        if (res.pagination) {
          setTotalPages(res.pagination.pages || 1);
        }
        if (res.summary) {
          setSummary(res.summary);
        }
      }
    } catch (err) {
      console.error("Fetch articles error:", err);
      setError(err.message || "Failed to load blog articles from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [page, categoryFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchArticles();
  };

  const handleResetFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("all");
    setPage(1);
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingArticle(null);
    setFormData(INITIAL_FORM);
    setFieldErrors({});
    setAutoSlug(true);
    setContentTab("edit");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title || "",
      slug: article.slug || "",
      category: article.category || "",
      shortDescription: article.shortDescription || "",
      coverImage: article.coverImage || "",
      content: article.content || "",
      seoTitle: article.seoTitle || "",
      seoDescription: article.seoDescription || "",
      status: article.status || "draft",
    });
    setFieldErrors({});
    setAutoSlug(false);
    setContentTab("edit");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingArticle(null);
    setFormData(INITIAL_FORM);
    setFieldErrors({});
    setFormSubmitting(false);
  };

  // Handle Input Changes with Error Clearing & Auto-slug
  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "title" && autoSlug && !editingArticle) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });

    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  // Cover Image Upload Handler
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      const res = await uploadService.uploadImage(file, "blog");
      if (res && res.url) {
        handleInputChange("coverImage", res.url);
      }
    } catch (err) {
      console.error("Cover upload error:", err);
      setFieldErrors((prev) => ({
        ...prev,
        coverImage: err.message || "Failed to upload image. JPG, PNG, and WebP up to 5MB allowed.",
      }));
    } finally {
      setUploadingCover(false);
    }
  };

  // Content Toolbar Actions (Insert Markdown / HTML snippets)
  const insertContentSnippet = (before, after = "") => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = formData.content || "";
    const selected = current.substring(start, end);

    const replacement = `${before}${selected || "Sample text"}${after}`;
    const newContent = current.substring(0, start) + replacement + current.substring(end);

    handleInputChange("content", newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + (selected ? selected.length : "Sample text".length)
      );
    }, 10);
  };

  // Insert Image in content via prompt or upload
  const handleInsertImage = async () => {
    const url = prompt("Enter image URL (e.g. from /uploads or external HTTPS link):");
    if (url && url.trim()) {
      insertContentSnippet(`<img src="${url.trim()}" alt="Article Illustration" class="rounded-xl my-4 shadow-sm w-full" />\n`);
    }
  };

  // Insert Link in content
  const handleInsertLink = () => {
    const url = prompt("Enter URL:", "https://");
    if (url && url.trim()) {
      insertContentSnippet(`<a href="${url.trim()}" class="text-[#DA9B26] font-semibold underline hover:text-[#5C0F17]" target="_blank">`, "</a>");
    }
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = "Article title is required.";
    } else if (formData.title.trim().length < 2) {
      errors.title = "Article title must be at least 2 characters.";
    } else if (formData.title.trim().length > 80) {
      errors.title = "Article title cannot exceed 80 characters.";
    }

    if (!formData.slug.trim()) {
      errors.slug = "Slug is required.";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug.trim())) {
      errors.slug = "Slug must contain only lowercase letters, numbers, and hyphens without spaces.";
    } else if (formData.slug.trim().length > 100) {
      errors.slug = "Slug cannot exceed 100 characters.";
    }

    if (!formData.category.trim()) {
      errors.category = "Please select a valid category.";
    } else if (!BLOG_CATEGORIES.includes(formData.category.trim())) {
      errors.category = "Please select a valid approved category.";
    }

    if (!formData.shortDescription.trim()) {
      errors.shortDescription = "Short description is required.";
    } else if (formData.shortDescription.trim().length < 5) {
      errors.shortDescription = "Short description must be at least 5 characters.";
    } else if (formData.shortDescription.trim().length > 180) {
      errors.shortDescription = "Short description cannot exceed 180 characters.";
    }

    if (!formData.coverImage.trim()) {
      errors.coverImage = "Cover image is required.";
    }

    if (!formData.content.trim()) {
      errors.content = "Article content is required.";
    } else if (formData.content.trim().length < 10) {
      errors.content = "Article content must be at least 10 characters.";
    } else if (formData.content.trim().length > 20000) {
      errors.content = "Article content cannot exceed 20,000 characters.";
    }

    if (formData.seoTitle && formData.seoTitle.trim().length > 70) {
      errors.seoTitle = "SEO title cannot exceed 70 characters.";
    }

    if (formData.seoDescription && formData.seoDescription.trim().length > 160) {
      errors.seoDescription = "SEO description cannot exceed 160 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler (Create or Update)
  const handleSubmit = async (targetStatus) => {
    if (!validateForm()) return;

    try {
      setFormSubmitting(true);
      const payload = {
        ...formData,
        status: targetStatus || formData.status,
      };

      if (editingArticle) {
        await blogService.update(editingArticle._id, payload);
        setSuccessMessage(`Article "${payload.title}" updated successfully.`);
      } else {
        await blogService.create(payload);
        setSuccessMessage(`Article "${payload.title}" created successfully as ${payload.status}.`);
      }

      closeModal();
      fetchArticles();
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      console.error("Save article error:", err);
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      } else {
        setError(err.message || "Failed to save blog article.");
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle Status (Publish / Unpublish)
  const handleToggleStatus = async (article) => {
    const newStatus = article.status === "published" ? "draft" : "published";
    try {
      await blogService.updateStatus(article._id, newStatus);
      setSuccessMessage(
        `Article "${article.title}" is now ${newStatus === "published" ? "Published live" : "saved as Draft"}.`
      );
      fetchArticles();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error("Toggle status error:", err);
      setError(err.message || "Failed to update article status.");
    }
  };

  // Soft Delete Article
  const handleConfirmDelete = async () => {
    if (!deletingArticle) return;
    try {
      setIsDeleting(true);
      await blogService.delete(deletingArticle._id);
      setSuccessMessage(`Article "${deletingArticle.title}" archived successfully.`);
      setDeletingArticle(null);
      fetchArticles();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error("Delete article error:", err);
      setError(err.message || "Failed to delete article.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="text-[#DA9B26]" size={22} />
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Pujaveda Journal Articles
            </h1>
          </div>
          <p className="mt-1 text-xs text-neutral-500 font-medium">
            Manage editorial articles, sacred guides, and Vedic knowledge publications.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5C0F17] px-4 py-2.5 text-xs font-bold text-[#FFFDF9] hover:bg-[#4A0D15] shadow-sm transition active:scale-95"
        >
          <Plus size={16} /> Write New Article
        </button>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="text-emerald-600 hover:text-emerald-900"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-bold text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-600 hover:text-rose-900"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. Overview Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FAF5ED] text-[#5C0F17] border border-[#DA9B26]/30">
            <FileText size={22} className="text-[#5C0F17]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-neutral-400 block">Total Articles</span>
            <span className="text-2xl font-black text-neutral-900 font-mono mt-0.5 block">
              {summary.total || 0}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle2 size={22} className="text-emerald-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-neutral-400 block">Published Live</span>
            <span className="text-2xl font-black text-neutral-900 font-mono mt-0.5 block">
              {summary.totalPublished || 0}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 border border-amber-100">
            <Clock size={22} className="text-amber-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-neutral-400 block">Drafts</span>
            <span className="text-2xl font-black text-neutral-900 font-mono mt-0.5 block">
              {summary.totalDrafts || 0}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Filters Toolbar & Listing Table */}
      <section className="rounded-3xl border border-neutral-200/80 bg-white shadow-xs overflow-hidden">
        {/* Search & Filter Controls */}
        <div className="border-b border-neutral-100 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base font-black text-neutral-900">Articles Catalog</h2>
              <p className="text-xs text-neutral-500">
                Filter articles by category or publication state.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchArticles}
              className="inline-flex items-center gap-1.5 self-start rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
            <form onSubmit={handleSearchSubmit} className="md:col-span-2 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={15} />
              <input
                type="text"
                maxLength={100}
                placeholder="Search articles by title, slug, or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-xs font-medium outline-none focus:border-[#5C0F17] focus:bg-white"
              />
            </form>

            <div>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs font-medium outline-none focus:border-[#5C0F17] focus:bg-white"
              >
                <option value="">All Categories</option>
                {BLOG_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs font-medium outline-none focus:border-[#5C0F17] focus:bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published Live</option>
                <option value="draft">Drafts Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Articles Table */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#5C0F17] border-t-transparent" />
              <p className="text-xs font-semibold text-neutral-400">Loading articles...</p>
            </div>
          </div>
        ) : articles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-100 bg-neutral-50/70 text-neutral-500 font-semibold">
                <tr>
                  <th className="px-5 py-4 font-bold whitespace-nowrap">Article</th>
                  <th className="px-5 py-4 font-bold whitespace-nowrap">Category</th>
                  <th className="px-5 py-4 font-bold whitespace-nowrap text-center">Status</th>
                  <th className="px-5 py-4 font-bold whitespace-nowrap">Dates</th>
                  <th className="px-5 py-4 font-bold whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {articles.map((art) => {
                  const coverSrc = resolveImageUrl(art.coverImage);
                  const isPublished = art.status === "published";

                  return (
                    <tr key={art._id} className="hover:bg-neutral-50/80 transition">
                      {/* Title & Cover */}
                      <td className="px-5 py-4 min-w-[280px]">
                        <div className="flex items-center gap-3">
                          <img
                            src={coverSrc}
                            alt={art.title}
                            className="h-12 w-16 shrink-0 rounded-xl object-cover border border-neutral-200 bg-neutral-100 shadow-xs"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://images.unsplash.com/photo-1609358905561-eb8361093120?auto=format&fit=crop&w=200&q=80";
                            }}
                          />
                          <div>
                            <p className="font-bold text-neutral-900 line-clamp-1 text-sm">
                              {art.title}
                            </p>
                            <p className="font-mono text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
                              /blog/{art.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="rounded-full bg-[#FAF5ED] px-2.5 py-1 text-[11px] font-bold text-[#5C0F17] border border-[#DA9B26]/30">
                          {art.category}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(art)}
                          title={`Click to ${isPublished ? "unpublish and move to draft" : "publish live"}`}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                            isPublished
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200"
                          }`}
                        >
                          {isPublished ? (
                            <>
                              <CheckCircle2 size={12} /> Published
                            </>
                          ) : (
                            <>
                              <Clock size={12} /> Draft
                            </>
                          )}
                        </button>
                      </td>

                      {/* Dates */}
                      <td className="px-5 py-4 whitespace-nowrap text-neutral-500 text-[11px]">
                        <div>
                          <span className="text-neutral-400">Created:</span>{" "}
                          <span className="font-semibold text-neutral-700">
                            {new Date(art.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        {art.publishedAt && (
                          <div className="mt-0.5">
                            <span className="text-neutral-400">Published:</span>{" "}
                            <span className="font-semibold text-emerald-700">
                              {new Date(art.publishedAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(art)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 transition shadow-xs"
                            title="Edit Article"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingArticle(art)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition shadow-xs"
                            title="Delete Article"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <BookOpen size={40} className="mx-auto text-neutral-300" />
            <h3 className="mt-3 text-base font-bold text-neutral-700">No articles found</h3>
            <p className="mt-1 text-xs text-neutral-400 max-w-sm mx-auto">
              No blog articles match your current search criteria or category filter.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 shadow-xs"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-3.5 text-xs font-semibold text-neutral-500">
            <div>
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* 4. Create / Edit Article Modal                               */}
      {/* ============================================================ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-neutral-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 bg-[#FAF6F0]">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[#DA9B26]" />
                <h2 className="text-base font-black text-neutral-900">
                  {editingArticle ? "Edit Blog Article" : "Write New Blog Article"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl p-1.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Row 1: Title & Character Counter */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-neutral-700">
                    Article Title <span className="text-rose-600">*</span>
                  </label>
                  <span className={`text-[11px] font-mono ${formData.title.length > 80 ? "text-rose-600 font-bold" : "text-neutral-400"}`}>
                    {formData.title.length}/80
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={80}
                  placeholder="Enter descriptive article title (e.g. Complete Shravan Puja Rituals at Home)"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className={`w-full rounded-2xl border px-3.5 py-2.5 text-xs font-medium outline-none transition ${
                    fieldErrors.title
                      ? "border-rose-500 bg-rose-50/30 text-rose-900"
                      : "border-neutral-200 bg-neutral-50/50 focus:border-[#5C0F17] focus:bg-white"
                  }`}
                />
                {fieldErrors.title && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600">{fieldErrors.title}</p>
                )}
              </div>

              {/* Row 2: Slug & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Slug */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-neutral-700">
                      URL Slug <span className="text-rose-600">*</span>
                    </label>
                    <span className="text-[11px] font-mono text-neutral-400">
                      {formData.slug.length}/100
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={100}
                    placeholder="e.g. complete-shravan-puja-rituals"
                    value={formData.slug}
                    onChange={(e) => {
                      setAutoSlug(false);
                      handleInputChange("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"));
                    }}
                    className={`w-full rounded-2xl border px-3.5 py-2.5 text-xs font-mono transition ${
                      fieldErrors.slug
                        ? "border-rose-500 bg-rose-50/30 text-rose-900"
                        : "border-neutral-200 bg-neutral-50/50 focus:border-[#5C0F17] focus:bg-white"
                    }`}
                  />
                  {fieldErrors.slug ? (
                    <p className="mt-1 text-[11px] font-semibold text-rose-600">{fieldErrors.slug}</p>
                  ) : (
                    <p className="mt-1 text-[10px] text-neutral-400 font-mono">
                      Public URL: /blog/{formData.slug || "slug-preview"}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-neutral-700">
                      Category <span className="text-rose-600">*</span>
                    </label>
                  </div>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange("category", e.target.value)}
                    className={`w-full rounded-2xl border px-3.5 py-2.5 text-xs font-medium transition ${
                      fieldErrors.category
                        ? "border-rose-500 bg-rose-50/30 text-rose-900"
                        : "border-neutral-200 bg-neutral-50/50 focus:border-[#5C0F17] focus:bg-white"
                    }`}
                  >
                    <option value="">Select Blog Category</option>
                    {BLOG_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.category && (
                    <p className="mt-1 text-[11px] font-semibold text-rose-600">{fieldErrors.category}</p>
                  )}
                </div>
              </div>

              {/* Row 3: Short Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-neutral-700">
                    Short Description <span className="text-rose-600">*</span>
                  </label>
                  <span className={`text-[11px] font-mono ${formData.shortDescription.length > 180 ? "text-rose-600 font-bold" : "text-neutral-400"}`}>
                    {formData.shortDescription.length}/180
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={180}
                  placeholder="Provide an editorial summary of the article (displayed on article cards & preview snippets)"
                  value={formData.shortDescription}
                  onChange={(e) => handleInputChange("shortDescription", e.target.value)}
                  className={`w-full rounded-2xl border px-3.5 py-2 text-xs font-medium outline-none transition ${
                    fieldErrors.shortDescription
                      ? "border-rose-500 bg-rose-50/30 text-rose-900"
                      : "border-neutral-200 bg-neutral-50/50 focus:border-[#5C0F17] focus:bg-white"
                  }`}
                />
                {fieldErrors.shortDescription && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600">{fieldErrors.shortDescription}</p>
                )}
              </div>

              {/* Row 4: Cover Image Upload & Preview */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Cover Image <span className="text-rose-600">*</span>
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-neutral-200 p-4 bg-neutral-50/40">
                  {formData.coverImage ? (
                    <div className="relative group shrink-0">
                      <img
                        src={resolveImageUrl(formData.coverImage)}
                        alt="Cover Preview"
                        className="h-24 w-36 rounded-xl object-cover border border-neutral-200 shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleInputChange("coverImage", "")}
                        className="absolute -top-2 -right-2 rounded-full bg-rose-600 p-1 text-white shadow-md hover:bg-rose-700 transition"
                        title="Remove Image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-24 w-36 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-white text-neutral-400">
                      <ImageIcon size={28} />
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-[#DA9B26]/40 bg-[#FAF5ED] px-3.5 py-2 text-xs font-bold text-[#5C0F17] hover:bg-[#F3E9DA] transition shadow-xs">
                        <UploadCloud size={14} className="text-[#DA9B26]" />
                        {uploadingCover ? "Uploading..." : "Upload New Cover Image"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleCoverUpload}
                          disabled={uploadingCover}
                        />
                      </label>
                      <span className="text-[11px] text-neutral-400">or enter image path</span>
                    </div>

                    <input
                      type="text"
                      placeholder="https://example.com/image.jpg or /uploads/blog/..."
                      value={formData.coverImage}
                      onChange={(e) => handleInputChange("coverImage", e.target.value)}
                      className={`w-full rounded-xl border px-3 py-1.5 text-xs font-mono outline-none ${
                        fieldErrors.coverImage
                          ? "border-rose-500 bg-rose-50/30 text-rose-900"
                          : "border-neutral-200 bg-white focus:border-[#5C0F17]"
                      }`}
                    />
                  </div>
                </div>
                {fieldErrors.coverImage && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600">{fieldErrors.coverImage}</p>
                )}
              </div>

              {/* Row 5: Article Content Editor with Toolbar & Live Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-neutral-700">
                      Article Content <span className="text-rose-600">*</span>
                    </label>
                    <div className="flex rounded-lg border border-neutral-200 bg-neutral-100 p-0.5 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setContentTab("edit")}
                        className={`rounded-md px-2.5 py-1 text-[11px] transition ${
                          contentTab === "edit" ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-500"
                        }`}
                      >
                        Editor
                      </button>
                      <button
                        type="button"
                        onClick={() => setContentTab("preview")}
                        className={`rounded-md px-2.5 py-1 text-[11px] transition ${
                          contentTab === "preview" ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-500"
                        }`}
                      >
                        Live Preview
                      </button>
                    </div>
                  </div>
                  <span className={`text-[11px] font-mono ${formData.content.length > 20000 ? "text-rose-600 font-bold" : "text-neutral-400"}`}>
                    {formData.content.length}/20,000
                  </span>
                </div>

                {contentTab === "edit" ? (
                  <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden focus-within:border-[#5C0F17] transition shadow-xs">
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 border-b border-neutral-200 bg-[#FAF6F0] p-1.5 text-neutral-700">
                      <button
                        type="button"
                        onClick={() => insertContentSnippet("<h2>", "</h2>\n")}
                        className="rounded-lg p-1.5 hover:bg-white text-xs font-bold text-neutral-700"
                        title="Heading 2"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => insertContentSnippet("<h3>", "</h3>\n")}
                        className="rounded-lg p-1.5 hover:bg-white text-xs font-bold text-neutral-700"
                        title="Heading 3"
                      >
                        H3
                      </button>
                      <div className="h-4 w-px bg-neutral-300 mx-1" />
                      <button
                        type="button"
                        onClick={() => insertContentSnippet("<strong>", "</strong>")}
                        className="rounded-lg p-1.5 hover:bg-white text-neutral-700"
                        title="Bold"
                      >
                        <Bold size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertContentSnippet("<em>", "</em>")}
                        className="rounded-lg p-1.5 hover:bg-white text-neutral-700"
                        title="Italic"
                      >
                        <Italic size={14} />
                      </button>
                      <div className="h-4 w-px bg-neutral-300 mx-1" />
                      <button
                        type="button"
                        onClick={() => insertContentSnippet("<ul>\n  <li>", "</li>\n</ul>\n")}
                        className="rounded-lg p-1.5 hover:bg-white text-neutral-700"
                        title="Bullet List"
                      >
                        <List size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertContentSnippet("<ol>\n  <li>", "</li>\n</ol>\n")}
                        className="rounded-lg p-1.5 hover:bg-white text-neutral-700"
                        title="Numbered List"
                      >
                        <ListOrdered size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertContentSnippet('<blockquote class="border-l-4 border-[#DA9B26] pl-4 italic my-4">\n', "\n</blockquote>\n")}
                        className="rounded-lg p-1.5 hover:bg-white text-neutral-700"
                        title="Blockquote"
                      >
                        <Quote size={14} />
                      </button>
                      <div className="h-4 w-px bg-neutral-300 mx-1" />
                      <button
                        type="button"
                        onClick={handleInsertLink}
                        className="rounded-lg p-1.5 hover:bg-white text-neutral-700"
                        title="Insert Link"
                      >
                        <Link2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={handleInsertImage}
                        className="rounded-lg p-1.5 hover:bg-white text-neutral-700"
                        title="Insert Image"
                      >
                        <ImageIcon size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertContentSnippet('<hr class="my-6 border-[#EEDBC5]" />\n')}
                        className="rounded-lg p-1.5 hover:bg-white text-neutral-700"
                        title="Horizontal Rule"
                      >
                        <Minus size={14} />
                      </button>
                    </div>

                    <textarea
                      ref={contentTextareaRef}
                      rows={10}
                      maxLength={20000}
                      placeholder="Write your article content using HTML formatting or rich text tags (paragraphs, headings, lists, links, images)..."
                      value={formData.content}
                      onChange={(e) => handleInputChange("content", e.target.value)}
                      className="w-full p-4 text-xs font-mono outline-none bg-white leading-relaxed resize-y"
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-neutral-200 bg-white p-6 min-h-[250px] max-h-[400px] overflow-y-auto">
                    {formData.content ? (
                      <div
                        className="prose prose-sm max-w-none text-neutral-800 space-y-4"
                        dangerouslySetInnerHTML={{ __html: formData.content }}
                      />
                    ) : (
                      <p className="text-neutral-400 italic text-center py-12">
                        No content written yet. Switch back to Editor mode to write your article.
                      </p>
                    )}
                  </div>
                )}

                {fieldErrors.content && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600">{fieldErrors.content}</p>
                )}
              </div>

              {/* Row 6: SEO Accordion Section */}
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50/50 p-4 space-y-3">
                <p className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#DA9B26]" /> Search Engine Optimization (SEO)
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-neutral-600">SEO Meta Title</label>
                      <span className="text-[10px] font-mono text-neutral-400">{formData.seoTitle.length}/70</span>
                    </div>
                    <input
                      type="text"
                      maxLength={70}
                      placeholder="Leave blank to use Article Title automatically"
                      value={formData.seoTitle}
                      onChange={(e) => handleInputChange("seoTitle", e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#5C0F17]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-neutral-600">SEO Meta Description</label>
                      <span className="text-[10px] font-mono text-neutral-400">{formData.seoDescription.length}/160</span>
                    </div>
                    <input
                      type="text"
                      maxLength={160}
                      placeholder="Leave blank to use Short Description automatically"
                      value={formData.seoDescription}
                      onChange={(e) => handleInputChange("seoDescription", e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#5C0F17]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-6 py-4 bg-[#FAF6F0]">
              <button
                type="button"
                onClick={closeModal}
                disabled={formSubmitting}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={formSubmitting}
                  onClick={() => handleSubmit("draft")}
                  className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-xs disabled:opacity-50"
                >
                  {formSubmitting ? "Saving..." : "Save as Draft"}
                </button>

                <button
                  type="button"
                  disabled={formSubmitting}
                  onClick={() => handleSubmit("published")}
                  className="rounded-xl bg-[#5C0F17] px-4 py-2 text-xs font-bold text-white hover:bg-[#4A0D15] transition shadow-xs disabled:opacity-50"
                >
                  {formSubmitting ? "Publishing..." : "Publish Article"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. Soft Delete Confirmation Modal                            */}
      {/* ============================================================ */}
      {deletingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-neutral-200 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-base font-black text-neutral-900">Archive Blog Article?</h3>
            <p className="mt-2 text-xs text-neutral-500 leading-relaxed">
              Are you sure you want to delete <b className="text-neutral-800">"{deletingArticle.title}"</b>? It will be safely archived and hidden from public visitors.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingArticle(null)}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-xs disabled:opacity-50"
              >
                {isDeleting ? "Archiving..." : "Yes, Archive Article"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

