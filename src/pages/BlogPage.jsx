import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Search,
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
  RefreshCw,
  FileText,
  Tags,
  ShieldAlert,
} from "lucide-react";
import { blogService } from "../services/blogService";
import { uploadService } from "../services/uploadService";
import { resolveImageUrl } from "../utils/imageHelper";
import { validateArticleContent, extractMeaningfulText } from "../utils/blogContentValidator";
import RichTextEditor from "../components/common/RichTextEditor";
import ArticleContentRenderer from "../components/common/ArticleContentRenderer";

const INITIAL_ARTICLE_FORM = {
  title: "",
  slug: "",
  category: "",
  categoryId: null,
  shortDescription: "",
  coverImage: "",
  content: "",
  seoTitle: "",
  seoDescription: "",
  status: "draft",
};

const INITIAL_CATEGORY_FORM = {
  name: "",
  slug: "",
  description: "",
  order: 0,
};

// Helper to slugify a title or category name
const generateSlug = (text) =>
  (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function BlogPage() {
  const location = useLocation();

  // Active Main Tab: "articles" | "categories"
  const [activeTab, setActiveTab] = useState("articles");

  // Articles State
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (location.state?.notice) {
      setSuccessMessage(location.state.notice);
      window.history.replaceState({}, document.title);
      setTimeout(() => setSuccessMessage(""), 4000);
    }
  }, [location.state]);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({ total: 0, totalPublished: 0, totalDrafts: 0 });

  // Article Modal / Form States
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [articleFormData, setArticleFormData] = useState(INITIAL_ARTICLE_FORM);
  const [articleFieldErrors, setArticleFieldErrors] = useState({});
  const [articleSubmitting, setArticleSubmitting] = useState(false);
  const [autoArticleSlug, setAutoArticleSlug] = useState(true);
  const [contentTab, setContentTab] = useState("edit");
  const [uploadingCover, setUploadingCover] = useState(false);

  // Article Delete Confirmation
  const [deletingArticle, setDeletingArticle] = useState(null);
  const [isDeletingArticle, setIsDeletingArticle] = useState(false);

  // Category Modal / Form States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState(INITIAL_CATEGORY_FORM);
  const [categoryFieldErrors, setCategoryFieldErrors] = useState({});
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [autoCategorySlug, setAutoCategorySlug] = useState(true);

  // Category Delete & Block States
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [blockedCategoryDelete, setBlockedCategoryDelete] = useState(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // 1. Fetch Categories
  const fetchCategories = async () => {
    try {
      const cats = await blogService.getAdminCategories();
      setCategories(cats || []);
    } catch (err) {
      console.error("Fetch blog categories error:", err);
    }
  };

  // 2. Fetch Articles
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
    fetchCategories();
  }, []);

  useEffect(() => {
    if (activeTab === "articles") {
      fetchArticles();
    }
  }, [page, categoryFilter, statusFilter, activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchArticles();
  };

  // ==========================================================================
  // ARTICLE CRUD HANDLERS
  // ==========================================================================

  const openCreateArticleModal = () => {
    setEditingArticle(null);
    setArticleFormData(INITIAL_ARTICLE_FORM);
    setArticleFieldErrors({});
    setAutoArticleSlug(true);
    setContentTab("edit");
    setIsArticleModalOpen(true);
  };

  const openEditArticleModal = (article) => {
    setEditingArticle(article);
    setArticleFormData({
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
    setArticleFieldErrors({});
    setAutoArticleSlug(false);
    setContentTab("edit");
    setIsArticleModalOpen(true);
  };

  const closeArticleModal = () => {
    setIsArticleModalOpen(false);
    setEditingArticle(null);
    setArticleFormData(INITIAL_ARTICLE_FORM);
    setArticleFieldErrors({});
    setArticleSubmitting(false);
  };

  const handleArticleInputChange = (field, value) => {
    setArticleFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "title" && autoArticleSlug && !editingArticle) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });

    if (articleFieldErrors[field]) {
      if (field === "content") {
        if (validateArticleContent(value).valid) {
          setArticleFieldErrors((prev) => {
            const copy = { ...prev };
            delete copy[field];
            return copy;
          });
        }
      } else {
        setArticleFieldErrors((prev) => {
          const copy = { ...prev };
          delete copy[field];
          return copy;
        });
      }
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      const res = await uploadService.uploadImage(file, "blog");
      if (res && res.url) {
        handleArticleInputChange("coverImage", res.url);
      }
    } catch (err) {
      console.error("Cover upload error:", err);
      setArticleFieldErrors((prev) => ({
        ...prev,
        coverImage: err.message || "Failed to upload image. JPG, PNG, and WebP up to 5MB allowed.",
      }));
    } finally {
      setUploadingCover(false);
    }
  };

  const validateArticleForm = () => {
    const errors = {};
    const title = (articleFormData.title || "").trim();
    const slug = (articleFormData.slug || "").trim();
    const category = (articleFormData.category || "").trim();
    const shortDesc = (articleFormData.shortDescription || "").trim();
    const cover = (articleFormData.coverImage || "").trim();
    const content = (articleFormData.content || "").trim();

    if (!title) {
      errors.title = "Article title is required.";
    } else if (title.length < 2) {
      errors.title = "Title must be at least 2 characters.";
    } else if (title.length > 80) {
      errors.title = "Title cannot exceed 80 characters.";
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slug) {
      errors.slug = "Slug is required.";
    } else if (slug.length < 2) {
      errors.slug = "Slug must be at least 2 characters.";
    } else if (slug.length > 100) {
      errors.slug = "Slug cannot exceed 100 characters.";
    } else if (!slugRegex.test(slug)) {
      errors.slug = "Slug can only contain lowercase letters, numbers, and single hyphens.";
    }

    if (!category) {
      errors.category = "Please select or assign a category.";
    }

    if (!shortDesc) {
      errors.shortDescription = "Short description is required.";
    } else if (shortDesc.length < 5) {
      errors.shortDescription = "Short description must be at least 5 characters.";
    } else if (shortDesc.length > 180) {
      errors.shortDescription = "Short description cannot exceed 180 characters.";
    }

    if (!cover) {
      errors.coverImage = "Cover image is required. Upload an image or provide a valid URL.";
    }

    const contentValidation = validateArticleContent(articleFormData.content);
    if (!contentValidation.valid) {
      errors.content = contentValidation.error;
    }

    setArticleFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleArticleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateArticleForm()) return;

    try {
      setArticleSubmitting(true);
      setError(null);

      const payload = {
        title: articleFormData.title.trim(),
        slug: articleFormData.slug.trim().toLowerCase(),
        category: articleFormData.category.trim(),
        categoryId: articleFormData.categoryId || null,
        shortDescription: articleFormData.shortDescription.trim(),
        coverImage: articleFormData.coverImage.trim(),
        content: articleFormData.content.trim(),
        seoTitle: (articleFormData.seoTitle || "").trim(),
        seoDescription: (articleFormData.seoDescription || "").trim(),
        status: articleFormData.status,
      };

      if (editingArticle) {
        await blogService.update(editingArticle._id, payload);
        setSuccessMessage(`Article "${payload.title}" updated successfully.`);
      } else {
        await blogService.create(payload);
        setSuccessMessage(`Article "${payload.title}" published successfully.`);
      }

      closeArticleModal();
      fetchArticles();
      fetchCategories();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error("Save article error:", err);
      if (err.data && typeof err.data === "object") {
        setArticleFieldErrors(err.data);
      } else {
        setError(err.message || "Failed to save blog article.");
      }
    } finally {
      setArticleSubmitting(false);
    }
  };

  const handleToggleStatus = async (article) => {
    const nextStatus = article.status === "published" ? "draft" : "published";
    try {
      await blogService.updateStatus(article._id, nextStatus);
      setSuccessMessage(`Article status changed to ${nextStatus}.`);
      fetchArticles();
      fetchCategories();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error("Toggle status error:", err);
      setError(err.message || "Failed to update article status.");
    }
  };

  const handleConfirmDeleteArticle = async () => {
    if (!deletingArticle) return;
    try {
      setIsDeletingArticle(true);
      await blogService.delete(deletingArticle._id);
      setSuccessMessage(`Article "${deletingArticle.title}" archived successfully.`);
      setDeletingArticle(null);
      fetchArticles();
      fetchCategories();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error("Delete article error:", err);
      setError(err.message || "Failed to delete article.");
    } finally {
      setIsDeletingArticle(false);
    }
  };

  // ==========================================================================
  // CATEGORY CRUD HANDLERS
  // ==========================================================================

  const openCreateCategoryModal = () => {
    setEditingCategory(null);
    setCategoryFormData(INITIAL_CATEGORY_FORM);
    setCategoryFieldErrors({});
    setAutoCategorySlug(true);
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat) => {
    setEditingCategory(cat);
    setCategoryFormData({
      name: cat.name || "",
      slug: cat.slug || "",
      description: cat.description || "",
      order: cat.order || 0,
    });
    setCategoryFieldErrors({});
    setAutoCategorySlug(false);
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    setCategoryFormData(INITIAL_CATEGORY_FORM);
    setCategoryFieldErrors({});
    setCategorySubmitting(false);
  };

  const handleCategoryInputChange = (field, value) => {
    setCategoryFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "name" && autoCategorySlug && !editingCategory) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });

    if (categoryFieldErrors[field]) {
      setCategoryFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const validateCategoryForm = () => {
    const errors = {};
    const name = (categoryFormData.name || "").trim();
    const slug = (categoryFormData.slug || "").trim();
    const desc = (categoryFormData.description || "").trim();

    if (!name) {
      errors.name = "Category name is required.";
    } else if (name.length < 2) {
      errors.name = "Category name must be at least 2 characters.";
    } else if (name.length > 40) {
      errors.name = "Category name cannot exceed 40 characters.";
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slug) {
      errors.slug = "Slug is required.";
    } else if (slug.length < 2) {
      errors.slug = "Slug must be at least 2 characters.";
    } else if (slug.length > 60) {
      errors.slug = "Slug cannot exceed 60 characters.";
    } else if (!slugRegex.test(slug)) {
      errors.slug = "Slug can only contain lowercase letters, numbers, and single hyphens.";
    }

    if (desc.length > 150) {
      errors.description = "Description cannot exceed 150 characters.";
    }

    setCategoryFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCategoryFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateCategoryForm()) return;

    try {
      setCategorySubmitting(true);
      setError(null);

      const payload = {
        name: categoryFormData.name.trim(),
        slug: categoryFormData.slug.trim().toLowerCase(),
        description: (categoryFormData.description || "").trim(),
        order: Number(categoryFormData.order) || 0,
      };

      if (editingCategory) {
        await blogService.updateCategory(editingCategory._id, payload);
        setSuccessMessage(`Category "${payload.name}" updated successfully.`);
      } else {
        await blogService.createCategory(payload);
        setSuccessMessage(`Category "${payload.name}" created successfully.`);
      }

      closeCategoryModal();
      fetchCategories();
      fetchArticles();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error("Save category error:", err);
      if (err.data && typeof err.data === "object") {
        setCategoryFieldErrors(err.data);
      } else {
        setError(err.message || "Failed to save category.");
      }
    } finally {
      setCategorySubmitting(false);
    }
  };

  // Safe Category Delete Initiation
  const handleDeleteCategoryClick = (cat) => {
    const articleCount = cat.articleCount || 0;
    if (articleCount > 0) {
      // Invariant: Cannot delete category with active articles
      setBlockedCategoryDelete({
        name: cat.name,
        count: articleCount,
      });
    } else {
      setDeletingCategory(cat);
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      setIsDeletingCategory(true);
      await blogService.deleteCategory(deletingCategory._id);
      setSuccessMessage(`Category "${deletingCategory.name}" removed successfully.`);
      setDeletingCategory(null);
      fetchCategories();
      fetchArticles();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error("Delete category error:", err);
      setError(err.message || "Failed to delete category.");
    } finally {
      setIsDeletingCategory(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="text-[#DA9B26]" size={24} />
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Blog
            </h1>
          </div>
          <p className="mt-1 text-xs text-neutral-500 font-medium">
            Manage editorial articles, sacred guides, and blog categories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "articles" ? (
            <button
              type="button"
              onClick={openCreateArticleModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5C0F17] px-4 py-2.5 text-xs font-bold text-[#FFFDF9] hover:bg-[#4A0D15] shadow-sm transition active:scale-95"
            >
              <Plus size={16} /> Write New Article
            </button>
          ) : (
            <button
              type="button"
              onClick={openCreateCategoryModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5C0F17] px-4 py-2.5 text-xs font-bold text-[#FFFDF9] hover:bg-[#4A0D15] shadow-sm transition active:scale-95"
            >
              <Plus size={16} /> Add Category
            </button>
          )}
        </div>
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

      {/* Segmented Tab Switcher (Articles vs Categories) */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("articles")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs ${activeTab === "articles"
              ? "bg-[#5C0F17] text-white"
              : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
            }`}
        >
          <FileText size={15} />
          <span>Articles</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${activeTab === "articles" ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-600"
              }`}
          >
            {summary.total || articles.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("categories")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs ${activeTab === "categories"
              ? "bg-[#5C0F17] text-white"
              : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
            }`}
        >
          <Tags size={15} />
          <span>Categories</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${activeTab === "categories" ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-600"
              }`}
          >
            {categories.length}
          </span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: ARTICLES VIEW                                                 */}
      {/* ==================================================================== */}
      {activeTab === "articles" && (
        <>
          {/* Overview Metrics Cards */}
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

          {/* Filters Toolbar & Articles Table */}
          <section className="rounded-3xl border border-neutral-200/80 bg-white shadow-xs overflow-hidden">
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
                    {categories.map((cat) => (
                      <option key={cat._id || cat.slug} value={cat.name}>
                        {cat.name}
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
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Articles Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 bg-[#FAF6F0]/60 text-[11px] font-black uppercase tracking-wider text-neutral-500">
                    <th className="py-3.5 pl-6 pr-4">Article</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Published Date</th>
                    <th className="py-3.5 px-4">Author</th>
                    <th className="py-3.5 pl-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="animate-spin text-[#5C0F17]" size={24} />
                          <p className="text-xs font-medium text-neutral-400">Loading articles...</p>
                        </div>
                      </td>
                    </tr>
                  ) : articles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <div className="max-w-sm mx-auto space-y-2">
                          <BookOpen className="mx-auto text-neutral-300" size={32} />
                          <p className="text-sm font-bold text-neutral-700">No articles found</p>
                          <p className="text-xs text-neutral-400">
                            Create your first blog publication to share sacred Vedic wisdom.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    articles.map((art) => (
                      <tr key={art._id} className="hover:bg-neutral-50/60 transition group">
                        {/* Article Info */}
                        <td className="py-4 pl-6 pr-4 max-w-xs">
                          <Link
                            to={`/blog/${art._id}`}
                            className="flex items-center gap-3 group/item"
                            title="Open Article Detail & Customer Preview"
                          >
                            <img
                              src={resolveImageUrl(art.coverImage)}
                              alt={art.title}
                              className="h-11 w-11 shrink-0 rounded-xl object-cover border border-neutral-200 shadow-xs group-hover/item:border-[#5C0F17] transition"
                              onError={(e) => {
                                e.target.src = "https://images.unsplash.com/photo-1609137144822-263e8a4a5e3f?w=100&q=80";
                              }}
                            />
                            <div className="truncate">
                              <p className="font-bold text-neutral-900 group-hover/item:text-[#5C0F17] transition truncate">
                                {art.title}
                              </p>
                              <p className="text-[11px] font-mono text-neutral-400 truncate">
                                /blog/{art.slug}
                              </p>
                            </div>
                          </Link>
                        </td>

                        {/* Category */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="inline-block rounded-full bg-[#FAF5ED] border border-[#DA9B26]/30 px-2.5 py-1 text-[11px] font-bold text-[#5C0F17]">
                            {art.category}
                          </span>
                        </td>

                        {/* Status Toggle */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(art)}
                            title="Click to toggle status"
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition ${art.status === "published"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-neutral-100 text-neutral-600 border border-neutral-200 hover:bg-neutral-200"
                              }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${art.status === "published" ? "bg-emerald-500" : "bg-neutral-400"
                                }`}
                            />
                            {art.status === "published" ? "Published" : "Draft"}
                          </button>
                        </td>

                        {/* Published Date */}
                        <td className="py-4 px-4 whitespace-nowrap text-neutral-500 font-mono text-[11px]">
                          {art.publishedAt
                            ? new Date(art.publishedAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                            : "—"}
                        </td>

                        {/* Author */}
                        <td className="py-4 px-4 whitespace-nowrap text-neutral-700 font-medium">
                          {art.author || "Editorial"}
                        </td>

                        {/* Actions */}
                        <td className="py-4 pl-4 pr-6 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {/* Dedicated Admin Article Preview */}
                            <Link
                              to={`/blog/${art._id}`}
                              title="Preview Article Details"
                              className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-500 hover:bg-[#FAF5ED] hover:text-[#5C0F17] transition"
                            >
                              <Eye size={14} />
                            </Link>

                            <button
                              type="button"
                              onClick={() => openEditArticleModal(art)}
                              title="Edit Article"
                              className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-500 hover:bg-[#FAF5ED] hover:text-[#5C0F17] transition"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingArticle(art)}
                              title="Delete Article"
                              className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-neutral-100 px-6 py-4">
                <span className="text-xs text-neutral-500 font-medium">
                  Page {page} of {totalPages}
                </span>
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
        </>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: CATEGORIES VIEW                                               */}
      {/* ==================================================================== */}
      {activeTab === "categories" && (
        <section className="rounded-3xl border border-neutral-200/80 bg-white shadow-xs overflow-hidden">
          <div className="border-b border-neutral-100 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-neutral-900">Blog Categories</h2>
              <p className="text-xs text-neutral-500">
                Manage editorial categories used to organize articles and customer navigation.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchCategories}
              className="inline-flex items-center gap-1.5 self-start rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 bg-[#FAF6F0]/60 text-[11px] font-black uppercase tracking-wider text-neutral-500">
                  <th className="py-3.5 pl-6 pr-4">Category Name</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4 text-center">Articles</th>
                  <th className="py-3.5 pl-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-neutral-400">
                      No blog categories found. Click &quot;Add Category&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat._id} className="hover:bg-neutral-50/60 transition group">
                      <td className="py-4 pl-6 pr-4 font-bold text-neutral-900">
                        <div className="flex items-center gap-2">
                          <span>{cat.name}</span>
                          {cat.isDemo && (
                            <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-mono text-amber-700 border border-amber-200">
                              demo
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono text-neutral-500 text-[11px]">
                        {cat.slug}
                      </td>

                      <td className="py-4 px-4 max-w-sm text-neutral-600 line-clamp-2">
                        {cat.description || "—"}
                      </td>

                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${(cat.articleCount || 0) > 0
                              ? "bg-[#5C0F17]/10 text-[#5C0F17] border border-[#5C0F17]/20"
                              : "bg-neutral-100 text-neutral-400"
                            }`}
                        >
                          {cat.articleCount || 0} articles
                        </span>
                      </td>

                      <td className="py-4 pl-4 pr-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditCategoryModal(cat)}
                            title="Edit Category"
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-500 hover:bg-[#FAF5ED] hover:text-[#5C0F17] transition"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategoryClick(cat)}
                            title="Delete Category"
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* 3. Create / Edit Article Modal                               */}
      {/* ============================================================ */}
      {isArticleModalOpen && (
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
                onClick={closeArticleModal}
                className="rounded-xl p-1.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Row 1: Title */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-neutral-700">
                    Article Title <span className="text-rose-600">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-mono ${articleFormData.title.length > 80 ? "text-rose-600 font-bold" : "text-neutral-400"
                      }`}
                  >
                    {articleFormData.title.length}/80
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={80}
                  placeholder="Enter descriptive article title (e.g. Complete Shravan Puja Rituals at Home)"
                  value={articleFormData.title}
                  onChange={(e) => handleArticleInputChange("title", e.target.value)}
                  className={`w-full rounded-2xl border px-3.5 py-2.5 text-xs font-medium transition ${articleFieldErrors.title
                      ? "border-rose-500 bg-rose-50/30 text-rose-900"
                      : "border-neutral-200 bg-neutral-50/50 focus:border-[#5C0F17] focus:bg-white"
                    }`}
                />
                {articleFieldErrors.title && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600">
                    {articleFieldErrors.title}
                  </p>
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
                    <span
                      className={`text-[11px] font-mono ${articleFormData.slug.length > 100 ? "text-rose-600 font-bold" : "text-neutral-400"
                        }`}
                    >
                      {articleFormData.slug.length}/100
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={100}
                    placeholder="article-url-slug"
                    value={articleFormData.slug}
                    onChange={(e) => {
                      setAutoArticleSlug(false);
                      handleArticleInputChange("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"));
                    }}
                    className={`w-full rounded-2xl border px-3.5 py-2.5 text-xs font-mono transition ${articleFieldErrors.slug
                        ? "border-rose-500 bg-rose-50/30 text-rose-900"
                        : "border-neutral-200 bg-neutral-50/50 focus:border-[#5C0F17] focus:bg-white"
                      }`}
                  />
                  {articleFieldErrors.slug ? (
                    <p className="mt-1 text-[11px] font-semibold text-rose-600">
                      {articleFieldErrors.slug}
                    </p>
                  ) : (
                    <p className="mt-1 text-[10px] text-neutral-400 font-mono">
                      Public URL: /blog/{articleFormData.slug || "slug-preview"}
                    </p>
                  )}
                </div>

                {/* Category (Dynamically Populated) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-neutral-700">
                      Category <span className="text-rose-600">*</span>
                    </label>
                  </div>
                  <select
                    value={articleFormData.category}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      const matchedCat = categories.find((c) => c.name === selectedName);
                      handleArticleInputChange("category", selectedName);
                      handleArticleInputChange("categoryId", matchedCat ? matchedCat._id : null);
                    }}
                    className={`w-full rounded-2xl border px-3.5 py-2.5 text-xs font-medium transition ${articleFieldErrors.category
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
                  {articleFieldErrors.category && (
                    <p className="mt-1 text-[11px] font-semibold text-rose-600">
                      {articleFieldErrors.category}
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
                    className={`text-[11px] font-mono ${articleFormData.shortDescription.length > 180
                        ? "text-rose-600 font-bold"
                        : "text-neutral-400"
                      }`}
                  >
                    {articleFormData.shortDescription.length}/180
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={180}
                  placeholder="Concise overview summarizing the article for catalog listings and cards..."
                  value={articleFormData.shortDescription}
                  onChange={(e) => handleArticleInputChange("shortDescription", e.target.value)}
                  className={`w-full rounded-2xl border px-3.5 py-2 text-xs font-medium transition ${articleFieldErrors.shortDescription
                      ? "border-rose-500 bg-rose-50/30 text-rose-900"
                      : "border-neutral-200 bg-neutral-50/50 focus:border-[#5C0F17] focus:bg-white"
                    }`}
                />
                {articleFieldErrors.shortDescription && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600">
                    {articleFieldErrors.shortDescription}
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
                      placeholder="Enter direct image URL or upload below..."
                      value={articleFormData.coverImage}
                      onChange={(e) => handleArticleInputChange("coverImage", e.target.value)}
                      className={`w-full rounded-2xl border px-3.5 py-2.5 text-xs font-mono transition ${articleFieldErrors.coverImage
                          ? "border-rose-500 bg-rose-50/30 text-rose-900"
                          : "border-neutral-200 bg-neutral-50/50 focus:border-[#5C0F17] focus:bg-white"
                        }`}
                    />

                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 cursor-pointer shadow-xs transition">
                        <UploadCloud size={14} className={uploadingCover ? "animate-bounce" : ""} />
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

                    {articleFieldErrors.coverImage && (
                      <p className="text-[11px] font-semibold text-rose-600">
                        {articleFieldErrors.coverImage}
                      </p>
                    )}
                  </div>

                  {articleFormData.coverImage && (
                    <div className="h-20 w-32 shrink-0 rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 shadow-xs relative">
                      <img
                        src={resolveImageUrl(articleFormData.coverImage)}
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

              {/* Row 5: Rich Article Content */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-neutral-700">
                    Article Content <span className="text-rose-600">*</span>
                  </label>
                  <div className="flex items-center gap-1 rounded-xl bg-neutral-100 p-0.5 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setContentTab("edit")}
                      className={`px-3 py-1 rounded-lg transition ${contentTab === "edit"
                          ? "bg-white text-neutral-900 shadow-xs"
                          : "text-neutral-500 hover:text-neutral-800"
                        }`}
                    >
                      Editor
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentTab("preview")}
                      className={`px-3 py-1 rounded-lg transition ${contentTab === "preview"
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
                    value={articleFormData.content}
                    onChange={(html) => handleArticleInputChange("content", html)}
                    placeholder="Start writing your article here..."
                    minHeight="320px"
                  />
                ) : (
                  <div className="rounded-2xl border border-neutral-200 p-6 bg-[#FFFDF9] min-h-[320px] max-h-[450px] overflow-y-auto">
                    <ArticleContentRenderer html={articleFormData.content} />
                  </div>
                )}

                {articleFieldErrors.content && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600">
                    {articleFieldErrors.content}
                  </p>
                )}
              </div>

              {/* Row 6: SEO Metadata Accordion */}
              <div className="rounded-2xl border border-neutral-200 bg-[#FAF6F0]/40 p-4 space-y-3">
                <p className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#DA9B26]" />
                  <span>SEO Search Optimization (Optional)</span>
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                      SEO Title (Max 70 chars)
                    </label>
                    <input
                      type="text"
                      maxLength={70}
                      placeholder="Defaults to article title if empty"
                      value={articleFormData.seoTitle}
                      onChange={(e) => handleArticleInputChange("seoTitle", e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-[#5C0F17]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                      SEO Meta Description (Max 160 chars)
                    </label>
                    <input
                      type="text"
                      maxLength={160}
                      placeholder="Defaults to short description if empty"
                      value={articleFormData.seoDescription}
                      onChange={(e) => handleArticleInputChange("seoDescription", e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium outline-none focus:border-[#5C0F17]"
                    />
                  </div>
                </div>
              </div>

              {/* Row 7: Publication Status */}
              <div className="flex items-center gap-4 pt-1">
                <span className="text-xs font-bold text-neutral-700">Publication Status:</span>
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700">
                  <input
                    type="radio"
                    name="status"
                    value="draft"
                    checked={articleFormData.status === "draft"}
                    onChange={() => handleArticleInputChange("status", "draft")}
                    className="accent-[#5C0F17]"
                  />
                  <span>Save as Draft</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-800">
                  <input
                    type="radio"
                    name="status"
                    value="published"
                    checked={articleFormData.status === "published"}
                    onChange={() => handleArticleInputChange("status", "published")}
                    className="accent-[#5C0F17]"
                  />
                  <span>Publish Immediately</span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-neutral-100 bg-neutral-50 px-6 py-4">
              <button
                type="button"
                onClick={closeArticleModal}
                disabled={articleSubmitting}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleArticleFormSubmit}
                disabled={articleSubmitting || !validateArticleContent(articleFormData.content).valid}
                title={
                  !validateArticleContent(articleFormData.content).valid
                    ? "Content must contain at least 100 meaningful characters"
                    : ""
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[#5C0F17] px-5 py-2 text-xs font-bold text-white hover:bg-[#4A0D15] shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {articleSubmitting && <RefreshCw size={13} className="animate-spin" />}
                <span>{editingArticle ? "Save Changes" : "Create Article"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. Create / Edit Category Modal                              */}
      {/* ============================================================ */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-neutral-200 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 bg-[#FAF6F0]">
              <div className="flex items-center gap-2">
                <Tags size={18} className="text-[#DA9B26]" />
                <h2 className="text-base font-black text-neutral-900">
                  {editingCategory ? "Edit Blog Category" : "Add New Blog Category"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeCategoryModal}
                className="rounded-xl p-1.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCategoryFormSubmit} className="p-6 space-y-4">
              {/* Category Name */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-neutral-700">
                    Category Name <span className="text-rose-600">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-mono ${categoryFormData.name.length > 40 ? "text-rose-600 font-bold" : "text-neutral-400"
                      }`}
                  >
                    {categoryFormData.name.length}/40
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={40}
                  placeholder="e.g. Festival Guides"
                  value={categoryFormData.name}
                  onChange={(e) => handleCategoryInputChange("name", e.target.value)}
                  className={`w-full rounded-2xl border px-3.5 py-2.5 text-xs font-medium transition ${categoryFieldErrors.name
                      ? "border-rose-500 bg-rose-50/30 text-rose-900"
                      : "border-neutral-200 bg-neutral-50/50 focus:border-[#5C0F17] focus:bg-white"
                    }`}
                />
                {categoryFieldErrors.name && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600">
                    {categoryFieldErrors.name}
                  </p>
                )}
              </div>

              {/* Slug */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-neutral-700">
                    Slug <span className="text-rose-600">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-mono ${categoryFormData.slug.length > 60 ? "text-rose-600 font-bold" : "text-neutral-400"
                      }`}
                  >
                    {categoryFormData.slug.length}/60
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={60}
                  placeholder="festival-guides"
                  value={categoryFormData.slug}
                  onChange={(e) => {
                    setAutoCategorySlug(false);
                    handleCategoryInputChange("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"));
                  }}
                  className={`w-full rounded-2xl border px-3.5 py-2.5 text-xs font-mono transition ${categoryFieldErrors.slug
                      ? "border-rose-500 bg-rose-50/30 text-rose-900"
                      : "border-neutral-200 bg-neutral-50/50 focus:border-[#5C0F17] focus:bg-white"
                    }`}
                />
                {categoryFieldErrors.slug && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600">
                    {categoryFieldErrors.slug}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-neutral-700">
                    Description <span className="text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <span
                    className={`text-[11px] font-mono ${categoryFormData.description.length > 150
                        ? "text-rose-600 font-bold"
                        : "text-neutral-400"
                      }`}
                  >
                    {categoryFormData.description.length}/150
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={150}
                  placeholder="Brief summary of articles grouped under this category..."
                  value={categoryFormData.description}
                  onChange={(e) => handleCategoryInputChange("description", e.target.value)}
                  className={`w-full rounded-2xl border px-3.5 py-2 text-xs font-medium transition ${categoryFieldErrors.description
                      ? "border-rose-500 bg-rose-50/30 text-rose-900"
                      : "border-neutral-200 bg-neutral-50/50 focus:border-[#5C0F17] focus:bg-white"
                    }`}
                />
                {categoryFieldErrors.description && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600">
                    {categoryFieldErrors.description}
                  </p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={closeCategoryModal}
                  disabled={categorySubmitting}
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={categorySubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#5C0F17] px-5 py-2 text-xs font-bold text-white hover:bg-[#4A0D15] shadow-xs transition disabled:opacity-50"
                >
                  {categorySubmitting && <RefreshCw size={13} className="animate-spin" />}
                  <span>{editingCategory ? "Save Category" : "Add Category"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. Delete Article Confirmation Modal                         */}
      {/* ============================================================ */}
      {deletingArticle && (
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
              <span className="font-bold text-neutral-900">{deletingArticle.title}</span>&quot;? This
              article will be archived and hidden from public readers.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingArticle}
                onClick={() => setDeletingArticle(null)}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingArticle}
                onClick={handleConfirmDeleteArticle}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-xs transition"
              >
                {isDeletingArticle && <RefreshCw size={13} className="animate-spin" />}
                <span>Confirm Archive</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. Blocked Category Delete Modal (Safety Invariant)          */}
      {/* ============================================================ */}
      {blockedCategoryDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-amber-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
                <ShieldAlert size={22} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-neutral-900">Cannot Delete Category</h3>
                <p className="text-xs text-neutral-500">Active articles are associated</p>
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-4 text-xs text-amber-900 leading-relaxed">
              Cannot delete category &quot;<strong>{blockedCategoryDelete.name}</strong>&quot; because
              it contains <strong>{blockedCategoryDelete.count} article(s)</strong>. Please reassign or
              delete these articles before removing the category.
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setBlockedCategoryDelete(null)}
                className="rounded-xl bg-[#5C0F17] px-5 py-2 text-xs font-bold text-white hover:bg-[#4A0D15] shadow-xs transition"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. Confirm Category Delete Modal (0 Articles)                */}
      {/* ============================================================ */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-neutral-900">Delete Category</h3>
                <p className="text-xs text-neutral-500">Soft delete category</p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Are you sure you want to delete category &quot;
              <span className="font-bold text-neutral-900">{deletingCategory.name}</span>&quot;? Since it
              has no articles attached, it will be safely archived.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingCategory}
                onClick={() => setDeletingCategory(null)}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingCategory}
                onClick={handleConfirmDeleteCategory}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-xs transition"
              >
                {isDeletingCategory && <RefreshCw size={13} className="animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
