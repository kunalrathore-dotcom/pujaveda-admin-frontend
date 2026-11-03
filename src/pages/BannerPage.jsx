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
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { bannerService, MAX_BANNERS } from "../services/bannerService";
import { uploadService } from "../services/uploadService";
import { resolveImageUrl } from "../utils/imageHelper";

const blank = {
  title: "",
  subtitle: "",
  imageUrl: "",
  imageId: "",
  ctaText: "Explore Collection",
  link: "/category/puja-items",
  active: true,
  order: 0,
};

const getFieldClass = (hasError) =>
  `mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#2D1C13] outline-none transition ${
    hasError
      ? "border-rose-500 ring-1 ring-rose-500 bg-rose-50/20 focus:border-rose-600 focus:ring-rose-500"
      : "border-[#EEDBC5] bg-white focus:border-[#5C0F17] focus:ring-2 focus:ring-[#DA9B26]/20"
  }`;
const fieldClass = getFieldClass(false);

export default function BannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const fileInputRef = useRef(null);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await bannerService.getAll({ isDeleted: "false" });
      setBanners(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load banners from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openForm = (banner = null) => {
    setEditingId(banner?._id || banner?.id || null);
    setForm(
      banner
        ? {
            title: banner.title || "",
            subtitle: banner.subtitle || "",
            imageUrl: banner.imageUrl || "",
            imageId: banner.imageId || "",
            ctaText: banner.ctaText || "Explore Collection",
            link: banner.link || "/category/puja-items",
            active: Boolean(banner.active),
            order: banner.order || 0,
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

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please select a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Banner image must be 5MB or smaller.");
      event.target.value = "";
      return;
    }

    try {
      setUploading(true);
      const res = await uploadService.uploadImage(file, "banners");
      setForm((current) => ({
        ...current,
        imageUrl: res.url,
        imageId: res.publicId,
      }));
    } catch (err) {
      setError(err.message || "Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const save = async (event) => {
    event.preventDefault();
    if (saving || uploading) return; // Prevent duplicate submissions

    setError("");
    setNotice("");

    const errs = {};
    if (!form.title.trim()) {
      errs.title = "Banner title is required.";
    } else if (form.title.trim().length > 60) {
      errs.title = "Banner title cannot exceed 60 characters.";
    }

    if (!form.subtitle.trim()) {
      errs.subtitle = "Banner description is required.";
    } else if (form.subtitle.trim().length > 160) {
      errs.subtitle = "Banner description cannot exceed 160 characters.";
    }

    if (!form.imageUrl) {
      errs.imageUrl = "Please upload a desktop banner image.";
    }

    if (form.ctaText && form.ctaText.length > 30) {
      errs.ctaText = "CTA button text cannot exceed 30 characters.";
    }

    if (form.link && form.link.length > 250) {
      errs.link = "Link URL cannot exceed 250 characters.";
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});

    setSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        imageUrl: form.imageUrl,
        imageId: form.imageId,
        ctaText: form.ctaText.trim(),
        link: form.link.trim(),
        active: Boolean(form.active),
        order: Number(form.order || 0),
      };

      if (editingId) {
        await bannerService.update(editingId, payload);
        setNotice("Banner updated successfully.");
      } else {
        await bannerService.create(payload);
        setNotice("Banner created successfully.");
      }

      setFormOpen(false);
      setTimeout(() => setNotice(""), 4000);
      await load();
    } catch (err) {
      setError(err.message || "Unable to save banner.");
    } finally {
      setSaving(false);
    }
  };

  const removeBanner = async (id) => {
    if (deletingId || saving) return; // Prevent concurrent delete
    if (!window.confirm("Are you sure you want to delete this banner?")) return;

    setError("");
    setNotice("");
    setDeletingId(id);

    try {
      await bannerService.remove(id);
      setNotice("Banner deleted successfully.");
      setTimeout(() => setNotice(""), 4000);
      await load();
    } catch (err) {
      setError(err.message || "Unable to delete banner.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async (idsToDelete) => {
    if (!idsToDelete || idsToDelete.length === 0 || bulkDeleting || saving) return;
    if (!window.confirm(`Are you sure you want to delete ${idsToDelete.length} banner(s)?`)) return;

    try {
      setBulkDeleting(true);
      setError("");
      await bannerService.bulkTrash(idsToDelete);
      setNotice(`${idsToDelete.length} banner(s) deleted successfully.`);
      setSelectedIds([]);
      setTimeout(() => setNotice(""), 4000);
      await load();
    } catch (err) {
      console.error("Bulk delete error:", err);
      setError(err.message || "Failed to delete selected banners.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleActive = async (banner) => {
    const bannerId = banner._id || banner.id;
    if (togglingId) return;

    try {
      setTogglingId(bannerId);
      await bannerService.update(bannerId, {
        active: !banner.active,
      });
      await load();
    } catch (err) {
      setError(err.message || "Unable to toggle banner status.");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="min-h-screen space-y-5">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#5C0F17] sm:text-3xl">
            Banners
          </h1>
          <p className="mt-1 text-sm text-[#2D1C13]/70">
            Manage alternating carousel slides for the customer storefront ({banners.length}/{MAX_BANNERS} used)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 shadow-xs transition disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            disabled={banners.length >= MAX_BANNERS || loading}
            onClick={() => openForm()}
            className="flex items-center gap-2 rounded-xl bg-[#5C0F17] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#5C0F17]/20 transition hover:bg-[#4A0D15] disabled:opacity-50"
          >
            <Plus size={18} /> Add Banner Slide
          </button>
        </div>
      </div>

      {notice && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
          <button type="button" onClick={() => setNotice("")} className="text-emerald-600 hover:text-emerald-900">
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError("")} className="text-rose-600 hover:text-rose-900">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Bulk Action Controls */}
      {banners.length > 0 && !loading && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EEDBC5] bg-[#FAF5ED] px-4 py-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-[#2D1C13] cursor-pointer">
              <input
                type="checkbox"
                checked={banners.length > 0 && selectedIds.length === banners.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedIds(banners.map((b) => b._id || b.id));
                  } else {
                    setSelectedIds([]);
                  }
                }}
                className="h-4 w-4 rounded accent-[#5C0F17]"
              />
              <span>Select All</span>
            </label>
            <span className="text-xs font-semibold text-[#5C0F17]">
              {selectedIds.length > 0 ? `(${selectedIds.length} of ${banners.length} selected)` : ""}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={selectedIds.length === 0 || bulkDeleting}
              onClick={() => handleBulkDelete(selectedIds)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {bulkDeleting ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 size={13} />
                  <span>Delete Selected</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Grid View / Loading / Empty States */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full rounded-2xl border border-neutral-200/80 bg-white p-16 text-center shadow-xs">
            <div className="flex flex-col items-center justify-center gap-3">
              <RefreshCw className="animate-spin text-[#5C0F17]" size={32} />
              <p className="text-sm font-bold text-[#5C0F17]">Loading promotional banners...</p>
              <p className="text-xs text-neutral-400">Fetching carousel slides from database</p>
            </div>
          </div>
        ) : banners.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-[#EEDBC5] bg-[#FFF8EE] p-12 text-center">
            <ImageIcon size={40} className="mx-auto text-[#DA9B26]/50" />
            <h3 className="mt-3 font-serif text-base font-bold text-[#5C0F17]">
              No Promotional Banners Found
            </h3>
            <p className="mt-1 text-xs text-[#2D1C13]/60">
              Add up to {MAX_BANNERS} banners for the alternating storefront carousel.
            </p>
            <button
              type="button"
              onClick={() => openForm()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#5C0F17] px-4 py-2 text-xs font-bold text-white hover:bg-[#4A0D15] transition"
            >
              <Plus size={14} /> Add First Banner
            </button>
          </div>
        ) : (
          banners.map((banner) => {
            const bId = banner._id || banner.id;
            const isDeletingThis = deletingId === bId;
            const isTogglingThis = togglingId === bId;

            return (
              <article
                key={bId}
                className="group relative overflow-hidden rounded-2xl border border-[#EEDBC5] bg-[#FFFDF9] shadow-xs flex flex-col justify-between transition hover:border-[#DA9B26] hover:shadow-md"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(bId)}
                  onChange={() => {
                    setSelectedIds((prev) =>
                      prev.includes(bId) ? prev.filter((id) => id !== bId) : [...prev, bId]
                    );
                  }}
                  className="absolute right-3 top-3 z-20 h-5 w-5 rounded accent-[#5C0F17] shadow-sm cursor-pointer"
                />
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#FAF5ED]">
                  <img
                    src={resolveImageUrl(banner.imageUrl)}
                    alt={banner.title}
                    className="h-full w-full object-cover"
                  />
                  <span
                    className={`absolute left-3 top-3 rounded-md px-2 py-0.5 text-[10px] font-extrabold tracking-wider ${
                      banner.active ? "bg-emerald-700 text-white" : "bg-neutral-800 text-white"
                    }`}
                  >
                    {banner.active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="font-serif text-base font-bold text-[#5C0F17] line-clamp-1">
                      {banner.title}
                    </h2>
                    {banner.subtitle && (
                      <p className="mt-1 text-xs text-[#2D1C13]/70 line-clamp-2">
                        {banner.subtitle}
                      </p>
                    )}
                    <p className="mt-2 text-[11px] text-[#DA9B26] font-mono">
                      Link: {banner.link || "/"}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#EEDBC5] pt-3">
                    <button
                      type="button"
                      disabled={isTogglingThis}
                      onClick={() => toggleActive(banner)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#2D1C13] hover:text-[#5C0F17] disabled:opacity-50"
                    >
                      {isTogglingThis ? (
                        <RefreshCw size={16} className="animate-spin text-[#5C0F17]" />
                      ) : banner.active ? (
                        <ToggleRight size={20} className="text-[#5C0F17]" />
                      ) : (
                        <ToggleLeft size={20} className="text-neutral-400" />
                      )}
                      <span>{banner.active ? "Active" : "Hidden"}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isDeletingThis || saving}
                        onClick={() => openForm(banner)}
                        aria-label="Edit banner"
                        className="rounded-lg p-2 text-[#2D1C13]/70 hover:bg-[#FAF5ED] hover:text-[#5C0F17] disabled:opacity-40 transition"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        disabled={isDeletingThis || saving}
                        onClick={() => removeBanner(bId)}
                        aria-label="Delete banner"
                        className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40 transition"
                        title="Delete banner"
                      >
                        {isDeletingThis ? (
                          <RefreshCw size={16} className="animate-spin text-rose-600" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Modal Dialog with Loading Feedback */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#EEDBC5] bg-[#FFFDF9] p-6 sm:p-8 shadow-2xl">
            <button
              type="button"
              disabled={saving || uploading}
              onClick={() => setFormOpen(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-neutral-400 hover:bg-neutral-100 disabled:opacity-40"
            >
              <X size={20} />
            </button>

            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#5C0F17]">
              {editingId ? "Edit Promotional Banner" : "New Promotional Banner"}
            </h2>
            <p className="mt-1 text-xs text-[#2D1C13]/70">
              Upload a high-definition image (1600x600 recommended, max 5MB).
            </p>

            <form onSubmit={save} className="mt-5 space-y-4">
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5C0F17]">
                    Banner Title *
                  </label>
                  <span className="text-[10px] text-[#2D1C13]/50">{form.title.length}/60</span>
                </div>
                <input
                  required
                  maxLength={60}
                  disabled={saving}
                  value={form.title}
                  onChange={(e) => {
                    setForm({ ...form, title: e.target.value });
                    if (fieldErrors.title) setFieldErrors({ ...fieldErrors, title: "" });
                  }}
                  className={getFieldClass(Boolean(fieldErrors.title))}
                  placeholder="e.g. Sacred Durga & Navratri Puja Samagri"
                />
                {fieldErrors.title && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600">{fieldErrors.title}</p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5C0F17]">
                    Description / Subtitle *
                  </label>
                  <span className="text-[10px] text-[#2D1C13]/50">
                    {form.subtitle.length}/160
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={160}
                  required
                  disabled={saving}
                  value={form.subtitle}
                  onChange={(e) => {
                    setForm({ ...form, subtitle: e.target.value });
                    if (fieldErrors.subtitle) setFieldErrors({ ...fieldErrors, subtitle: "" });
                  }}
                  className={getFieldClass(Boolean(fieldErrors.subtitle))}
                  placeholder="e.g. Complete authentic puja kits blessed with holy Gangajal..."
                />
                {fieldErrors.subtitle && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600">{fieldErrors.subtitle}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5C0F17]">
                    CTA Button Label
                  </label>
                  <input
                    maxLength={30}
                    disabled={saving}
                    value={form.ctaText}
                    onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                    className={fieldClass}
                    placeholder="Explore Collection"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5C0F17]">
                    Target Link URL
                  </label>
                  <input
                    maxLength={250}
                    disabled={saving}
                    value={form.link}
                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                    className={fieldClass}
                    placeholder="/category/puja-packages"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#5C0F17]">
                  Banner Image File *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  disabled={saving || uploading}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageSelect}
                  className="mt-1.5 block w-full text-xs text-[#2D1C13] file:mr-3 file:rounded-xl file:border-0 file:bg-[#5C0F17] file:px-4 file:py-2.5 file:text-xs file:font-bold file:text-white hover:file:bg-[#4A0D15] disabled:opacity-50"
                />
                {uploading && (
                  <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#5C0F17]">
                    <RefreshCw size={13} className="animate-spin text-[#DA9B26]" />
                    <span>Uploading banner image to persistent storage...</span>
                  </div>
                )}
                {fieldErrors.imageUrl && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600">{fieldErrors.imageUrl}</p>
                )}
                {form.imageUrl && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-[#EEDBC5]">
                    <img
                      src={resolveImageUrl(form.imageUrl)}
                      alt="Banner preview"
                      className="aspect-[16/9] w-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="active-toggle"
                  disabled={saving}
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="h-4 w-4 rounded accent-[#5C0F17]"
                />
                <label htmlFor="active-toggle" className="text-xs font-bold text-[#5C0F17] cursor-pointer">
                  Active (Display on customer storefront carousel)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#EEDBC5]">
                <button
                  type="button"
                  disabled={saving || uploading}
                  onClick={() => setFormOpen(false)}
                  className="rounded-xl border border-[#EEDBC5] px-5 py-2.5 text-xs font-bold text-[#2D1C13] hover:bg-[#FAF5ED] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#5C0F17] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-[#5C0F17]/20 transition hover:bg-[#4A0D15] disabled:opacity-50"
                >
                  {saving && <RefreshCw size={14} className="animate-spin" />}
                  <span>{saving ? (editingId ? "Updating Banner..." : "Creating Banner...") : editingId ? "Update Banner" : "Create Banner"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
