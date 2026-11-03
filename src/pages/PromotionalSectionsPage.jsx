import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Image as ImageIcon,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Sparkles,
  Eye,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { promotionalSectionService } from "../services/promotionalSectionService";
import { uploadService } from "../services/uploadService";
import { resolveImageUrl } from "../utils/imageHelper";

const blank = {
  title: "",
  pretitle: "",
  description: "",
  imageUrl: "",
  imageId: "",
  ctaText: "Explore Essentials",
  link: "/category/puja-items",
  placement: "all",
  categorySlug: "",
  isActive: true,
  order: 0,
};

const getFieldClass = (hasError) =>
  `mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#2D1C13] outline-none transition ${
    hasError
      ? "border-rose-500 ring-1 ring-rose-500 bg-rose-50/20 focus:border-rose-600 focus:ring-rose-500"
      : "border-[#EEDBC5] bg-white focus:border-[#5C0F17] focus:ring-2 focus:ring-[#DA9B26]/20"
  }`;
const fieldClass = getFieldClass(false);

export default function PromotionalSectionsPage() {
  const [cards, setCards] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const fileInputRef = useRef(null);

  const load = async () => {
    try {
      const data = await promotionalSectionService.getAll({ isDeleted: "false" });
      setCards(data);
    } catch (err) {
      setError(err.message || "Failed to load promotional sections.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const activeCount = cards.filter((c) => !c.isDeleted).length;
  const isLimitReached = activeCount >= 2;

  const openForm = (card = null) => {
    if (!card && isLimitReached) {
      setError("Maximum 2 promotional assets allowed. Delete an existing card to add another.");
      return;
    }
    setEditingId(card?._id || card?.id || null);
    setForm(
      card
        ? {
            title: card.title || "",
            pretitle: card.pretitle || "",
            description: card.description || "",
            imageUrl: card.imageUrl || "",
            imageId: card.imageId || "",
            ctaText: card.ctaText || "Explore Essentials",
            link: card.link || "/category/puja-items",
            placement: card.placement || "all",
            categorySlug: card.categorySlug || "",
            isActive: Boolean(card.isActive),
            order: card.order || 0,
          }
        : { ...blank }
    );
    setError("");
    setFieldErrors({});
    setNotice("");
    setFormOpen(true);
  };

  const handleImageSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);
    try {
      const res = await uploadService.uploadImage(file, "promotions");
      setForm((prev) => ({
        ...prev,
        imageUrl: res.url,
        imageId: res.publicId || res.public_id || "",
      }));
    } catch (err) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) {
      errs.title = "Card title is required.";
    } else if (form.title.trim().length > 60) {
      errs.title = "Card title cannot exceed 60 characters.";
    }

    if (!form.pretitle.trim()) {
      errs.pretitle = "Pretitle is required.";
    } else if (form.pretitle.trim().length > 60) {
      errs.pretitle = "Pretitle cannot exceed 60 characters.";
    }

    if (!form.description.trim()) {
      errs.description = "Description is required.";
    } else if (form.description.trim().length > 300) {
      errs.description = "Description cannot exceed 300 characters.";
    }

    if (!form.imageUrl) {
      errs.imageUrl = "Promotional card image is required.";
    }

    if (!form.ctaText.trim()) {
      errs.ctaText = "Button label is required.";
    } else if (form.ctaText.trim().length > 30) {
      errs.ctaText = "Button label cannot exceed 30 characters.";
    }

    if (!form.link.trim()) {
      errs.link = "Destination link URL is required.";
    } else if (form.link.trim().length > 250) {
      errs.link = "Link URL cannot exceed 250 characters.";
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});

    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await promotionalSectionService.update(editingId, form);
        setNotice("Promotional section updated successfully.");
      } else {
        await promotionalSectionService.create(form);
        setNotice("New promotional section created successfully.");
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      setError(err.message || "Failed to save promotional section.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (card) => {
    const id = card._id || card.id;
    try {
      await promotionalSectionService.update(id, { isActive: !card.isActive });
      await load();
    } catch (err) {
      setError(err.message || "Failed to update status.");
    }
  };

  const handleDelete = async (card) => {
    const id = card._id || card.id;
    if (!window.confirm(`Are you sure you want to delete promotional section "${card.title}"?`)) return;
    try {
      await promotionalSectionService.delete(id);
      await load();
      setNotice("Promotional card deleted successfully.");
    } catch (err) {
      setError(err.message || "Failed to delete card.");
    }
  };

  const handleBulkDelete = async (idsToDelete) => {
    if (!idsToDelete || idsToDelete.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${idsToDelete.length} promotional card(s)?`)) return;

    try {
      setSaving(true);
      await promotionalSectionService.bulkTrash(idsToDelete);
      setNotice(`${idsToDelete.length} card(s) deleted successfully.`);
      setSelectedIds([]);
      setTimeout(() => setNotice(""), 3500);
      await load();
    } catch (err) {
      console.error("Bulk delete error:", err);
      setError(err.message || "Failed to delete selected cards.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#5C0F17]">
            Promotional Sections
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#2D1C13]/70">
            Manage devotional promo cards rendered before the footer across homepage and category pages.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openForm()}
          className="inline-flex items-center gap-2 rounded-xl bg-[#5C0F17] hover:bg-[#4A0D15] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#5C0F17]/20 transition"
        >
          <Plus size={16} className="text-white" />
          <span className="text-white">Add Promotional Card</span>
        </button>
      </div>

      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Bulk Action Controls */}
      {cards.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EEDBC5] bg-[#FAF5ED] px-4 py-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-[#2D1C13] cursor-pointer">
              <input
                type="checkbox"
                checked={cards.length > 0 && selectedIds.length === cards.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedIds(cards.map((c) => c._id || c.id));
                  } else {
                    setSelectedIds([]);
                  }
                }}
                className="h-4 w-4 rounded accent-[#5C0F17]"
              />
              <span>Select All</span>
            </label>
            <span className="text-xs font-semibold text-[#5C0F17]">
              {selectedIds.length > 0 ? `(${selectedIds.length} of ${cards.length} selected)` : ''}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={() => handleBulkDelete(selectedIds)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              <Trash2 size={13} />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => {
          const id = card._id || card.id;
          return (
            <div
              key={id}
              className="relative overflow-hidden rounded-2xl border border-[#EEDBC5] bg-white shadow-sm flex flex-col justify-between transition hover:border-[#DA9B26] hover:shadow-md"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-100">
                <img
                  src={resolveImageUrl(card.imageUrl)}
                  alt={card.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      card.isActive
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-neutral-200 text-neutral-600 border border-neutral-300"
                    }`}
                  >
                    {card.isActive ? "Active" : "Inactive"}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold text-[#5C0F17] border border-[#EEDBC5]">
                    Order: {card.order || 0}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-[#DA9B26]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#5C0F17] border border-[#DA9B26]/40">
                    {card.placement === "all"
                      ? "All Pages"
                      : card.placement === "homepage"
                      ? "Homepage Only"
                      : "Category Pages"}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  {card.pretitle && (
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#DA9B26]">
                      {card.pretitle}
                    </p>
                  )}
                  <h3 className="mt-1 font-serif text-lg font-bold text-[#5C0F17]">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-xs text-[#2D1C13]/70 line-clamp-2">
                    {card.description}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-[#EEDBC5] flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#5C0F17] truncate max-w-[200px]">
                    CTA: {card.ctaText} → {card.link}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggle(card)}
                      title={card.isActive ? "Deactivate" : "Activate"}
                      className="p-1.5 rounded-lg text-neutral-600 hover:bg-[#FAF5ED] transition"
                    >
                      {card.isActive ? (
                        <ToggleRight size={20} className="text-emerald-600" />
                      ) : (
                        <ToggleLeft size={20} className="text-neutral-400" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => openForm(card)}
                      title="Edit"
                      className="p-1.5 rounded-lg text-neutral-600 hover:bg-[#FAF5ED] hover:text-[#5C0F17] transition"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(card)}
                      title="Delete section"
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {cards.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#EEDBC5] bg-white p-12 text-center">
          <Sparkles className="mx-auto text-[#DA9B26]" size={36} />
          <h3 className="mt-3 font-serif text-lg font-bold text-[#5C0F17]">
            No Promotional Cards Configured
          </h3>
          <p className="mt-1 text-xs text-[#2D1C13]/70">
            Create pre-footer cards like "Mandir & Brass Utensils" or "Havan Essentials".
          </p>
          <button
            type="button"
            onClick={() => openForm()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#5C0F17] px-4 py-2 text-xs font-bold text-white shadow-sm"
          >
            <Plus size={14} className="text-white" />
            <span className="text-white">Create First Card</span>
          </button>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-[#EEDBC5] my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#EEDBC5]">
              <h2 className="font-serif text-xl font-bold text-[#5C0F17]">
                {editingId ? "Edit Promotional Card" : "New Promotional Card"}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-5 space-y-4">
              {/* Image Upload Area */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C0F17] mb-1">
                  Card Background Image *
                </label>
                <div className="flex gap-4 items-center">
                  {form.imageUrl ? (
                    <div className="relative h-28 w-44 rounded-xl overflow-hidden border border-[#EEDBC5] shrink-0 bg-neutral-100">
                      <img
                        src={resolveImageUrl(form.imageUrl)}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, imageUrl: "", imageId: "" }))}
                        className="absolute top-1.5 right-1.5 rounded-full bg-red-600 p-1 text-white shadow-sm"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-28 w-44 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#DA9B26]/60 bg-[#FAF5ED] text-xs font-semibold text-[#5C0F17] hover:bg-[#F3E9DA] transition shrink-0"
                    >
                      {uploading ? (
                        <RefreshCw size={20} className="animate-spin text-[#DA9B26]" />
                      ) : (
                        <>
                          <ImageIcon size={22} className="text-[#DA9B26] mb-1" />
                          <span>Upload Image</span>
                        </>
                      )}
                    </button>
                  )}

                  <div className="flex-1 text-xs text-[#2D1C13]/70">
                    <p className="font-semibold text-[#2D1C13]">High-resolution devotional photo</p>
                    <p className="mt-1">Recommended: 800×600 or 1200×800 px (JPEG, PNG, WebP up to 5MB).</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Title & Pretitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5C0F17]">
                      Title *
                    </label>
                    <span className="text-[10px] text-neutral-400">{form.title.length}/60</span>
                  </div>
                  <input
                    type="text"
                    maxLength={60}
                    value={form.title}
                    onChange={(e) => {
                      setForm({ ...form, title: e.target.value });
                      if (fieldErrors.title) setFieldErrors({ ...fieldErrors, title: "" });
                    }}
                    placeholder="e.g. Mandir & Brass Puja Utensils"
                    required
                    className={getFieldClass(Boolean(fieldErrors.title))}
                  />
                  {fieldErrors.title && (
                    <p className="mt-1 text-[11px] font-semibold text-rose-600">{fieldErrors.title}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5C0F17]">
                      Pretitle / Tagline
                    </label>
                    <span className="text-[10px] text-neutral-400">{form.pretitle.length}/60</span>
                  </div>
                  <input
                    type="text"
                    maxLength={60}
                    required
                    value={form.pretitle}
                    onChange={(e) => {
                      setForm({ ...form, pretitle: e.target.value });
                      if (fieldErrors.pretitle) setFieldErrors({ ...fieldErrors, pretitle: "" });
                    }}
                    placeholder="e.g. Sacred Altar Setup"
                    className={getFieldClass(Boolean(fieldErrors.pretitle))}
                  />
                  {fieldErrors.pretitle && (
                    <p className="mt-1 text-[11px] font-semibold text-rose-600">{fieldErrors.pretitle}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C0F17]">
                    Description
                  </label>
                  <span className="text-[10px] text-neutral-400">{form.description.length}/300</span>
                </div>
                <textarea
                  rows={2}
                  maxLength={300}
                  required
                  value={form.description}
                  onChange={(e) => {
                    setForm({ ...form, description: e.target.value });
                    if (fieldErrors.description) setFieldErrors({ ...fieldErrors, description: "" });
                  }}
                  placeholder="Authentic brass diyas, bell (ghanti), shankh stand, and thali sets for daily morning archana."
                  className={getFieldClass(Boolean(fieldErrors.description))}
                />
                {fieldErrors.description && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600">{fieldErrors.description}</p>
                )}
              </div>

              {/* CTA & Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C0F17]">
                    Button Label
                  </label>
                  <input
                    type="text"
                    maxLength={30}
                    required
                    value={form.ctaText}
                    onChange={(e) => {
                      setForm({ ...form, ctaText: e.target.value });
                      if (fieldErrors.ctaText) setFieldErrors({ ...fieldErrors, ctaText: "" });
                    }}
                    placeholder="Explore Essentials"
                    className={getFieldClass(Boolean(fieldErrors.ctaText))}
                  />
                  {fieldErrors.ctaText && (
                    <p className="mt-1 text-[11px] font-semibold text-rose-600">{fieldErrors.ctaText}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C0F17]">
                    Destination Link
                  </label>
                  <input
                    type="text"
                    maxLength={250}
                    required
                    value={form.link}
                    onChange={(e) => {
                      setForm({ ...form, link: e.target.value });
                      if (fieldErrors.link) setFieldErrors({ ...fieldErrors, link: "" });
                    }}
                    placeholder="/category/puja-utensils"
                    className={getFieldClass(Boolean(fieldErrors.link))}
                  />
                  {fieldErrors.link && (
                    <p className="mt-1 text-[11px] font-semibold text-rose-600">{fieldErrors.link}</p>
                  )}
                </div>
              </div>

              {/* Display Placement */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C0F17]">
                  Display Placement *
                </label>
                <select
                  value={form.placement}
                  onChange={(e) => setForm({ ...form, placement: e.target.value })}
                  className={fieldClass}
                >
                  <option value="all">All Pages (Homepage & Category Pages)</option>
                  <option value="homepage">Homepage Only</option>
                  <option value="category">Category Pages Only</option>
                </select>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  id="cardActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded-md border-[#EEDBC5] text-[#5C0F17] focus:ring-[#DA9B26]"
                />
                <label htmlFor="cardActive" className="text-xs font-bold text-[#2D1C13]">
                  Publish / Active immediately
                </label>
              </div>

              {/* Live Preview Panel */}
              <div className="rounded-xl border border-[#DA9B26]/40 bg-[#FAF5ED] p-4 mt-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#5C0F17] mb-2 flex items-center gap-1.5">
                  <Eye size={13} className="text-[#DA9B26]" />
                  <span>Live Storefront Preview</span>
                </p>

                <div className="relative overflow-hidden rounded-2xl border border-[#EEDBC5] bg-[#FFF8EE] shadow-sm min-h-[160px] flex flex-col justify-end p-4">
                  {form.imageUrl && (
                    <img
                      src={resolveImageUrl(form.imageUrl)}
                      alt="Preview"
                      className="absolute inset-0 h-full w-full object-cover opacity-60"
                    />
                  )}
                  <div className="relative z-10 rounded-xl bg-[#5C0F17]/90 p-4 text-white backdrop-blur-xs border border-[#DA9B26]/30">
                    {form.pretitle && (
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#DA9B26]">
                        {form.pretitle}
                      </p>
                    )}
                    <h4 className="font-serif text-base font-bold text-white">
                      {form.title || "Card Title"}
                    </h4>
                    {form.description && (
                      <p className="mt-1 text-[11px] text-[#FAF5ED]/80 line-clamp-2">
                        {form.description}
                      </p>
                    )}
                    <div className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-[#DA9B26]">
                      <span>{form.ctaText || "Explore"}</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EEDBC5]">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-xl border border-[#EEDBC5] bg-white px-5 py-2.5 text-xs font-bold text-[#2D1C13] hover:bg-neutral-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#5C0F17] hover:bg-[#4A0D15] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-[#5C0F17]/20 transition disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin text-white" />
                      <span className="text-white">Saving...</span>
                    </>
                  ) : (
                    <span className="text-white">{editingId ? "Update Section" : "Publish Section"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

