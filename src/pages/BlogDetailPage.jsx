import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sparkles,
  ChevronRight,
  BookOpen,
  RefreshCw,
  X,
  Send,
  FileText,
} from "lucide-react";
import { blogService } from "../services/blogService";
import { uploadService } from "../services/uploadService";
import { resolveImageUrl } from "../utils/imageHelper";
import ArticleContentRenderer from "../components/common/ArticleContentRenderer";
import RichTextEditor from "../components/common/RichTextEditor";

export default function BlogDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successToast, setSuccessToast] = useState("");

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [editFieldErrors, setEditFieldErrors] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [contentTab, setContentTab] = useState("edit"); // "edit" | "preview"
  const [uploadingCover, setUploadingCover] = useState(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // 1. Fetch Article from Backend
  const fetchArticle = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await blogService.getById(id);
      if (data) {
        setArticle(data);
      } else {
        setError("Article not found in database.");
      }
    } catch (err) {
      console.error("Fetch article by ID error:", err);
      setError(err.message || "Failed to load article details from server.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Categories for Edit Modal
  const fetchCategories = async () => {
    try {
      const cats = await blogService.getAdminCategories();
      setCategories(cats || []);
    } catch (err) {
      console.error("Fetch categories error:", err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchArticle();
      fetchCategories();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [id]);

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  // Toggle Publish / Draft Status
  const handleToggleStatus = async () => {
    if (!article) return;
    const nextStatus = article.status === "published" ? "draft" : "published";
    try {
      setActionLoading(true);
      await blogService.updateStatus(article._id, nextStatus);
      setArticle((prev) => ({
        ...prev,
        status: nextStatus,
        publishedAt: nextStatus === "published" ? (prev.publishedAt || new Date()) : prev.publishedAt,
      }));
      showToast(
        nextStatus === "published"
          ? "Article published live! Devotees can now view it."
          : "Article unpublished and reverted to Draft."
      );
    } catch (err) {
      console.error("Toggle status error:", err);
      setError(err.message || "Failed to update article status.");
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!article) return;
    try {
      setActionLoading(true);
      await blogService.delete(article._id);
      setDeleteModalOpen(false);
      navigate("/blog", {
        replace: true,
        state: { notice: `Article "${article.title}" archived successfully.` },
      });
    } catch (err) {
      console.error("Delete article error:", err);
      setError(err.message || "Failed to delete article.");
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = () => {
    if (!article) return;
    setEditFormData({
      title: article.title || "",
      slug: article.slug || "",
      category: article.category || "",
      categoryId: article.categoryId || null,
      shortDescription: article.shortDescription || "",
      coverImage: article.coverImage || "",
      content: article.content || "",
      seoTitle: article.seoTitle || "",
      seoDescription: article.seoDescription || "",
      status: article.status || "draft",
    });
    setEditFieldErrors({});
    setContentTab("edit");
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditFormData(null);
    setEditFieldErrors({});
    setEditSubmitting(false);
  };

  const handleEditInputChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
    if (editFieldErrors[field]) {
      setEditFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      const res = await uploadService.uploadImage(file, "blog");
      if (res && res.url) {
        handleEditInputChange("coverImage", res.url);
      }
    } catch (err) {
      console.error("Cover upload error:", err);
      setEditFieldErrors((prev) => ({
        ...prev,
        coverImage: err.message || "Failed to upload image.",
      }));
    } finally {
      setUploadingCover(false);
    }
  };

  const validateEditForm = () => {
    const errors = {};
    const title = (editFormData.title || "").trim();
    const slug = (editFormData.slug || "").trim();
    const category = (editFormData.category || "").trim();
    const shortDesc = (editFormData.shortDescription || "").trim();
    const cover = (editFormData.coverImage || "").trim();
    const content = (editFormData.content || "").trim();

    if (!title) errors.title = "Article title is required.";
    else if (title.length < 2) errors.title = "Title must be at least 2 characters.";
    else if (title.length > 80) errors.title = "Title cannot exceed 80 characters.";

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slug) errors.slug = "Slug is required.";
    else if (!slugRegex.test(slug)) errors.slug = "Slug must contain only lowercase letters, numbers, and single hyphens.";

    if (!category) errors.category = "Please select a category.";

    if (!shortDesc) errors.shortDescription = "Short description is required.";
    else if (shortDesc.length < 5) errors.shortDescription = "Short description must be at least 5 characters.";
    else if (shortDesc.length > 180) errors.shortDescription = "Short description cannot exceed 180 characters.";

    if (!cover) errors.coverImage = "Cover image is required.";
    if (!content || content.length < 10) errors.content = "Article content is required (at least 10 characters).";

    setEditFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateEditForm()) return;

    try {
      setEditSubmitting(true);
      setError(null);

      const payload = {
        title: editFormData.title.trim(),
        slug: editFormData.slug.trim().toLowerCase(),
        category: editFormData.category.trim(),
        categoryId: editFormData.categoryId || null,
        shortDescription: editFormData.shortDescription.trim(),
        coverImage: editFormData.coverImage.trim(),
        content: editFormData.content.trim(),
        seoTitle: (editFormData.seoTitle || "").trim(),
        seoDescription: (editFormData.seoDescription || "").trim(),
        status: editFormData.status,
      };

      await blogService.update(article._id, payload);
      setArticle((prev) => ({ ...prev, ...payload }));
      closeEditModal();
      showToast("Article updated successfully.");
    } catch (err) {
      console.error("Save article error:", err);
      if (err.data && typeof err.data === "object") {
        setEditFieldErrors(err.data);
      } else {
        setError(err.message || "Failed to update article.");
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  // Estimate reading time in minutes
  const readingTime = article?.content
    ? Math.max(1, Math.round(article.content.replace(/<[^>]+>/g, "").split(/\s+/).length / 200))
    : 3;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#5C0F17] border-t-transparent" />
          <p className="text-xs font-semibold text-neutral-500">Loading article preview...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto my-8">
        <button
          type="button"
          onClick={() => navigate("/blog")}
          className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 shadow-xs transition"
        >
          <ArrowLeft size={14} /> Back to Blog Articles
        </button>

        <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-8 text-center space-y-3">
          <AlertCircle size={36} className="mx-auto text-rose-600" />
          <h2 className="text-base font-bold text-neutral-800">Article Not Found</h2>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            {error || "The requested article could not be retrieved from the database."}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={fetchArticle}
              className="rounded-xl bg-[#5C0F17] px-4 py-2 text-xs font-bold text-white hover:bg-[#4A0D15] transition"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  const coverSrc = resolveImageUrl(article.coverImage);
  const formattedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : new Date(article.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

  return (
    <div className="space-y-6 pb-16">
      {/* ============================================================ */}
      {/* 1. ADMIN TOP CONTROL TOOLBAR                                  */}
      {/* ============================================================ */}
      <div className="sticky top-0 z-30 rounded-2xl border border-neutral-200/80 bg-white/95 backdrop-blur-md p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Left: Back Link & Status Badge */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/blog")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 shadow-xs transition"
          >
            <ArrowLeft size={14} /> Back to Articles
          </button>

          <div className="h-5 w-px bg-neutral-200 hidden sm:block" />

          {/* Status Badge */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              article.status === "published"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                article.status === "published" ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            {article.status === "published" ? "Published Live" : "Draft (Unlisted)"}
          </span>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View as Customer */}
          {article.status === "published" ? (
            <a
              href={`http://localhost:5173/blog/${article.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#DA9B26]/40 bg-[#FAF5ED] px-3.5 py-2 text-xs font-bold text-[#5C0F17] hover:bg-[#F3E9DA] shadow-xs transition"
            >
              <ExternalLink size={14} className="text-[#DA9B26]" />
              <span>View as Customer</span>
            </a>
          ) : (
            <span
              title="Draft articles cannot be viewed by public customers until published"
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-100 px-3.5 py-2 text-xs font-bold text-neutral-400 cursor-not-allowed"
            >
              <Eye size={14} />
              <span>Customer View (Draft)</span>
            </span>
          )}

          {/* Edit Article */}
          <button
            type="button"
            onClick={openEditModal}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 shadow-xs transition"
          >
            <Edit3 size={14} />
            <span>Edit Article</span>
          </button>

          {/* Publish / Unpublish Toggle */}
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={actionLoading}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-xs transition disabled:opacity-50 ${
              article.status === "published"
                ? "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {actionLoading ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : article.status === "published" ? (
              <X size={14} />
            ) : (
              <Send size={14} />
            )}
            <span>{article.status === "published" ? "Unpublish to Draft" : "Publish Live"}</span>
          </button>

          {/* Delete Action */}
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 shadow-xs transition"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-800 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast("")}
            className="text-emerald-600 hover:text-emerald-900"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. CUSTOMER-IDENTICAL ARTICLE PREVIEW CONTAINER               */}
      {/* ============================================================ */}
      <article className="rounded-3xl border border-[#EEDBC5] bg-[#FFFDF9] shadow-sm overflow-hidden">
        {/* Breadcrumb Strip */}
        <div className="border-b border-[#EEDBC5] bg-[#FFF8EE] px-6 py-3.5">
          <div className="mx-auto max-w-4xl flex items-center gap-2 text-xs font-semibold text-neutral-500 overflow-x-auto">
            <span className="shrink-0 text-neutral-400">Pujaveda</span>
            <ChevronRight size={12} className="shrink-0 text-neutral-400" />
            <span className="shrink-0 text-[#5C0F17] font-bold">Blog</span>
            <ChevronRight size={12} className="shrink-0 text-neutral-400" />
            <span className="shrink-0 text-[#DA9B26] font-bold">{article.category}</span>
            <ChevronRight size={12} className="shrink-0 text-neutral-400" />
            <span className="text-[#2D1C13] font-bold truncate max-w-[250px]">
              {article.title}
            </span>
          </div>
        </div>

        {/* Article Header */}
        <header className="mx-auto max-w-4xl px-6 pt-10 sm:pt-14 space-y-4">
          {/* Category Pill */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF5ED] px-4 py-1 text-xs font-black uppercase tracking-wider text-[#5C0F17] border border-[#DA9B26]/40 shadow-xs">
            <Sparkles size={13} className="text-[#DA9B26]" />
            <span>{article.category}</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#2D1C13] tracking-tight font-serif leading-[1.2]">
            {article.title}
          </h1>

          {/* Short Description */}
          <p className="text-sm sm:text-base text-neutral-600 font-medium leading-relaxed max-w-3xl">
            {article.shortDescription}
          </p>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#EEDBC5]">
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-neutral-500">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-[#DA9B26]" />
                <span>{formattedDate}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-[#DA9B26]" />
                <span>{readingTime} min read</span>
              </div>
              <span>•</span>
              <span>By {article.author || "Pujaveda Editorial"}</span>
            </div>

            <div className="text-[11px] font-mono text-neutral-400">
              Slug: /blog/{article.slug}
            </div>
          </div>

          {/* Large Cover Image */}
          <div className="mt-8 overflow-hidden rounded-3xl border border-[#EEDBC5] bg-neutral-100 shadow-md">
            <img
              src={coverSrc}
              alt={article.title}
              className="w-full max-h-[500px] object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1609137144822-263e8a4a5e3f?auto=format&fit=crop&w=1200&q=80";
              }}
            />
          </div>
        </header>

        {/* 3. Article Body Content */}
        <main className="mx-auto max-w-4xl px-6 pt-10 pb-16">
          <ArticleContentRenderer html={article.content} />

          {/* Editorial Footer Box */}
          <div className="mt-14 pt-8 border-t border-[#EEDBC5] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#FAF5ED] p-6 rounded-3xl">
            <div>
              <h3 className="text-base font-black text-[#5C0F17]">Pujaveda Editorial Journal</h3>
              <p className="text-xs text-neutral-600 mt-0.5">
                Authentic guides on sacred rituals, festival muhurats, and Vedic home mandir traditions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openEditModal}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#5C0F17] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#4A0D15] transition"
              >
                <Edit3 size={13} />
                <span>Edit Article</span>
              </button>
            </div>
          </div>
        </main>
      </article>

      {/* ============================================================ */}
      {/* 4. EDIT ARTICLE MODAL (WITH WYSIWYG RICHTEXTEDITOR)          */}
      {/* ============================================================ */}
      {isEditModalOpen && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-neutral-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 bg-[#FAF6F0]">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-[#DA9B26]" />
                <h2 className="text-base font-black text-neutral-900">
                  Edit Blog Article
                </h2>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-xl p-1.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Row 1: Title */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-neutral-700">
                    Article Title <span className="text-rose-600">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      editFormData.title.length > 80 ? "text-rose-600 font-bold" : "text-neutral-400"
                    }`}
                  >
                    {editFormData.title.length}/80
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={80}
                  value={editFormData.title}
                  onChange={(e) => handleEditInputChange("title", e.target.value)}
                  className={`w-full rounded-2xl border px-3.5 py-2.5 text-xs font-medium transition ${
                    editFieldErrors.title
                      ? "border-rose-500 bg-rose-50/30 text-rose-900"
                      : "border-neutral-200 bg-neutral-50/50 focus:border-[#5C0F17] focus:bg-white"
                  }`}
                />
                {editFieldErrors.title && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600">
                    {editFieldErrors.title}
                  </p>
                )}
              </div>

              {/* Row 2: Slug & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-neutral-700">
                      URL Slug <span className="text-rose-600">*</span>
                    </label>
                    <span
                      className={`text-[11px] font-mono ${
                        editFormData.slug.length > 100 ? "text-rose-600 font-bold" : "text-neutral-400"
                      }`}
                    >
                      {editFormData.slug.length}/100
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={100}
                    value={editFormData.slug}
                    onChange={(e) =>
                      handleEditInputChange("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))
                    }
                    className={`w-full rounded-2xl border px-3.5 py-2.5 text-xs font-mono transition ${
                      editFieldErrors.slug
                        ? "border-rose-500 bg-rose-50/30 text-rose-900"
                        : "border-neutral-200 bg-neutral-50/50 focus:border-[#5C0F17] focus:bg-white"
                    }`}
                  />
                  {editFieldErrors.slug && (
                    <p className="mt-1 text-[11px] font-semibold text-rose-600">
                      {editFieldErrors.slug}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Category <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => {
                      const sel = e.target.value;
                      const matched = categories.find((c) => c.name === sel);
                      handleEditInputChange("category", sel);
                      handleEditInputChange("categoryId", matched ? matched._id : null);
                    }}
                    className={`w-full rounded-2xl border px-3.5 py-2.5 text-xs font-medium transition ${
                      editFieldErrors.category
                        ? "border-rose-500 bg-rose-50/30 text-rose-900"
                        : "border-neutral-200 bg-neutral-50/50 focus:border-[#5C0F17] focus:bg-white"
                    }`}
                  >
                    <option value="">Select Blog Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id || cat.slug} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {editFieldErrors.category && (
                    <p className="mt-1 text-[11px] font-semibold text-rose-600">
                      {editFieldErrors.category}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3: Short Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-neutral-700">
                    Short Description <span className="text-rose-600">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      editFormData.shortDescription.length > 180
                        ? "text-rose-600 font-bold"
                        : "text-neutral-400"
                    }`}
                  >
                    {editFormData.shortDescription.length}/180
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={180}
                  value={editFormData.shortDescription}
                  onChange={(e) => handleEditInputChange("shortDescription", e.target.value)}
                  className={`w-full rounded-2xl border px-3.5 py-2 text-xs font-medium transition ${
                    editFieldErrors.shortDescription
                      ? "border-rose-500 bg-rose-50/30 text-rose-900"
                      : "border-neutral-200 bg-neutral-50/50 focus:border-[#5C0F17] focus:bg-white"
                  }`}
                />
                {editFieldErrors.shortDescription && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600">
                    {editFieldErrors.shortDescription}
                  </p>
                )}
              </div>

              {/* Row 4: Cover Image */}
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Cover Image <span className="text-rose-600">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="text"
                      value={editFormData.coverImage}
                      onChange={(e) => handleEditInputChange("coverImage", e.target.value)}
                      className={`w-full rounded-2xl border px-3.5 py-2.5 text-xs font-mono transition ${
                        editFieldErrors.coverImage
                          ? "border-rose-500 bg-rose-50/30 text-rose-900"
                          : "border-neutral-200 bg-neutral-50/50 focus:border-[#5C0F17] focus:bg-white"
                      }`}
                    />
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 cursor-pointer shadow-xs transition">
                        <span>{uploadingCover ? "Uploading..." : "Upload New File"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverUpload}
                          disabled={uploadingCover}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-neutral-400">
                        Supports JPG, PNG, WebP up to 5MB
                      </span>
                    </div>
                  </div>

                  {editFormData.coverImage && (
                    <div className="h-20 w-32 shrink-0 rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 shadow-xs">
                      <img
                        src={resolveImageUrl(editFormData.coverImage)}
                        alt="Preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Row 5: WYSIWYG Content Editor / Live Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-neutral-700">
                    Article Content <span className="text-rose-600">*</span>
                  </label>
                  <div className="flex items-center gap-1 rounded-xl bg-neutral-100 p-0.5 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setContentTab("edit")}
                      className={`px-3 py-1 rounded-lg transition ${
                        contentTab === "edit"
                          ? "bg-white text-neutral-900 shadow-xs"
                          : "text-neutral-500 hover:text-neutral-800"
                      }`}
                    >
                      Visual Editor
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentTab("preview")}
                      className={`px-3 py-1 rounded-lg transition ${
                        contentTab === "preview"
                          ? "bg-white text-neutral-900 shadow-xs"
                          : "text-neutral-500 hover:text-neutral-800"
                      }`}
                    >
                      Live Preview
                    </button>
                  </div>
                </div>

                {contentTab === "edit" ? (
                  <RichTextEditor
                    value={editFormData.content}
                    onChange={(html) => handleEditInputChange("content", html)}
                    placeholder="Start writing your article here..."
                    minHeight="320px"
                  />
                ) : (
                  <div className="rounded-2xl border border-neutral-200 p-6 bg-[#FFFDF9] min-h-[320px] max-h-[450px] overflow-y-auto">
                    <ArticleContentRenderer html={editFormData.content} />
                  </div>
                )}

                {editFieldErrors.content && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600">
                    {editFieldErrors.content}
                  </p>
                )}
              </div>

              {/* Row 6: Status Selector */}
              <div className="flex items-center gap-4 pt-1">
                <span className="text-xs font-bold text-neutral-700">Publication Status:</span>
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700">
                  <input
                    type="radio"
                    name="editStatus"
                    value="draft"
                    checked={editFormData.status === "draft"}
                    onChange={() => handleEditInputChange("status", "draft")}
                    className="accent-[#5C0F17]"
                  />
                  <span>Save as Draft</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-800">
                  <input
                    type="radio"
                    name="editStatus"
                    value="published"
                    checked={editFormData.status === "published"}
                    onChange={() => handleEditInputChange("status", "published")}
                    className="accent-[#5C0F17]"
                  />
                  <span>Publish Immediately</span>
                </label>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-neutral-100 bg-neutral-50 -mx-6 -mb-6 px-6 py-4 mt-6">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={editSubmitting}
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#5C0F17] px-5 py-2 text-xs font-bold text-white hover:bg-[#4A0D15] shadow-xs transition disabled:opacity-50"
                >
                  {editSubmitting && <RefreshCw size={13} className="animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. CONFIRM DELETE MODAL                                      */}
      {/* ============================================================ */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-neutral-900">Archive Article</h3>
                <p className="text-xs text-neutral-500">Soft delete article from active listings</p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Are you sure you want to remove &quot;
              <span className="font-bold text-neutral-900">{article.title}</span>&quot;? This article
              will be archived and hidden from public readers.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-xs transition"
              >
                {actionLoading && <RefreshCw size={13} className="animate-spin" />}
                <span>Confirm Archive</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

