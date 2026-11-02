import { useEffect, useMemo, useState, useRef } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  Tags,
  Layers3,
  Eye,
  UploadCloud,
  ImageIcon,
} from "lucide-react";
import { categoryService } from "../services/categoryService";
import { uploadService } from "../services/uploadService";
import { resolveImageUrl } from "../utils/imageHelper";

const MIN_NAME = 2;
const MAX_NAME = 60;

const normalizeName = (value) =>
  value.trim().replace(/\s+/g, " ");

const fieldClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#5C0F17] focus:ring-2 focus:ring-[#5C0F17]/10";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState("");
  const [categoryModal, setCategoryModal] = useState(false);
  const [subcategoryModal, setSubcategoryModal] = useState(false);
  const [viewCategory, setViewCategory] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Category Form State
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [imageId, setImageId] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [actionMenu, setActionMenu] = useState(null);
  const [viewTab, setViewTab] = useState("active"); // "active" | "trash"
  const [selectedIds, setSelectedIds] = useState([]);

  const load = async (tab = viewTab) => {
    try {
      const isDeletedQuery = tab === "trash" ? "true" : "false";
      const data = await categoryService.getAll({ isDeleted: isDeletedQuery });
      setCategories(data);
    } catch (err) {
      setError(err.message || "Failed to load categories.");
    }
  };

  useEffect(() => {
    load(viewTab);
  }, [viewTab]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return categories;

    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(query) ||
        category.subcategories?.some((sub) =>
          sub.name.toLowerCase().includes(query)
        )
    );
  }, [categories, search]);

  const totalSubcategories = categories.reduce(
    (total, category) => total + (category.subcategories?.length || 0),
    0
  );

  const showCategoryModal = (category = null) => {
    setEditingCategory(category);
    setName(category?.name || "");
    setImage(category?.image || "");
    setImageId(category?.imageId || "");
    setImagePreview(category?.image || "");
    setUploadingImage(false);
    setError("");
    setActionMenu(null);
    setCategoryModal(true);
  };

  const showSubcategoryModal = (category, subcategory = null) => {
    setSelectedCategory(category);
    setEditingSubcategory(subcategory);
    setName(subcategory?.name || "");
    setError("");
    setActionMenu(null);
    setSubcategoryModal(true);
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Please select a valid image file (JPG, PNG, or WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image file size cannot exceed 5MB.");
      return;
    }

    setError("");
    setImagePreview(URL.createObjectURL(file));
    setUploadingImage(true);

    try {
      const res = await uploadService.uploadImage(file, "categories");
      setImage(res.url);
      setImageId(res.publicId || "");
      setNotice("Image uploaded successfully.");
    } catch (err) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeSelectedImage = () => {
    setImage("");
    setImageId("");
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    setError("");

    const trimmedName = normalizeName(name);
    if (trimmedName.length < MIN_NAME || trimmedName.length > MAX_NAME) {
      setError(`Name must be between ${MIN_NAME} and ${MAX_NAME} characters.`);
      return;
    }

    if (!/^[\p{L}\p{N}][\p{L}\p{N}\s&'().-]*$/u.test(trimmedName)) {
      setError("Use letters, numbers, spaces and basic punctuation only.");
      return;
    }

    const catId = editingCategory ? (editingCategory._id || editingCategory.id) : null;
    const isDuplicate = categories.some((cat) => {
      const currentCatId = cat._id || cat.id;
      return (
        cat.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
        currentCatId !== catId
      );
    });
    if (isDuplicate) {
      setError("A category with this name already exists.");
      return;
    }

    try {
      if (editingCategory) {
        await categoryService.update(catId, {
          name: trimmedName,
          image,
          imageId,
        });
        setNotice("Category updated successfully.");
      } else {
        await categoryService.create({
          name: trimmedName,
          image,
          imageId,
        });
        setNotice("Category created successfully.");
      }

      setCategoryModal(false);
      await load();
    } catch (err) {
      setError(err.message || "Unable to save category.");
    }
  };

  const saveSubcategory = async (event) => {
    event.preventDefault();
    setError("");

    const trimmedName = normalizeName(name);
    if (trimmedName.length < MIN_NAME || trimmedName.length > MAX_NAME) {
      setError(`Name must be between ${MIN_NAME} and ${MAX_NAME} characters.`);
      return;
    }

    if (!/^[\p{L}\p{N}][\p{L}\p{N}\s&'().-]*$/u.test(trimmedName)) {
      setError("Use letters, numbers, spaces and basic punctuation only.");
      return;
    }

    const catId = selectedCategory._id || selectedCategory.id;
    const subId = editingSubcategory ? (editingSubcategory._id || editingSubcategory.id) : null;

    const isDuplicate = (selectedCategory?.subcategories || []).some((sub) => {
      const currentSubId = sub._id || sub.id;
      return (
        sub.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
        currentSubId !== subId
      );
    });
    if (isDuplicate) {
      setError("This subcategory already exists in the selected category.");
      return;
    }

    try {
      if (editingSubcategory) {
        await categoryService.updateSubcategory(catId, subId, {
          name: trimmedName,
        });
        setNotice("Subcategory updated successfully.");
      } else {
        await categoryService.createSubcategory(catId, {
          name: trimmedName,
        });
        setNotice("Subcategory created successfully.");
      }

      setSubcategoryModal(false);
      setExpanded((prev) => ({
        ...prev,
        [catId]: true,
      }));
      await load();
    } catch (err) {
      setError(err.message || "Unable to save subcategory.");
    }
  };

  const deleteCategory = async (category) => {
    setActionMenu(null);
    if (!window.confirm(`Move category "${category.name}" to trash? (You can restore it anytime from the Trash tab)`)) return;

    try {
      const catId = category._id || category.id;
      await categoryService.remove(catId);
      setNotice("Category moved to trash successfully.");
      setError("");
      await load();
    } catch (err) {
      setNotice("");
      setError(err.message || "Unable to move category to trash.");
    }
  };

  const restoreCategory = async (category) => {
    setActionMenu(null);
    try {
      const catId = category._id || category.id;
      await categoryService.restore(catId);
      setNotice("Category restored successfully.");
      setError("");
      await load();
    } catch (err) {
      setNotice("");
      setError(err.message || "Unable to restore category.");
    }
  };

  const deleteSubcategory = async (category, subcategory) => {
    setActionMenu(null);
    if (!window.confirm(`Move subcategory "${subcategory.name}" to trash?`)) return;

    try {
      const catId = category._id || category.id;
      const subId = subcategory._id || subcategory.id;
      await categoryService.removeSubcategory(catId, subId);
      setNotice("Subcategory moved to trash successfully.");
      setError("");
      await load();
    } catch (err) {
      setNotice("");
      setError(err.message || "Unable to move subcategory to trash.");
    }
  };

  const restoreSubcategory = async (category, subcategory) => {
    setActionMenu(null);
    try {
      const catId = category._id || category.id;
      const subId = subcategory._id || subcategory.id;
      await categoryService.restoreSubcategory(catId, subId);
      setNotice("Subcategory restored successfully.");
      setError("");
      await load();
    } catch (err) {
      setNotice("");
      setError(err.message || "Unable to restore subcategory.");
    }
  };


  const handleBulkTrash = async (idsToTrash) => {
    if (!idsToTrash || idsToTrash.length === 0) return;
    if (!window.confirm(`Move ${idsToTrash.length} category(ies) to trash? (You can restore them anytime from the Trash tab)`)) return;

    try {
      setLoading(true);
      await categoryService.bulkTrash(idsToTrash);
      setNotice(`${idsToTrash.length} category(ies) moved to trash successfully.`);
      setSelectedIds([]);
      setTimeout(() => setNotice(""), 3500);
      await load();
    } catch (err) {
      console.error("Bulk trash error:", err);
      setError(err.message || "Failed to move selected categories to trash.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRestore = async (idsToRestore) => {
    if (!idsToRestore || idsToRestore.length === 0) return;
    if (!window.confirm(`Restore ${idsToRestore.length} category(ies) back to active catalog?`)) return;

    try {
      setLoading(true);
      await categoryService.bulkRestore(idsToRestore);
      setNotice(`${idsToRestore.length} category(ies) restored successfully.`);
      setSelectedIds([]);
      setTimeout(() => setNotice(""), 3500);
      await load();
    } catch (err) {
      console.error("Bulk restore error:", err);
      setError(err.message || "Failed to restore selected categories.");
    } finally {
      setLoading(false);
    }
  };

  const closeModals = () => {
    setCategoryModal(false);
    setSubcategoryModal(false);
    setViewCategory(null);
    setError("");
  };

  const modalOpen = categoryModal || subcategoryModal;

  return (
    <div className="space-y-5 text-neutral-900">
      {/* Page heading */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white px-5 py-5 shadow-sm sm:px-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            Categories
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage your product categories, thumbnails, and subcategories.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-neutral-200 px-4 py-2.5">
          <span className="text-xl font-black text-[#5C0F17]">
            {categories.length}
          </span>
          <span className="text-xs font-medium text-neutral-500">
            Total Categories
          </span>
        </div>
      </section>

      {/* Notifications */}
      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss notice">
            <X size={16} />
          </button>
        </div>
      )}

      {error && !modalOpen && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <article className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-[#5C0F17]">
            <Tags size={23} />
          </div>
          <div>
            <p className="text-sm text-neutral-500">Total Categories</p>
            <p className="mt-1 text-2xl font-black">{categories.length}</p>
          </div>
        </article>

        <article className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
            <Layers3 size={23} />
          </div>
          <div>
            <p className="text-sm text-neutral-500">Total Subcategories</p>
            <p className="mt-1 text-2xl font-black">{totalSubcategories}</p>
          </div>
        </article>
      </section>

      {/* Categories table */}
      <section className="overflow-visible rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 p-4 sm:p-5">
          {/* Active vs Trash tabs */}
          <div className="flex rounded-xl bg-[#FAF5ED] p-1 border border-[#EEDBC5]">
            <button
              type="button"
              onClick={() => { setViewTab("active"); setSelectedIds([]); }}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                viewTab === "active"
                  ? "bg-[#5C0F17] text-white shadow-xs"
                  : "text-[#2D1C13]/70 hover:text-[#5C0F17]"
              }`}
            >
              Active Categories
            </button>
            <button
              type="button"
              onClick={() => { setViewTab("trash"); setSelectedIds([]); }}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                viewTab === "trash"
                  ? "bg-red-700 text-white shadow-xs"
                  : "text-[#2D1C13]/70 hover:text-red-700"
              }`}
            >
              <Trash2 size={13} /> Trash / Deleted Items
            </button>
          </div>

          <div className="relative min-w-[220px] flex-1 sm:max-w-md">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              value={search}
              maxLength={100}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search categories by name..."
              className={`${fieldClass} pl-9`}
            />
          </div>

          <button
            onClick={() => showCategoryModal()}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#5C0F17] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#4A0D15]"
          >
            <Plus size={18} />
            Add Category
          </button>
        </div>

        
        {/* Bulk Action Controls */}
        {filteredCategories.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 bg-[#FAF5ED] px-4 py-2.5 sm:px-6">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-bold text-[#2D1C13] cursor-pointer">
                <input
                  type="checkbox"
                  checked={filteredCategories.length > 0 && selectedIds.length === filteredCategories.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(filteredCategories.map((c) => c._id || c.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  className="h-4 w-4 rounded accent-[#5C0F17]"
                />
                <span>Select All</span>
              </label>
              <span className="text-xs font-semibold text-[#5C0F17]">
                {selectedIds.length > 0 ? `(${selectedIds.length} of ${filteredCategories.length} selected)` : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {viewTab === 'active' ? (
                <>
                  <button
                    type="button"
                    disabled={selectedIds.length === 0}
                    onClick={() => handleBulkTrash(selectedIds)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
                  >
                    <Trash2 size={13} />
                    Delete Selected
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkTrash(filteredCategories.map((c) => c._id || c.id))}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-700 shadow-xs transition hover:bg-red-50"
                  >
                    Delete All
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={selectedIds.length === 0}
                    onClick={() => handleBulkRestore(selectedIds)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
                  >
                    <RotateCcw size={13} />
                    Restore Selected
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkRestore(filteredCategories.map((c) => c._id || c.id))}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-xs transition hover:bg-emerald-50"
                  >
                    Restore All
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-neutral-50 text-[11px] uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="w-12 px-4 py-4 text-center">
                  <input
                    type="checkbox"
                    checked={filteredCategories.length > 0 && selectedIds.length === filteredCategories.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(filteredCategories.map((c) => c._id || c.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    className="h-4 w-4 rounded accent-[#5C0F17]"
                  />
                </th>
                <th className="w-16 px-4 py-4 font-bold">S.No.</th>
                <th className="w-36 px-4 py-4 font-bold">Action</th>
                <th className="w-20 px-4 py-4 font-bold">Icon/Image</th>
                <th className="px-4 py-4 font-bold">Category Name</th>
                <th className="px-4 py-4 font-bold">Subcategories</th>
                <th className="px-5 py-4 font-bold">Created Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-100">
              {filteredCategories.map((category, index) => {
                const catId = category._id || category.id;
                return (
                  <tr
                    key={catId}
                    className="transition hover:bg-rose-50/30"
                  >
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(catId)}
                        onChange={() => {
                          setSelectedIds((prev) =>
                            prev.includes(catId)
                              ? prev.filter((id) => id !== catId)
                              : [...prev, catId]
                          );
                        }}
                        className="h-4 w-4 rounded accent-[#5C0F17]"
                      />
                    </td>
                    <td className="px-4 py-4 font-bold text-neutral-700">
                      {index + 1}
                    </td>

                    <td className="px-4 py-4">
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActionMenu(actionMenu === catId ? null : catId)
                          }
                          className="flex items-center gap-2 rounded-lg bg-[#5C0F17] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#4A0D15]"
                        >
                          Action
                          <ChevronDown size={14} />
                        </button>

                        {actionMenu === catId && (
                          <div className="absolute left-0 top-full z-30 mt-1 w-44 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl">
                            {viewTab === "trash" ? (
                              <button
                                onClick={() => restoreCategory(category)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-emerald-700 font-bold hover:bg-emerald-50"
                              >
                                <RotateCcw size={15} /> Restore Category
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setViewCategory(category);
                                    setActionMenu(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-neutral-50"
                                >
                                  <Eye size={15} /> View
                                </button>
                                <button
                                  onClick={() => showCategoryModal(category)}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-neutral-50"
                                >
                                  <Pencil size={15} /> Edit
                                </button>
                                <button
                                  onClick={() => deleteCategory(category)}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 size={15} /> Move to Trash
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {category.image ? (
                        <img
                          src={resolveImageUrl(category.image)}
                          alt={category.name}
                          className="h-10 w-10 rounded-xl border border-neutral-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-[#5C0F17]">
                          <Tags size={18} />
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <button
                        onClick={() =>
                          setExpanded((prev) => ({
                            ...prev,
                            [catId]: !prev[catId],
                          }))
                        }
                        className="flex items-center gap-2 text-left font-bold text-neutral-800 hover:text-[#5C0F17]"
                      >
                        {expanded[catId] ? (
                          <ChevronDown size={15} />
                        ) : (
                          <ChevronRight size={15} />
                        )}
                        {category.name}
                      </button>
                      <p className="mt-1 pl-5 text-xs text-neutral-400">
                        Slug: {category.slug || catId}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <button
                        onClick={() =>
                          setExpanded((prev) => ({
                            ...prev,
                            [catId]: !prev[catId],
                          }))
                        }
                        className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-bold text-[#5C0F17] hover:bg-rose-100"
                      >
                        {category.subcategories?.length || 0} subcategories
                      </button>
                    </td>

                    <td className="px-5 py-4 text-xs text-neutral-500">
                      {category.createdAt
                        ? new Date(category.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                );
              })}

              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Search
                      size={26}
                      className="mx-auto mb-2 text-neutral-300"
                    />
                    <p className="font-semibold text-neutral-600">
                      No categories found
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">
                      Try another search or add a new category.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 px-5 py-3 text-xs text-neutral-500">
          <span>
            Showing {filteredCategories.length} of {categories.length} categories
          </span>
          <span>Category management</span>
        </div>
      </section>

      {/* Expanded subcategories */}
      {filteredCategories
        .filter((category) => expanded[category._id || category.id])
        .map((category) => {
          const catId = category._id || category.id;
          return (
            <section
              key={`sub-${catId}`}
              className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 p-4 sm:p-5">
                <div>
                  <h2 className="font-extrabold">{category.name}</h2>
                  <p className="mt-1 text-xs text-neutral-500">
                    Manage subcategories for this category
                  </p>
                </div>

                <button
                  onClick={() => showSubcategoryModal(category)}
                  className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-bold text-[#5C0F17] hover:bg-rose-100"
                >
                  <Plus size={15} /> Add Subcategory
                </button>
              </div>

              <div className="space-y-2 p-4">
                {!category.subcategories?.length ? (
                  <p className="rounded-xl bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500">
                    No subcategories yet.
                  </p>
                ) : (
                  category.subcategories.map((sub) => {
                    const subId = sub._id || sub.id;
                    return (
                      <div
                        key={subId}
                        className="flex items-center gap-3 rounded-xl border border-neutral-100 px-3 py-3"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                          <Layers3 size={17} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {sub.name}
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-400">
                            Slug: {sub.slug || subId}
                          </p>
                        </div>

                        {sub.isDeleted ? (
                          <button
                            aria-label={`Restore ${sub.name}`}
                            onClick={() => restoreSubcategory(category, sub)}
                            className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                            title="Restore Subcategory"
                          >
                            <RotateCcw size={13} /> Restore
                          </button>
                        ) : (
                          <>
                            <button
                              aria-label={`Edit ${sub.name}`}
                              onClick={() => showSubcategoryModal(category, sub)}
                              className="rounded-lg border border-neutral-200 p-2 text-neutral-600 hover:bg-neutral-50"
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              aria-label={`Delete ${sub.name}`}
                              onClick={() => deleteSubcategory(category, sub)}
                              className="rounded-lg border border-neutral-200 p-2 text-red-600 hover:bg-red-50"
                              title="Move to trash"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}

      {/* Add/Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <form
            onSubmit={categoryModal ? saveCategory : saveSubcategory}
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black">
                  {categoryModal
                    ? editingCategory
                      ? "Edit Category"
                      : "Add Category"
                    : editingSubcategory
                      ? "Edit Subcategory"
                      : "Add Subcategory"}
                </h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Enter details below to continue.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModals}
                aria-label="Close modal"
                className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100"
              >
                <X size={19} />
              </button>
            </div>

            {!categoryModal && (
              <p className="mb-4 rounded-xl bg-neutral-50 p-3 text-sm text-neutral-600">
                Parent category:{" "}
                <strong className="text-neutral-900">
                  {selectedCategory?.name}
                </strong>
              </p>
            )}

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="category-name" className="text-sm font-semibold">
                    {categoryModal ? "Category name *" : "Subcategory name *"}
                  </label>
                  <span className="text-xs text-neutral-400">
                    {name.length}/{MAX_NAME}
                  </span>
                </div>
                <input
                  id="category-name"
                  autoFocus
                  required
                  minLength={MIN_NAME}
                  maxLength={MAX_NAME}
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setError("");
                  }}
                  className={`${fieldClass} mt-1.5`}
                  placeholder={
                    categoryModal
                      ? "Enter category name (e.g. Hawan Samagri, Diya & Brass Utensils)"
                      : "Enter subcategory name (e.g. Pure Ghee Diyas, Camphor & Kapur)"
                  }
                  aria-describedby="category-name-help"
                />
                <p id="category-name-help" className="mt-1.5 text-xs text-neutral-500">
                  {MIN_NAME}–{MAX_NAME} characters. Duplicate names are not allowed.
                </p>
              </div>

              {categoryModal && (
                <div>
                  <label className="text-sm font-semibold">Category Image</label>
                  <div className="mt-2 flex items-center gap-4">
                    {imagePreview ? (
                      <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-neutral-200">
                        <img
                          src={resolveImageUrl(imagePreview)}
                          alt="Category preview"
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={removeSelectedImage}
                          className="absolute right-0.5 top-0.5 rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700"
                          title="Remove image"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-neutral-400">
                        <ImageIcon size={24} />
                      </div>
                    )}

                    <div className="flex-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageFileChange}
                        className="hidden"
                        id="cat-file-input"
                      />
                      <label
                        htmlFor="cat-file-input"
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 px-3.5 py-2 text-xs font-bold text-neutral-700 transition hover:bg-neutral-50"
                      >
                        <UploadCloud size={16} />
                        {uploadingImage ? "Uploading..." : "Select File"}
                      </label>
                      <p className="mt-1 text-[11px] text-neutral-400">
                        JPG, PNG, WebP up to 5MB. Real persistent storage.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModals}
                className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-bold hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploadingImage}
                className="rounded-xl bg-[#5C0F17] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#4A0D15] disabled:opacity-50"
              >
                {uploadingImage ? "Uploading..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View modal */}
      {viewCategory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-black">Category Details</h2>
              <button
                onClick={() => setViewCategory(null)}
                aria-label="Close details"
                className="rounded-lg p-2 hover:bg-neutral-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-rose-50 p-4">
              {viewCategory.image ? (
                <img
                  src={resolveImageUrl(viewCategory.image)}
                  alt={viewCategory.name}
                  className="h-12 w-12 rounded-xl border border-neutral-200 object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#5C0F17]">
                  <Tags size={21} />
                </div>
              )}
              <div>
                <p className="font-bold">{viewCategory.name}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  ID: {viewCategory._id || viewCategory.id}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-neutral-100 p-4">
              <p className="text-xs text-neutral-500">Total subcategories</p>
              <p className="mt-1 text-2xl font-black">
                {viewCategory.subcategories?.length || 0}
              </p>

              <div className="mt-3 space-y-2">
                {viewCategory.subcategories?.map((sub) => {
                  const subId = sub._id || sub.id;
                  return (
                    <div
                      key={subId}
                      className="rounded-lg bg-neutral-50 px-3 py-2 text-sm"
                    >
                      {sub.name}
                    </div>
                  );
                })}
                {!viewCategory.subcategories?.length && (
                  <p className="text-sm text-neutral-400">
                    No subcategories added.
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setViewCategory(null)}
              className="mt-5 w-full rounded-xl bg-[#5C0F17] px-4 py-3 text-sm font-bold text-white hover:bg-[#4A0D15]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}