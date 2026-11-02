import { useEffect, useState } from "react";
import { productService } from "../services/productService";
import {
  TicketPercent,
  Plus,
  Search,
  Pencil,
  Trash2,
  RotateCcw,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  Eye,
  RefreshCw,
  Power,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { couponService } from "../services/couponService";

const inputClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#5C0F17] focus:ring-2 focus:ring-[#5C0F17]/10";
export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [discountTypeFilter, setDiscountTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewTab, setViewTab] = useState("active"); // "active" | "trash"
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({
    code: "",
    description: "",
    discountType: "fixed",
    discountValue: "",
    maxDiscount: "",
    minCartValue: "",
    startDate: "",
    expiryDate: "",
    totalUsageLimit: "",
    perUserLimit: "1",
    isActive: true,
    productScope: "all",
    applicableProducts: [],
  });
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productLoadError, setProductLoadError] = useState("");
  const [productSearch, setProductSearch] = useState("");

  // Usages Modal State
  const [usageModalOpen, setUsageModalOpen] = useState(false);
  const [activeCouponForUsage, setActiveCouponForUsage] = useState(null);
  const [usages, setUsages] = useState([]);
  const [usageStats, setUsageStats] = useState({ total: 0, totalDiscount: 0 });
  const [usageLoading, setUsageLoading] = useState(false);
  const [usagePage, setUsagePage] = useState(1);
  const [usageTotalPages, setUsageTotalPages] = useState(1);

  const loadCoupons = async (tab = viewTab) => {
    try {
      setLoading(true);
      setError("");
      const isDeletedQuery = tab === "trash" ? "true" : "false";
      const res = await couponService.getCoupons({
        search,
        discountType: discountTypeFilter,
        isActive: statusFilter,
        isDeleted: isDeletedQuery,
        page,
        limit: 15,
      });

      if (res.success && res.data) {
        setCoupons(res.data.coupons || []);
        setTotalPages(res.data.pages || 1);
        setTotalCount(res.data.total || 0);
      }
    } catch (err) {
      console.error("Load coupons error:", err);
      setError(err.message || "Failed to load coupons.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons(viewTab);
  }, [discountTypeFilter, statusFilter, page, viewTab]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setProductsLoading(true);
        setProductLoadError("");

        const data = await productService.getAll();
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load products:", error);
        setProductLoadError("Unable to load products. Please try again.");
      } finally {
        setProductsLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadCoupons();
  };

  const openCreateModal = () => {

    setEditingCoupon(null);
    setProductSearch("");
    setForm({
      code: "",
      description: "",
      discountType: "fixed",
      discountValue: "",
      maxDiscount: "",
      minCartValue: "",
      startDate: "",
      expiryDate: "",
      totalUsageLimit: "",
      perUserLimit: "1",
      isActive: true,
      productScope: "all",
      applicableProducts: [],
    });
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setProductSearch("");
    setForm({
      code: coupon.code,
      description: coupon.description || "",
      discountType: coupon.discountType || "fixed",
      discountValue: String(coupon.discountValue || ""),
      maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : "",
      minCartValue: coupon.minCartValue ? String(coupon.minCartValue) : "",
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split("T")[0] : "",
      expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split("T")[0] : "",
      totalUsageLimit: coupon.totalUsageLimit ? String(coupon.totalUsageLimit) : "",
      perUserLimit: coupon.perUserLimit ? String(coupon.perUserLimit) : "1",
      isActive: coupon.isActive !== false,
      productScope: coupon.applicableProducts?.length ? "selected" : "all",
      applicableProducts: (coupon.applicableProducts || []).map((id) =>
        String(id?._id || id)
      ),
    });
    setError("");
    setModalOpen(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.code.trim()) {
      setError("Coupon code is required.");
      return;
    }

    const val = Number(form.discountValue);
    if (!Number.isFinite(val) || val <= 0) {
      setError("Discount value must be a positive number.");
      return;
    }

    if (form.discountType === "percentage" && val > 100) {
      setError("Percentage discount cannot exceed 100%.");
      return;
    }

    if (
      form.productScope === "selected" &&
      form.applicableProducts.length === 0
    ) {
      setError("Please select at least one product or choose All Products.");
      return;
    }
    try {

      setSaving(true);
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        discountType: form.discountType,
        discountValue: val,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        minCartValue: form.minCartValue ? Number(form.minCartValue) : 0,
        startDate: form.startDate ? new Date(form.startDate) : null,
        expiryDate: form.expiryDate ? new Date(form.expiryDate) : null,
        totalUsageLimit: form.totalUsageLimit ? Number(form.totalUsageLimit) : null,
        perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : 1,
        isActive: form.isActive,
        applicableProducts:
          form.productScope === "selected"
            ? form.applicableProducts
            : [],
      };

      if (editingCoupon) {
        await couponService.updateCoupon(editingCoupon._id, payload);
        setNotice(`Coupon '${payload.code}' updated successfully.`);
      } else {
        await couponService.createCoupon(payload);
        setNotice(`Coupon '${payload.code}' created successfully.`);
      }

      setModalOpen(false);
      await loadCoupons();
    } catch (err) {
      setError(err.message || "Failed to save coupon.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (coupon) => {
    try {
      await couponService.toggleStatus(coupon._id);
      setNotice(`Coupon '${coupon.code}' status toggled.`);
      await loadCoupons();
    } catch (err) {
      alert("Failed to toggle coupon status: " + err.message);
    }
  };

  const handleDeleteCoupon = async (coupon) => {
    if (!window.confirm(`Move coupon '${coupon.code}' to trash? (You can restore it anytime from the Trash tab)`)) {
      return;
    }

    try {
      const res = await couponService.deleteCoupon(coupon._id);
      setNotice(typeof res === "string" ? res : `Coupon '${coupon.code}' moved to trash successfully.`);
      await loadCoupons();
    } catch (err) {
      alert("Failed to move coupon to trash: " + err.message);
    }
  };

  const handleRestoreCoupon = async (coupon) => {
    try {
      await couponService.restoreCoupon(coupon._id);
      setNotice(`Coupon '${coupon.code}' restored successfully.`);
      await loadCoupons();
    } catch (err) {
      alert("Failed to restore coupon: " + err.message);
    }
  };

  const openUsagesModal = async (coupon, pageNum = 1) => {
    setActiveCouponForUsage(coupon);
    setUsagePage(pageNum);
    setUsageModalOpen(true);
    setUsageLoading(true);

    try {
      const res = await couponService.getCouponUsages(coupon._id, { page: pageNum, limit: 10 });
      if (res.success && res.data) {
        setUsages(res.data.usages || []);
        setUsageStats({
          total: res.data.total || 0,
          totalDiscount: res.data.totalDiscount || 0,
        });
        setUsageTotalPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error("Failed to load usages:", err);
    } finally {
      setUsageLoading(false);
    }
  };

  const totalActiveCoupons = coupons.filter((c) => c.isActive).length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);
  const filteredProducts = products.filter((product) =>
    String(product.name || product.title || "")
      .toLowerCase()
      .includes(productSearch.trim().toLowerCase())
  );
  const selectedProductDetails = form.applicableProducts.map((productId) =>
    products.find((product) => String(product._id) === String(productId)) || {
      _id: productId,
      name: "Product",
    }
  );

  const toggleApplicableProduct = (productId) => {
    const id = String(productId);
    setForm((current) => ({
      ...current,
      applicableProducts: current.applicableProducts.includes(id)
        ? current.applicableProducts.filter((selectedId) => selectedId !== id)
        : [...current.applicableProducts, id],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900">Coupons</h1>
          <p className="mt-1 text-xs text-neutral-500">
            Create, configure and monitor promotional discounts and usage ({totalCount} total)
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#5C0F17] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#4A0D15]"
        >
          <Plus size={16} />
          Create New Coupon
        </button>
      </div>

      {/* Notices */}
      {notice && (
        <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            {notice}
          </div>
          <button onClick={() => setNotice("")}>
            <X size={15} />
          </button>
        </div>
      )}

      {error && !modalOpen && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-xs font-semibold text-red-600">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Total Coupons</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-neutral-900">{totalCount}</span>
            <TicketPercent className="text-neutral-300" size={24} />
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Active Coupons</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-600">{totalActiveCoupons}</span>
            <CheckCircle2 className="text-emerald-400" size={24} />
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Total Redemptions</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-[#5C0F17]">{totalRedemptions}</span>
            <Users className="text-[#5C0F17]/50" size={24} />
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Promotions</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-sm font-bold text-neutral-600">Fixed & Percentage</span>
            <TrendingUp className="text-neutral-400" size={24} />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-sm space-y-4">
        {/* Active vs Trash tabs */}
        <div className="flex rounded-xl bg-[#FAF5ED] p-1 border border-[#EEDBC5] w-fit">
          <button
            type="button"
            onClick={() => setViewTab("active")}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
              viewTab === "active"
                ? "bg-[#5C0F17] text-white shadow-xs"
                : "text-[#2D1C13]/70 hover:text-[#5C0F17]"
            }`}
          >
            Active Coupons
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input
              type="text"
              maxLength={100}
              placeholder="Search coupon code or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-xs outline-none focus:border-[#5C0F17] focus:bg-white"
            />
          </form>

          <div>
            <select
              value={discountTypeFilter}
              onChange={(e) => {
                setDiscountTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs font-medium outline-none focus:border-[#5C0F17] focus:bg-white"
            >
              <option value="all">All Discount Types</option>
              <option value="fixed">Fixed Amount</option>
              <option value="percentage">Percentage</option>
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
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200/80 bg-neutral-50/75 text-neutral-500 font-bold">
                <th className="py-3.5 px-4">Coupon Code</th>
                <th className="py-3.5 px-4">Type & Value</th>
                <th className="py-3.5 px-4">Min. Cart</th>
                <th className="py-3.5 px-4">Redemptions</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-neutral-400">
                    <RefreshCw className="mx-auto h-5 w-5 animate-spin mb-2" />
                    Loading coupons...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-neutral-400">
                    No coupons found matching your search.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => {
                  const isExpired = c.expiryDate && new Date(c.expiryDate) < new Date();
                  return (
                    <tr key={c._id} className="hover:bg-neutral-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-neutral-900 bg-rose-50 text-[#5C0F17] px-2.5 py-1 rounded-lg border border-rose-100">
                            {c.code}
                          </span>
                        </div>
                        {c.description && (
                          <p className="mt-1 text-[11px] text-neutral-400 max-w-xs truncate">
                            {c.description}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-neutral-800">
                          {c.discountType === "fixed" ? `₹${c.discountValue} OFF` : `${c.discountValue}% OFF`}
                        </span>
                        {c.discountType === "percentage" && c.maxDiscount && (
                          <span className="block text-[10px] text-neutral-400">
                            Cap: ₹{c.maxDiscount}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-neutral-600">
                        {c.minCartValue ? `₹${c.minCartValue.toLocaleString("en-IN")}` : "None"}
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => openUsagesModal(c)}
                          className="group inline-flex items-center gap-1.5 font-bold text-neutral-800 hover:text-[#5C0F17]"
                          title="Click to inspect which users redeemed this coupon"
                        >
                          <span>{c.usedCount || 0}</span>
                          <span className="text-neutral-400">
                            / {c.totalUsageLimit ? c.totalUsageLimit : "∞"}
                          </span>
                          <Eye size={13} className="text-neutral-400 group-hover:text-[#5C0F17]" />
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-neutral-500">
                        {c.expiryDate ? (
                          <span className={isExpired ? "text-red-500 font-bold" : ""}>
                            {new Date(c.expiryDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                            {isExpired && " (Expired)"}
                          </span>
                        ) : (
                          <span className="text-neutral-400">No Expiry</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition ${c.isActive
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                            }`}
                        >
                          <Power size={10} />
                          {c.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {viewTab === "trash" ? (
                            <button
                              onClick={() => handleRestoreCoupon(c)}
                              title="Restore Coupon"
                              className="flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            >
                              <RotateCcw size={13} /> Restore
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => openUsagesModal(c)}
                                title="View Redemptions"
                                className="rounded-xl p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                              >
                                <Users size={15} />
                              </button>
                              <button
                                onClick={() => openEditModal(c)}
                                title="Edit Coupon"
                                className="rounded-xl p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteCoupon(c)}
                                title="Move to trash"
                                className="rounded-xl p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-100 p-4 text-xs text-neutral-500">
            <span>
              Page {page} of {totalPages} ({totalCount} coupons)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl border border-neutral-200 p-1.5 hover:bg-neutral-50 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-xl border border-neutral-200 p-1.5 hover:bg-neutral-50 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-black text-neutral-900">
              {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : "Create New Coupon"}
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              Configure discount rates, usage caps, and validity criteria.
            </p>

            {error && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveCoupon} className="mt-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-neutral-700">Coupon Code *</label>
                <input
                  required
                  maxLength={30}
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. PUJA100, DIWALI20"
                  className={`${inputClass} font-mono font-bold uppercase mt-1`}
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700">Description</label>
                <input
                  maxLength={150}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. ₹500 off on premium wireless accessories"
                  className={`${inputClass} mt-1`}
                />
              </div>
              <div>
                <label className="font-bold text-neutral-700">
                  Apply Coupon To *
                </label>

                <select
                  value={form.productScope}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      productScope: e.target.value,
                      applicableProducts:
                        e.target.value === "all" ? [] : form.applicableProducts,
                    })
                  }
                  className={`${inputClass} mt-1`}
                >
                  <option value="all">All Products</option>
                  <option value="selected">Selected Products Only</option>
                </select>

                {form.productScope === "selected" && (
                  <div className="mt-3">
                    <label className="font-bold text-neutral-700">
                      Select Products *
                    </label>

                    {productsLoading ? (
                      <p className="mt-2 text-neutral-400">Loading products...</p>
                    ) : productLoadError ? (
                      <p className="mt-2 text-red-500">{productLoadError}</p>
                    ) : products.length === 0 ? (
                      <p className="mt-2 text-neutral-400">
                        No products available.
                      </p>
                    ) : (
                      <div className="mt-2 overflow-hidden rounded-xl border border-neutral-200 bg-white">
                        <div className="border-b border-neutral-100 p-3">
                          <div className="relative">
                            <Search
                              size={16}
                              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                            />
                            <input
                              type="search"
                              maxLength={100}
                              value={productSearch}
                              onChange={(e) => setProductSearch(e.target.value)}
                              placeholder="Search products by name..."
                              className="w-full rounded-lg border border-neutral-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#5C0F17] focus:ring-2 focus:ring-[#5C0F17]/10"
                            />
                          </div>

                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-neutral-600">
                              {form.applicableProducts.length} of {products.length} selected
                            </span>
                            <div className="flex items-center gap-3 text-xs font-semibold">
                              <button
                                type="button"
                                onClick={() =>
                                  setForm((current) => ({
                                    ...current,
                                    applicableProducts: Array.from(
                                      new Set([
                                        ...current.applicableProducts,
                                        ...filteredProducts.map((product) => String(product._id)),
                                      ])
                                    ),
                                  }))
                                }
                                disabled={filteredProducts.length === 0}
                                className="text-[#5C0F17] hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Select visible
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setForm((current) => ({ ...current, applicableProducts: [] }))
                                }
                                disabled={form.applicableProducts.length === 0}
                                className="text-neutral-500 hover:text-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Clear all
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="max-h-52 overflow-y-auto p-2">
                          {filteredProducts.length === 0 ? (
                            <p className="px-2 py-5 text-center text-xs text-neutral-400">
                              No products match your search.
                            </p>
                          ) : (
                            <div className="space-y-1">
                              {filteredProducts.map((product) => {
                                const productId = String(product._id);
                                const isSelected = form.applicableProducts.includes(productId);

                                return (
                                  <label
                                    key={product._id}
                                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition ${
                                      isSelected
                                        ? "bg-[#5C0F17]/[0.07]"
                                        : "hover:bg-neutral-50"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleApplicableProduct(productId)}
                                      className="h-4 w-4 cursor-pointer accent-[#5C0F17]"
                                    />
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate text-sm font-semibold text-neutral-800">
                                        {product.name || product.title || "Unnamed product"}
                                      </span>
                                      <span className="mt-0.5 block text-xs text-neutral-500">
                                        ₹{Number(product.price || 0).toLocaleString("en-IN")}
                                      </span>
                                    </span>
                                    {isSelected && (
                                      <CheckCircle2 size={16} className="shrink-0 text-[#5C0F17]" />
                                    )}
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {selectedProductDetails.length > 0 && (
                          <div className="border-t border-neutral-100 bg-neutral-50/70 p-3">
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                              Selected products
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {selectedProductDetails.map((product) => (
                                <span
                                  key={product._id}
                                  className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#5C0F17]/20 bg-white py-1 pl-3 pr-1.5 text-xs font-medium text-neutral-700"
                                >
                                  <span className="max-w-48 truncate">
                                    {product.name || product.title || "Product"}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => toggleApplicableProduct(product._id)}
                                    aria-label={`Remove ${product.name || "product"}`}
                                    className="rounded-full p-0.5 text-neutral-400 hover:bg-red-50 hover:text-red-500"
                                  >
                                    <X size={13} />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-700">Discount Type *</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className={`${inputClass} mt-1`}
                  >
                    <option value="fixed">Fixed Amount (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-neutral-700">
                    Discount Value * {form.discountType === "fixed" ? "(₹)" : "(%)"}
                  </label>
                  <input
                    required
                    type="number"
                    step="any"
                    min="1"
                    max={form.discountType === "percentage" ? "100" : undefined}
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    placeholder={form.discountType === "fixed" ? "500" : "20"}
                    className={`${inputClass} mt-1`}
                  />
                </div>
              </div>

              {form.discountType === "percentage" && (
                <div>
                  <label className="font-bold text-neutral-700">
                    Max Discount Cap (₹) <span className="text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    value={form.maxDiscount}
                    onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                    placeholder="e.g. 1000 (leaves no cap if empty)"
                    className={`${inputClass} mt-1`}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-700">Minimum Cart Subtotal (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.minCartValue}
                    onChange={(e) => setForm({ ...form, minCartValue: e.target.value })}
                    placeholder="0"
                    className={`${inputClass} mt-1`}
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700">Per-User Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={form.perUserLimit}
                    onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}
                    placeholder="1"
                    className={`${inputClass} mt-1`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-700">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className={`${inputClass} mt-1`}
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700">Expiry Date</label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    className={`${inputClass} mt-1`}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-700">Total Usage Limit</label>
                <input
                  type="number"
                  min="1"
                  value={form.totalUsageLimit}
                  onChange={(e) => setForm({ ...form, totalUsageLimit: e.target.value })}
                  placeholder="e.g. 500 (Leave empty for unlimited)"
                  className={`${inputClass} mt-1`}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-neutral-300 text-[#5C0F17] focus:ring-[#5C0F17]"
                />
                <label htmlFor="isActiveToggle" className="font-bold text-neutral-800">
                  Coupon is active and available for customer redemption
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-neutral-200 px-4 py-2.5 font-bold text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#5C0F17] px-5 py-2.5 font-bold text-white transition hover:bg-[#4A0D15] disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingCoupon ? "Save Changes" : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Usages / Redemptions Modal */}
      {usageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <button
              onClick={() => setUsageModalOpen(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-sm bg-rose-50 text-[#5C0F17] px-2.5 py-1 rounded-lg border border-rose-100">
                {activeCouponForUsage?.code}
              </span>
              <h2 className="text-lg font-black text-neutral-900">Redemption History</h2>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Users and orders that successfully redeemed this coupon ({usageStats.total} redemptions, ₹
              {usageStats.totalDiscount.toLocaleString("en-IN")} total discount given)
            </p>

            <div className="mt-5 overflow-hidden rounded-2xl border border-neutral-200 text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-500 font-bold border-b border-neutral-200">
                    <th className="p-3">User</th>
                    <th className="p-3">Order #</th>
                    <th className="p-3">Discount</th>
                    <th className="p-3">Order Total</th>
                    <th className="p-3">Redeemed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {usageLoading ? (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-neutral-400">
                        <RefreshCw className="mx-auto h-4 w-4 animate-spin mb-1" />
                        Loading redemptions...
                      </td>
                    </tr>
                  ) : usages.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-neutral-400">
                        No customer redemptions recorded for this coupon yet.
                      </td>
                    </tr>
                  ) : (
                    usages.map((u) => (
                      <tr key={u._id} className="hover:bg-neutral-50/50">
                        <td className="p-3">
                          <p className="font-bold text-neutral-900">{u.user?.name || "Guest"}</p>
                          <p className="text-[11px] text-neutral-400">{u.user?.email || "—"}</p>
                        </td>
                        <td className="p-3 font-mono font-semibold text-neutral-700">
                          {u.order?.orderNumber || "—"}
                        </td>
                        <td className="p-3 font-bold text-emerald-600">
                          ₹{Number(u.discountAmount).toLocaleString("en-IN")}
                        </td>
                        <td className="p-3 font-semibold text-neutral-800">
                          ₹{Number(u.orderTotal).toLocaleString("en-IN")}
                        </td>
                        <td className="p-3 text-neutral-500">
                          {new Date(u.usedAt || u.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {usageTotalPages > 1 && (
              <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                <span>
                  Page {usagePage} of {usageTotalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={usagePage <= 1}
                    onClick={() => openUsagesModal(activeCouponForUsage, usagePage - 1)}
                    className="rounded-lg border border-neutral-200 px-2 py-1 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <button
                    disabled={usagePage >= usageTotalPages}
                    onClick={() => openUsagesModal(activeCouponForUsage, usagePage + 1)}
                    className="rounded-lg border border-neutral-200 px-2 py-1 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

