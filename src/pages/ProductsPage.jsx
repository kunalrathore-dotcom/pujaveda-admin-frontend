import { useEffect, useMemo, useState, useRef } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  RotateCcw,
  Package,
  X,
  Upload,
  RefreshCw,
  Star,
  ArrowLeft,
  ArrowRight,
  Eye,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import { productService } from "../services/productService";
import { categoryService } from "../services/categoryService";
import { couponService } from "../services/couponService";
import { uploadService } from "../services/uploadService";

const emptyForm = {
  name: "",
  sku: "",
  categoryId: "",
  subcategoryId: "",
  price: "",
  originalPrice: "",
  stock: "10",
  badge: "",
  shortDescription: "",
  description: "",
  material: "",
  weight: "",
  dimensions: "",
  packContents: "",
  origin: "Varanasi / Haridwar",
  idealFor: "Daily Puja, Festival Rituals",
  careInstructions: "Clean with a dry cotton cloth. Keep away from harsh chemicals.",
  tags: "",
  isPublished: true,
  isFeatured: false,
  images: [],
  imageIds: [],
  primaryImage: "",
  couponIds: [],
};

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[#EEDBC5] bg-white px-3.5 py-2.5 text-sm text-[#2D1C13] outline-none transition focus:border-[#5C0F17] focus:ring-2 focus:ring-[#DA9B26]/20";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewTab, setViewTab] = useState("active"); // "active" | "trash"
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [coupons, setCoupons] = useState([]);
  const [couponSearch, setCouponSearch] = useState("");
  const fileInputRef = useRef(null);

  const loadData = async (tab = viewTab) => {
    try {
      setLoading(true);
      const isDeletedQuery = tab === "trash" ? "true" : "false";
      const [fetchedProducts, fetchedCategories, couponRes] = await Promise.all([
        productService.getAll({ isPublished: "all", isDeleted: isDeletedQuery }),
        categoryService.getAll(),
        couponService.getCoupons({ limit: 100, isActive: "all" }),
      ]);

      setProducts(fetchedProducts || []);
      setCategories(fetchedCategories || []);
      setCoupons(couponRes?.data?.coupons || couponRes?.coupons || []);
    } catch (error) {
      console.error("Unable to load data:", error);
      setErrorMessage(error.message || "Unable to connect to product service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(viewTab);
  }, [viewTab]);

  const selectedCategory = useMemo(() => {
    return categories.find(
      (item) =>
        (item.slug || item.id) === form.categoryId || item._id === form.categoryId
    );
  }, [categories, form.categoryId]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const prodCategory = product.categoryId || product.category?.slug || product.category;
      const matchesCategory =
        categoryFilter === "all" || prodCategory === categoryFilter;

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "published"
          ? product.isPublished !== false
          : product.isPublished === false;

      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        (product.sku || "").toLowerCase().includes(q) ||
        (product.subcategoryName || "").toLowerCase().includes(q) ||
        (product.description || "").toLowerCase().includes(q);

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [products, categoryFilter, statusFilter, search]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // Multiple Image Batch Upload
  const handleBatchImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = 8 - (form.images?.length || 0);
    if (remainingSlots <= 0) {
      setErrors((prev) => ({ ...prev, image: "Maximum 8 images allowed per product." }));
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);

    try {
      setUploading(true);
      setUploadProgress(`Uploading ${filesToUpload.length} image(s)...`);
      setErrors((prev) => ({ ...prev, image: "" }));

      const res = await uploadService.uploadMultipleImages(filesToUpload, "products");

      const newUrls = res.urls || [];
      const newIds = res.publicIds || [];

      setForm((prev) => {
        const combinedImages = [...(prev.images || []), ...newUrls];
        const combinedIds = [...(prev.imageIds || []), ...newIds];
        return {
          ...prev,
          images: combinedImages,
          imageIds: combinedIds,
          primaryImage: prev.primaryImage || combinedImages[0] || "",
        };
      });

      setUploadProgress(`Successfully uploaded ${newUrls.length} image(s).`);
      setTimeout(() => setUploadProgress(""), 3000);
    } catch (err) {
      setErrors((prev) => ({ ...prev, image: err.message || "Failed to upload images." }));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index) => {
    setForm((prev) => {
      const removedUrl = prev.images[index];
      const newImages = prev.images.filter((_, i) => i !== index);
      const newIds = (prev.imageIds || []).filter((_, i) => i !== index);
      let newPrimary = prev.primaryImage;
      if (newPrimary === removedUrl) {
        newPrimary = newImages[0] || "";
      }
      return {
        ...prev,
        images: newImages,
        imageIds: newIds,
        primaryImage: newPrimary,
      };
    });
  };

  const moveImage = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= form.images.length) return;

    setForm((prev) => {
      const images = [...prev.images];
      const imageIds = [...(prev.imageIds || [])];

      const tempImg = images[index];
      images[index] = images[targetIndex];
      images[targetIndex] = tempImg;

      if (imageIds[index] !== undefined && imageIds[targetIndex] !== undefined) {
        const tempId = imageIds[index];
        imageIds[index] = imageIds[targetIndex];
        imageIds[targetIndex] = tempId;
      }

      return { ...prev, images, imageIds };
    });
  };

  const setAsPrimary = (url) => {
    setForm((prev) => ({ ...prev, primaryImage: url }));
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      categoryId: categories.find((c) => c.slug === "puja-items")?.slug || categories[0]?.slug || "",
    });
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingId(product._id || product.id);
    setForm({
      name: product.name || "",
      sku: product.sku || "",
      categoryId: product.categoryId || product.category?.slug || product.category,
      subcategoryId: product.subcategoryId || "",
      price: String(product.price || ""),
      originalPrice: product.originalPrice ? String(product.originalPrice) : "",
      stock: String(product.stock ?? 0),
      badge: product.badge || "",
      shortDescription: product.shortDescription || "",
      description: product.description || "",
      material: product.material || "",
      weight: product.weight || "",
      dimensions: product.dimensions || "",
      packContents: product.packContents || "",
      origin: product.origin || "",
      idealFor: product.idealFor || "",
      careInstructions: product.careInstructions || "",
      tags: Array.isArray(product.tags) ? product.tags.join(", ") : "",
      isPublished: product.isPublished !== false,
      isFeatured: Boolean(product.isFeatured),
      images: product.images || [],
      imageIds: product.imageIds || [],
      primaryImage: product.primaryImage || product.images?.[0] || "",
      couponIds: (product.assignedCoupons || []).map((c) => String(c._id || c)),
    });
    setCouponSearch("");
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Product name is required.";
    } else if (form.name.trim().length < 2) {
      nextErrors.name = "Product name must be at least 2 characters.";
    } else if (form.name.trim().length > 120) {
      nextErrors.name = "Product name cannot exceed 120 characters.";
    }

    if (form.sku && form.sku.trim().length > 50) {
      nextErrors.sku = "SKU cannot exceed 50 characters.";
    }

    if (!form.categoryId) {
      nextErrors.categoryId = "Category is required.";
    }

    if (!form.price || Number(form.price) <= 0) {
      nextErrors.price = "Enter a valid selling price greater than 0.";
    }

    if (form.originalPrice && Number(form.originalPrice) < Number(form.price)) {
      nextErrors.originalPrice = "Original price (MRP) cannot be less than selling price.";
    }

    if (form.stock === "" || Number(form.stock) < 0 || Number(form.stock) > 100000) {
      nextErrors.stock = "Enter a valid stock quantity between 0 and 100000.";
    }

    if (form.badge && form.badge.length > 30) {
      nextErrors.badge = "Badge cannot exceed 30 characters.";
    }

    if (form.shortDescription && form.shortDescription.length > 250) {
      nextErrors.shortDescription = "Short description cannot exceed 250 characters.";
    }

    if (form.description && form.description.length > 5000) {
      nextErrors.description = "Description cannot exceed 5000 characters.";
    }

    // Multiple Image Validation Rule: Minimum 5 images required for published products
    if (form.isPublished) {
      if (!form.images || form.images.length < 5) {
        nextErrors.image = `Every published product must have at least 5 images. (Currently: ${form.images?.length || 0} uploaded)`;
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setErrorMessage("");

    try {
      const parsedTags = form.tags
        ? form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim().toUpperCase(),
        categoryId: form.categoryId,
        subcategoryId: form.subcategoryId || "",
        subcategoryName:
          selectedCategory?.subcategories?.find(
            (s) => (s.slug || s.id) === form.subcategoryId
          )?.name || "",
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : Number(form.price),
        stock: Number(form.stock),
        badge: form.badge.trim(),
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        material: form.material.trim(),
        weight: form.weight.trim(),
        dimensions: form.dimensions.trim(),
        packContents: form.packContents.trim(),
        origin: form.origin.trim(),
        idealFor: form.idealFor.trim(),
        careInstructions: form.careInstructions.trim(),
        tags: parsedTags,
        isPublished: Boolean(form.isPublished),
        isFeatured: Boolean(form.isFeatured),
        images: form.images,
        imageIds: form.imageIds,
        primaryImage: form.primaryImage || form.images[0] || "",
        couponIds: form.couponIds,
      };

      if (editingId) {
        await productService.update(editingId, payload);
        setNotice("Product updated successfully.");
      } else {
        await productService.create(payload);
        setNotice("Product created successfully.");
      }

      setModalOpen(false);
      await loadData();
    } catch (error) {
      console.error("Save error:", error);
      setErrorMessage(error.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Move this product to trash? (You can restore it anytime from the Trash tab)"))
      return;

    try {
      await productService.remove(id);
      setNotice("Product moved to trash successfully.");
      await loadData();
    } catch (error) {
      console.error("Delete error:", error);
      setErrorMessage(error.message || "Failed to move product to trash.");
    }
  };

  const handleRestore = async (id) => {
    try {
      await productService.restore(id);
      setNotice("Product restored successfully.");
      await loadData();
    } catch (error) {
      console.error("Restore error:", error);
      setErrorMessage(error.message || "Failed to restore product.");
    }
  };

  return (
    <div className="min-h-screen">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#5C0F17] sm:text-3xl">
            Products
          </h1>
          <p className="mt-1 text-sm text-[#2D1C13]/70">
            Manage your store catalog and product inventory ({products.length} total products)
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-[#5C0F17] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#5C0F17]/20 transition hover:bg-[#4A0D15]"
        >
          <Plus size={18} /> Add Puja Product
        </button>
      </div>

      {notice && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
          {notice}
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
          {errorMessage}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        {/* Active vs Trash tabs */}
        <div className="flex rounded-xl bg-[#FAF5ED] p-1 border border-[#EEDBC5]">
          <button
            type="button"
            onClick={() => setViewTab("active")}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
              viewTab === "active"
                ? "bg-[#5C0F17] text-white shadow-xs"
                : "text-[#2D1C13]/70 hover:text-[#5C0F17]"
            }`}
          >
            Active Catalog
          </button>
          <button
            type="button"
            onClick={() => setViewTab("trash")}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
              viewTab === "trash"
                ? "bg-red-700 text-white shadow-xs"
                : "text-[#2D1C13]/70 hover:text-red-700"
            }`}
          >
            <Trash2 size={13} /> Trash / Deleted Items
          </button>
        </div>

        <div className="flex h-11 w-full max-w-sm items-center gap-2 rounded-xl border border-[#EEDBC5] bg-white px-3.5 focus-within:border-[#5C0F17] focus-within:ring-2 focus-within:ring-[#DA9B26]/20">
          <Search size={18} className="text-[#DA9B26]" />
          <input
            value={search}
            maxLength={100}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, samagri..."
            className="w-full bg-transparent text-sm outline-none text-[#2D1C13]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-11 rounded-xl border border-[#EEDBC5] bg-white px-3 text-xs font-semibold text-[#2D1C13] outline-none focus:border-[#5C0F17]"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id || cat.slug} value={cat.slug || cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 rounded-xl border border-[#EEDBC5] bg-white px-3 text-xs font-semibold text-[#2D1C13] outline-none focus:border-[#5C0F17]"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published Only</option>
            <option value="draft">Drafts Only</option>
          </select>
        </div>
      </div>

      {/* Product Table */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-[#EEDBC5] bg-[#FFFDF9] shadow-xs">
        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#5C0F17] border-t-transparent" />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#FAF5ED] text-xs uppercase tracking-wider text-[#5C0F17]">
                <tr>
                  <th className="px-5 py-4 font-bold">Product & Images</th>
                  <th className="px-5 py-4 font-bold">Category</th>
                  <th className="px-5 py-4 font-bold">Price</th>
                  <th className="px-5 py-4 font-bold">Stock</th>
                  <th className="px-5 py-4 font-bold">Status</th>
                  <th className="px-5 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#EEDBC5]">
                {filteredProducts.map((p) => {
                  const pid = p._id || p.id;
                  const displayImg = p.primaryImage || p.images?.[0] || "";
                  const imgCount = p.images?.length || 0;

                  return (
                    <tr key={pid} className="hover:bg-[#FFF8EE]/60 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 shrink-0 rounded-xl bg-[#FAF5ED] border border-[#EEDBC5] overflow-hidden">
                            {displayImg ? (
                              <img
                                src={displayImg}
                                alt={p.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-[#DA9B26]">
                                <Package size={20} />
                              </div>
                            )}
                            <span className="absolute bottom-0 right-0 rounded-tl-md bg-[#5C0F17] px-1 text-[9px] font-bold text-white">
                              {imgCount}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-[#2D1C13]">{p.name}</p>
                            <p className="text-xs text-[#2D1C13]/60 font-mono">
                              {p.sku ? `SKU: ${p.sku}` : `ID: ${pid.slice(-6)}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-[#2D1C13]">
                        {p.category?.name || p.categoryId}
                        {p.subcategoryName && (
                          <span className="block text-[11px] text-[#2D1C13]/60 font-normal">
                            {p.subcategoryName}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-bold text-[#5C0F17]">
                        ₹{Number(p.price).toFixed(2)}
                        {p.originalPrice && p.originalPrice > p.price && (
                          <span className="block text-[11px] text-[#2D1C13]/50 line-through">
                            ₹{Number(p.originalPrice).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            p.stock > 10
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : p.stock > 0
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-red-50 text-red-800 border border-red-200"
                          }`}
                        >
                          {p.stock} in stock
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        {p.isPublished !== false ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                            <CheckCircle size={13} /> Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                            <AlertCircle size={13} /> Draft
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {viewTab === "trash" ? (
                            <button
                              type="button"
                              onClick={() => handleRestore(pid)}
                              className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              title="Restore Product"
                            >
                              <RotateCcw size={14} /> Restore
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(p)}
                                aria-label="Edit product"
                                className="rounded-lg p-2 text-[#2D1C13]/70 hover:bg-[#FAF5ED] hover:text-[#5C0F17]"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(pid)}
                                aria-label="Move to trash"
                                className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700"
                                title="Move to trash"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
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
            <Package size={40} className="mx-auto text-[#DA9B26]/50" />
            <h3 className="mt-3 font-serif text-base font-bold text-[#5C0F17]">
              No Products Found
            </h3>
            <p className="mt-1 text-xs text-[#2D1C13]/60">
              There are no products matching your search criteria.
            </p>
          </div>
        )}
      </section>

      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[#EEDBC5] bg-[#FFFDF9] p-6 sm:p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-neutral-400 hover:bg-neutral-100"
            >
              <X size={20} />
            </button>

            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#5C0F17]">
              {editingId ? "Edit Puja Product" : "New Puja Product"}
            </h2>
            <p className="mt-1 text-xs text-[#2D1C13]/70">
              Published products must have at least 5 images. Drafts may be saved with fewer.
            </p>

            <form onSubmit={handleSave} className="mt-6 space-y-4">
              {/* Product Name & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#5C0F17]">
                      Product Name *
                    </label>
                    <span className="text-[10px] text-[#2D1C13]/50">{form.name.length}/120</span>
                  </div>
                  <input
                    required
                    minLength={2}
                    maxLength={120}
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Pure Brass Akhand Diya (Large)"
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#5C0F17]">
                      SKU
                    </label>
                    <span className="text-[10px] text-[#2D1C13]/50">{form.sku.length}/50</span>
                  </div>
                  <input
                    maxLength={50}
                    value={form.sku}
                    onChange={(e) => updateField("sku", e.target.value.toUpperCase())}
                    className={inputClass}
                    placeholder="e.g. BRASS-DIYA-01"
                  />
                  {errors.sku && <p className="mt-1 text-xs text-red-600">{errors.sku}</p>}
                </div>
              </div>

              {/* Category & Subcategory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5C0F17]">
                    Category *
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => {
                      updateField("categoryId", e.target.value);
                      updateField("subcategoryId", "");
                    }}
                    className={inputClass}
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c._id || c.slug} value={c.slug || c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && <p className="mt-1 text-xs text-red-600">{errors.categoryId}</p>}
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5C0F17]">
                    Subcategory
                  </label>
                  <select
                    value={form.subcategoryId}
                    onChange={(e) => updateField("subcategoryId", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select subcategory</option>
                    {(selectedCategory?.subcategories || []).map((s) => (
                      <option key={s._id || s.slug} value={s.slug || s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5C0F17]">
                    Selling Price (₹) *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="10000000"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => updateField("price", e.target.value)}
                    className={inputClass}
                  />
                  {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5C0F17]">
                    MRP / Original Price (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000000"
                    step="0.01"
                    value={form.originalPrice}
                    onChange={(e) => updateField("originalPrice", e.target.value)}
                    className={inputClass}
                  />
                  {errors.originalPrice && (
                    <p className="mt-1 text-xs text-red-600">{errors.originalPrice}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5C0F17]">
                    Stock Quantity *
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    max="100000"
                    value={form.stock}
                    onChange={(e) => updateField("stock", e.target.value)}
                    className={inputClass}
                  />
                  {errors.stock && <p className="mt-1 text-xs text-red-600">{errors.stock}</p>}
                </div>
              </div>

              {/* Section: Multiple Images Management (At least 5 images required for published products) */}
              <div className="rounded-2xl border border-[#EEDBC5] bg-[#FFF8EE] p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-serif text-sm font-bold text-[#5C0F17]">
                      Product Image Gallery (Min 5, Max 8)
                    </h3>
                    <p className="text-xs text-[#2D1C13]/70">
                      Upload multiple high-definition photos. Select primary image with star.
                    </p>
                  </div>
                  <span className="rounded-full bg-[#5C0F17] px-2.5 py-0.5 text-xs font-bold text-white">
                    {form.images?.length || 0}/8 uploaded
                  </span>
                </div>

                <div className="mt-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleBatchImageUpload}
                    disabled={uploading || (form.images?.length || 0) >= 8}
                    className="block w-full text-xs text-[#2D1C13] file:mr-3 file:rounded-xl file:border-0 file:bg-[#5C0F17] file:px-4 file:py-2.5 file:text-xs file:font-bold file:text-white hover:file:bg-[#4A0D15] disabled:opacity-50"
                  />
                </div>

                {uploading && (
                  <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#5C0F17]">
                    <RefreshCw size={14} className="animate-spin" />
                    <span>{uploadProgress}</span>
                  </div>
                )}
                {errors.image && <p className="mt-1.5 text-xs font-bold text-red-600">{errors.image}</p>}

                {/* Uploaded Gallery Grid */}
                {form.images && form.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {form.images.map((img, idx) => {
                      const isPrimary = form.primaryImage === img || (!form.primaryImage && idx === 0);
                      return (
                        <div
                          key={idx}
                          className={`relative group rounded-xl border-2 overflow-hidden bg-white p-1 transition ${
                            isPrimary ? "border-[#DA9B26] shadow-sm" : "border-[#EEDBC5]"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`Product view ${idx + 1}`}
                            className="h-24 w-full object-contain rounded-lg"
                          />

                          {/* Primary Badge */}
                          {isPrimary && (
                            <span className="absolute top-2 left-2 rounded-md bg-[#DA9B26] px-1.5 py-0.5 text-[9px] font-black uppercase text-white shadow-xs">
                              Primary
                            </span>
                          )}

                          {/* Image Actions Bar */}
                          <div className="mt-1 flex items-center justify-between border-t border-[#EEDBC5] pt-1">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                title="Move left"
                                disabled={idx === 0}
                                onClick={() => moveImage(idx, -1)}
                                className="p-1 text-neutral-500 hover:text-[#5C0F17] disabled:opacity-30"
                              >
                                <ArrowLeft size={12} />
                              </button>
                              <button
                                type="button"
                                title="Move right"
                                disabled={idx === form.images.length - 1}
                                onClick={() => moveImage(idx, 1)}
                                className="p-1 text-neutral-500 hover:text-[#5C0F17] disabled:opacity-30"
                              >
                                <ArrowRight size={12} />
                              </button>
                            </div>

                            <button
                              type="button"
                              title="Set as primary"
                              onClick={() => setAsPrimary(img)}
                              className={`p-1 ${isPrimary ? "text-[#DA9B26]" : "text-neutral-400 hover:text-[#DA9B26]"}`}
                            >
                              <Star size={14} fill={isPrimary ? "currentColor" : "none"} />
                            </button>

                            <button
                              type="button"
                              title="Delete image"
                              onClick={() => removeImage(idx)}
                              className="p-1 text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Devotional Product Specifications */}
              <div className="rounded-2xl border border-[#EEDBC5] bg-white p-4 sm:p-5 space-y-3">
                <h3 className="font-serif text-sm font-bold text-[#5C0F17]">
                  Vedic & Physical Specifications
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#2D1C13]/70">Material</label>
                    <input
                      maxLength={100}
                      value={form.material}
                      onChange={(e) => updateField("material", e.target.value)}
                      className={inputClass}
                      placeholder="e.g. Pure Brass, Copper, Sandalwood"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#2D1C13]/70">Weight</label>
                    <input
                      maxLength={50}
                      value={form.weight}
                      onChange={(e) => updateField("weight", e.target.value)}
                      className={inputClass}
                      placeholder="e.g. 450 grams"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#2D1C13]/70">Dimensions</label>
                    <input
                      maxLength={50}
                      value={form.dimensions}
                      onChange={(e) => updateField("dimensions", e.target.value)}
                      className={inputClass}
                      placeholder="e.g. 6 x 6 x 8 inches"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#2D1C13]/70">Pack Contents</label>
                    <input
                      maxLength={250}
                      value={form.packContents}
                      onChange={(e) => updateField("packContents", e.target.value)}
                      className={inputClass}
                      placeholder="e.g. 1 Brass Diya, 1 Cotton Wick pack, 1 Gangajal bottle"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#2D1C13]/70">Origin / Sacred Source</label>
                    <input
                      maxLength={100}
                      value={form.origin}
                      onChange={(e) => updateField("origin", e.target.value)}
                      className={inputClass}
                      placeholder="e.g. Varanasi / Haridwar"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#2D1C13]/70">Ideal For / Puja Occasions</label>
                  <input
                    maxLength={250}
                    value={form.idealFor}
                    onChange={(e) => updateField("idealFor", e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Daily Puja, Satyanarayan Katha, Navratri, Diwali"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#2D1C13]/70">Care Instructions</label>
                  <input
                    maxLength={500}
                    value={form.careInstructions}
                    onChange={(e) => updateField("careInstructions", e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Clean with Pitambari or lemon-salt paste for shine."
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5C0F17]">
                    Short Description
                  </label>
                  <span className="text-[10px] text-[#2D1C13]/50">
                    {form.shortDescription.length}/250
                  </span>
                </div>
                <input
                  maxLength={250}
                  value={form.shortDescription}
                  onChange={(e) => updateField("shortDescription", e.target.value)}
                  className={inputClass}
                  placeholder="Brief one-sentence summary for previews and social cards..."
                />
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5C0F17]">
                    Full Description
                  </label>
                  <span className="text-[10px] text-[#2D1C13]/50">
                    {form.description.length}/5000
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={5000}
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  className={inputClass}
                  placeholder="Detailed Vedic significance, usage guidelines, and features..."
                />
              </div>

              {/* Status Toggles */}
              <div className="flex flex-wrap items-center gap-6 rounded-xl border border-[#EEDBC5] bg-[#FAF5ED] p-3.5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#5C0F17]">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => updateField("isPublished", e.target.checked)}
                    className="h-4 w-4 rounded accent-[#5C0F17]"
                  />
                  <span>Published to Customer Storefront</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#5C0F17]">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => updateField("isFeatured", e.target.checked)}
                    className="h-4 w-4 rounded accent-[#5C0F17]"
                  />
                  <span>Featured Collection Item</span>
                </label>
              </div>

              {/* Assigned Coupons */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#5C0F17]">
                  Assigned Coupons
                </label>
                <input
                  type="text"
                  value={couponSearch}
                  maxLength={30}
                  onChange={(e) => setCouponSearch(e.target.value)}
                  className={inputClass}
                  placeholder="Search coupons to attach..."
                />
                <div className="mt-2 max-h-36 space-y-1.5 overflow-y-auto rounded-xl border border-[#EEDBC5] p-2 bg-white">
                  {coupons
                    .filter((coupon) => {
                      const q = couponSearch.trim().toLowerCase();
                      if (!q) return true;
                      return (
                        coupon.code.toLowerCase().includes(q) ||
                        (coupon.description || "").toLowerCase().includes(q)
                      );
                    })
                    .map((coupon) => {
                      const id = String(coupon._id);
                      const selected = form.couponIds.includes(id);
                      return (
                        <label
                          key={id}
                          className={`flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1 text-xs ${
                            selected ? "bg-[#FAF5ED] text-[#5C0F17] font-bold" : "hover:bg-neutral-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => {
                              const next = selected
                                ? form.couponIds.filter((v) => v !== id)
                                : [...form.couponIds, id];
                              updateField("couponIds", next);
                            }}
                            className="mt-0.5 accent-[#5C0F17]"
                          />
                          <span>
                            <span>{coupon.code}</span>
                            <span className="ml-1 text-[#2D1C13]/60 font-normal">
                              ({coupon.discountType === "percentage" ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`} off)
                            </span>
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#EEDBC5]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-[#EEDBC5] px-5 py-2.5 text-xs font-bold text-[#2D1C13] hover:bg-[#FAF5ED]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="rounded-xl bg-[#5C0F17] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-[#5C0F17]/20 transition hover:bg-[#4A0D15] disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingId ? "Update Product" : "Publish Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
