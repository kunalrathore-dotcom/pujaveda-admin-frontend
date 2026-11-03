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
      const data = await bannerService.getAll({ isDeleted: "false" });
      setBanners(data);
    } catch (err) {
      setError(err.message || "Failed to load banners.");
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
      setError("Choose a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be 5MB or smaller.");
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
      setError(err.message || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const save = async (event) => {
    event.preventDefault();
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
      await load();
    } catch (err) {
      setError(err.message || "Unable to save banner.");
    } finally {
      setSaving(false);
    }
  };

  const removeBanner = async (id) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) return;
    setError("");
    setNotice("");

    try {
      await bannerService.remove(id);
      setNotice("Banner deleted successfully.");
      await load();
    } catch (err) {
      setError(err.message || "Unable to delete banner.");
    }
  };

  const handleBulkDelete = async (idsToDelete) => {
    if (!idsToDelete || idsToDelete.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${idsToDelete.length} banner(s)?`)) return;

    try {
      setSaving(true);
      await bannerService.bulkTrash(idsToDelete);
      setNotice(`${idsToDelete.length} banner(s) deleted successfully.`);
      setSelectedIds([]);
      setTimeout(() => setNotice(""), 3500);
      await load();
    } catch (err) {
      console.error("Bulk delete error:", err);
      setError(err.message || "Failed to delete selected banners.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (banner) => {
    const bannerId = banner._id || banner.id;
    try {
      await bannerService.update(bannerId, {
        active: !banner.active,
      });
      await load();
    } catch (err) {
      setError(err.message || "Unable to toggle banner status.");
    }
  };

  return (
    <div className="min-h-screen">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#5C0F17] sm:text-3xl">
            Banners
          </h1>
          <p className="mt-1 text-sm text-[#2D1C13]/70">
            Manage alternating carousel slides for the customer storefront ({banners.length}/{MAX_BANNERS} used)
          </p>
        </div>

        <button
          type="button"
          disabled={banners.length >= MAX_BANNERS}
          onClick={() => openForm()}
          className="flex items-center gap-2 rounded-xl bg-[#5C0F17] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#5C0F17]/20 transition hover:bg-[#4A0D15] disabled:opacity-50"
        >
          <Plus size={18} /> Add Banner Slide
        </button>
      </div>

      {notice && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
          {notice}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* Bulk Action Controls */}
      {banners.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EEDBC5] bg-[#FAF5ED] px-4 py-3">
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
              {selectedIds.length > 0 ? `(${selectedIds.length} of ${banners.length} selected)` : ''}
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

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {banners.map((banner) => {
          const bId = banner._id || banner.id;
          return (
          <article
            key={bId}
            className="group relative overflow-hidden rounded-2xl border border-[#EEDBC5] bg-[#FFFDF9] shadow-xs flex flex-col justify-between"
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
                  onClick={() => toggleActive(banner)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#2D1C13] hover:text-[#5C0F17]"
                >
                  {banner.active ? (
                    <ToggleRight size={20} className="text-[#5C0F17]" />
                  ) : (
                    <ToggleLeft size={20} className="text-neutral-400" />
                  )}
                  {banner.active ? "Active" : "Hidden"}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openForm(banner)}
                    aria-label="Edit banner"
                    className="rounded-lg p-2 text-[#2D1C13]/70 hover:bg-[#FAF5ED] hover:text-[#5C0F17]"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBanner(banner._id || banner.id)}
                    aria-label="Delete banner"
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700"
                    title="Delete banner"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </article>
        );})}

        {banners.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-[#EEDBC5] bg-[#FFF8EE] p-12 text-center">
            <ImageIcon size={40} className="mx-auto text-[#DA9B26]/50" />
            <h3 className="mt-3 font-serif text-base font-bold text-[#5C0F17]">
              No Promotional Banners Found
            </h3>
            <p className="mt-1 text-xs text-[#2D1C13]/60">
              Add up to {MAX_BANNERS} banners for the alternating carousel.
            </p>
          </div>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#EEDBC5] bg-[#FFFDF9] p-6 sm:p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-neutral-400 hover:bg-neutral-100"
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
                    Description / Subtitle
                  </label>
                  <span className="text-[10px] text-[#2D1C13]/50">
                    {form.subtitle.length}/160
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={160}
                  required
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
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageSelect}
                  className="mt-1.5 block w-full text-xs text-[#2D1C13] file:mr-3 file:rounded-xl file:border-0 file:bg-[#5C0F17] file:px-4 file:py-2.5 file:text-xs file:font-bold file:text-white hover:file:bg-[#4A0D15]"
                />
                {uploading && (
                  <p className="mt-2 text-xs font-semibold text-[#5C0F17]">
                    Uploading image to persistent storage...
                  </p>
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
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="h-4 w-4 rounded accent-[#5C0F17]"
                />
                <label htmlFor="active-toggle" className="text-xs font-bold text-[#5C0F17]">
                  Active (Display on customer storefront carousel)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#EEDBC5]">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-xl border border-[#EEDBC5] px-5 py-2.5 text-xs font-bold text-[#2D1C13] hover:bg-[#FAF5ED]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="rounded-xl bg-[#5C0F17] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-[#5C0F17]/20 transition hover:bg-[#4A0D15] disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingId ? "Update Banner" : "Create Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
