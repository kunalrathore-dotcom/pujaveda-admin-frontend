import { useEffect, useState } from "react";
import {
  Receipt,
  Percent,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Power,
  Calculator,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { pricingService } from "../services/pricingService";

const inputClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#5C0F17] focus:ring-2 focus:ring-[#5C0F17]/10";

export default function TaxSettingsPage() {
  const [charges, setCharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [viewTab, setViewTab] = useState("active"); // "active" | "trash"

  // Edit / Create Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    key: "",
    name: "",
    type: "percentage",
    value: 18,
    calculationBasis: "discounted_subtotal",
    description: "",
    isActive: true,
  });

  // Interactive Live Calculator State
  const [calcSubtotal, setCalcSubtotal] = useState(2500);
  const [calcCouponDiscount, setCalcCouponDiscount] = useState(250);

  const parseCharges = (res) => {
    if (Array.isArray(res?.charges)) return res.charges;
    if (Array.isArray(res?.data?.charges)) return res.data.charges;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  const loadCharges = async (tab = viewTab) => {
    try {
      setLoading(true);
      setError("");
      const isDeletedQuery = tab === "trash" ? "true" : "false";
      const res = await pricingService.getAllCharges({ isDeleted: isDeletedQuery });
      if (res.success) {
        setCharges(parseCharges(res));
      } else {
        setCharges([]);
        setError(res.message || "Failed to load pricing charges.");
      }
    } catch (err) {
      console.error("Load charges error:", err);
      setCharges([]);
      setError(err.message || "Failed to load pricing charges.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCharges(viewTab);
  }, [viewTab]);

  const openCreateModal = () => {
    setEditingCharge(null);
    setForm({
      key: "",
      name: "",
      type: "percentage",
      value: 0,
      calculationBasis: "discounted_subtotal",
      description: "",
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (charge) => {
    setEditingCharge(charge);
    setForm({
      key: charge.key || "",
      name: charge.name || "",
      type: charge.type || "percentage",
      value: charge.value ?? 0,
      calculationBasis: charge.calculationBasis || "discounted_subtotal",
      description: charge.description || "",
      isActive: charge.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleToggleStatus = async (charge) => {
    try {
      setError("");
      const res = await pricingService.toggleChargeStatus(charge._id);
      if (res.success) {
        setNotice(`'${charge.name}' status updated.`);
        setTimeout(() => setNotice(""), 3500);
        loadCharges();
      }
    } catch (err) {
      setError(err.message || "Failed to update status.");
    }
  };

  const handleDelete = async (charge) => {
    if (["gst", "platform_fee"].includes(charge.key)) {
      alert("System charges like GST and Platform Fee cannot be moved to trash. You can deactivate them instead.");
      return;
    }
    if (!window.confirm(`Move '${charge.name}' to trash? (You can restore it anytime from the Trash tab)`)) {
      return;
    }

    try {
      setError("");
      const res = await pricingService.deleteCharge(charge._id);
      if (res.success) {
        setNotice(`'${charge.name}' moved to trash.`);
        setTimeout(() => setNotice(""), 3500);
        loadCharges();
      }
    } catch (err) {
      setError(err.message || "Failed to move charge to trash.");
    }
  };

  const handleRestore = async (charge) => {
    try {
      setError("");
      const res = await pricingService.restoreCharge(charge._id);
      if (res.success) {
        setNotice(`'${charge.name}' restored successfully.`);
        setTimeout(() => setNotice(""), 3500);
        loadCharges();
      }
    } catch (err) {
      setError(err.message || "Failed to restore charge.");
    }
  };

  const handleSaveCharge = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Charge name is required.");
      return;
    }
    if (form.name.trim().length < 2 || form.name.trim().length > 60) {
      setError("Charge name must be between 2 and 60 characters.");
      return;
    }
    if (!editingCharge && !form.key.trim()) {
      setError("Unique identifier key is required.");
      return;
    }
    if (!editingCharge && (form.key.trim().length < 2 || form.key.trim().length > 40)) {
      setError("Charge key must be between 2 and 40 characters.");
      return;
    }
    if (form.description && form.description.length > 200) {
      setError("Description cannot exceed 200 characters.");
      return;
    }
    if (form.value === "" || isNaN(form.value) || Number(form.value) < 0) {
      setError("Please enter a valid non-negative value.");
      return;
    }
    if (form.type === "percentage" && Number(form.value) > 100) {
      setError("Percentage charge cannot exceed 100%.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        type: form.type,
        value: Number(form.value),
        calculationBasis: form.type === "fixed" ? "fixed" : form.calculationBasis,
        description: form.description.trim(),
        isActive: Boolean(form.isActive),
      };

      if (!editingCharge) {
        payload.key = form.key.trim().toLowerCase().replace(/\s+/g, "_");
        await pricingService.createCharge(payload);
        setNotice("New fee/tax charge added successfully.");
      } else {
        await pricingService.updateCharge(editingCharge._id, payload);
        setNotice(`'${form.name}' updated successfully.`);
      }

      setModalOpen(false);
      setTimeout(() => setNotice(""), 3500);
      loadCharges();
    } catch (err) {
      setError(err.message || "Failed to save pricing charge.");
    } finally {
      setSaving(false);
    }
  };

  // Calculator computations
  const subtotal = Math.max(0, Number(calcSubtotal) || 0);
  const couponDiscount = Math.min(subtotal, Math.max(0, Number(calcCouponDiscount) || 0));
  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);

  const calculatedCharges = charges.map((ch) => {
    let amount = 0;
    if (ch.isActive) {
      if (ch.type === "fixed") {
        amount = Number(ch.value) || 0;
      } else {
        const basis = ch.calculationBasis === "subtotal" ? subtotal : discountedSubtotal;
        amount = Math.round(((basis * (Number(ch.value) || 0)) / 100) * 100) / 100;
      }
    }
    return {
      ...ch,
      amount,
    };
  });

  const totalCharges = calculatedCharges.reduce((acc, c) => acc + (c.isActive ? c.amount : 0), 0);
  const finalPayable = Math.round((discountedSubtotal + totalCharges) * 100) / 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-neutral-900">
              Tax & Fees
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              <ShieldCheck size={13} /> Active Engine
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Configure centralized GST, platform fees, and other checkout surcharges. All calculations are strictly backend-authoritative.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadCharges}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-[#5C0F17] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4A0D15]"
          >
            <Plus size={16} />
            Add Surcharge
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle size={16} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Configuration Cards & Live Calculator Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Side: Configured Charges List */}
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  Configured Surcharges & Rates
                </h2>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Changes take effect immediately on next checkout quote and order creation.
                </p>
              </div>

              {/* Active vs Trash tabs */}
              <div className="flex rounded-xl bg-[#FAF5ED] p-1 border border-[#EEDBC5]">
                <button
                  type="button"
                  onClick={() => setViewTab("active")}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                    viewTab === "active"
                      ? "bg-[#5C0F17] text-white shadow-xs"
                      : "text-[#2D1C13]/70 hover:text-[#5C0F17]"
                  }`}
                >
                  Active Surcharges
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab("trash")}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition flex items-center gap-1.5 ${
                    viewTab === "trash"
                      ? "bg-red-700 text-white shadow-xs"
                      : "text-[#2D1C13]/70 hover:text-red-700"
                  }`}
                >
                  <Trash2 size={12} /> Trash
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-sm text-neutral-400">
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin text-[#5C0F17]" />
                  Loading pricing charges...
                </div>
              ) : charges.length === 0 ? (
                <p className="py-8 text-center text-sm text-neutral-500">
                  No pricing charges configured. Default charges will be seeded automatically.
                </p>
              ) : (
                charges.map((charge) => {
                  const isGst = charge.key === "gst";
                  const isPlatform = charge.key === "platform_fee";

                  return (
                    <div
                      key={charge._id || charge.key}
                      className={`relative flex flex-col justify-between rounded-xl border p-4 sm:flex-row sm:items-center ${
                        charge.isActive
                          ? "border-neutral-200 bg-neutral-50/50"
                          : "border-neutral-200/60 bg-neutral-100/50 opacity-60"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
                              isGst
                                ? "bg-amber-100 text-amber-700"
                                : isPlatform
                                ? "bg-blue-100 text-blue-700"
                                : "bg-neutral-200 text-neutral-700"
                            }`}
                          >
                            {charge.type === "percentage" ? "%" : "₹"}
                          </span>
                          <div>
                            <span className="font-bold text-neutral-900">{charge.name}</span>
                            <span className="ml-2 font-mono text-xs text-neutral-400">
                              ({charge.key})
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-neutral-500">
                          {charge.description || "No description provided."}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                          <span className="rounded-md bg-neutral-200/80 px-2 py-0.5 font-semibold text-neutral-800">
                            Rate:{" "}
                            {charge.type === "percentage"
                              ? `${charge.value}%`
                              : `₹${Number(charge.value).toFixed(2)}`}
                          </span>
                          {charge.type === "percentage" && (
                            <span className="rounded-md bg-neutral-200/60 px-2 py-0.5 text-neutral-600">
                              Basis:{" "}
                              {charge.calculationBasis === "subtotal"
                                ? "Subtotal (before coupon)"
                                : "Discounted Subtotal"}
                            </span>
                          )}
                          <span
                            className={`rounded-md px-2 py-0.5 font-medium ${
                              charge.isActive
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {charge.isActive ? "Active in Checkout" : "Disabled"}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-3 flex items-center gap-2 border-t border-neutral-200 pt-3 sm:mt-0 sm:border-t-0 sm:pt-0">
                        {viewTab === "trash" ? (
                          <button
                            type="button"
                            onClick={() => handleRestore(charge)}
                            className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            title="Restore Surcharge"
                          >
                            <RotateCcw size={13} /> Restore
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(charge)}
                              title={charge.isActive ? "Deactivate charge" : "Activate charge"}
                              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                                charge.isActive
                                  ? "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                                  : "bg-emerald-600 text-white hover:bg-emerald-700"
                              }`}
                            >
                              <Power size={13} />
                              {charge.isActive ? "Disable" : "Enable"}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(charge)}
                              className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                            >
                              <Pencil size={13} />
                              Edit
                            </button>
                            {!isGst && !isPlatform && (
                              <button
                                type="button"
                                onClick={() => handleDelete(charge)}
                                className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                                title="Move to trash"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Business Rules Explanation Card */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-bold text-neutral-900">
              <HelpCircle size={16} className="text-[#5C0F17]" />
              Calculation Sequence Invariant
            </h3>
            <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-xs text-neutral-600">
              <li>
                <strong>Product Subtotal:</strong> Verified directly against the database unit price & quantities.
              </li>
              <li>
                <strong>Coupon Discount:</strong> Evaluated strictly on the eligible subtotal (capped if max cap exists).
              </li>
              <li>
                <strong>Discounted Subtotal:</strong> Calculated as <code className="rounded bg-neutral-100 px-1 py-0.5">Subtotal - Coupon Discount</code>.
              </li>
              <li>
                <strong>GST:</strong> Computed as a percentage on the discounted subtotal (or raw subtotal if configured).
              </li>
              <li>
                <strong>Platform Fee:</strong> Added as flat ₹ or percentage to sustain platform infrastructure.
              </li>
              <li>
                <strong>Final Payable:</strong> Accurately rounded to 2 decimal places and passed to Razorpay.
              </li>
            </ol>
          </div>
        </div>

        {/* Right Side: Interactive Live Price Preview Calculator */}
        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-[#5C0F17]">
                <Calculator size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  Live Pricing Simulator
                </h2>
                <p className="text-xs text-neutral-500">
                  Test your tax and fee parameters before saving.
                </p>
              </div>
            </div>

            {/* Inputs */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-700">
                  Test Cart Subtotal (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={calcSubtotal}
                  onChange={(e) => setCalcSubtotal(e.target.value)}
                  className={inputClass}
                  placeholder="2500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-700">
                  Test Coupon Discount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={calcCouponDiscount}
                  onChange={(e) => setCalcCouponDiscount(e.target.value)}
                  className={inputClass}
                  placeholder="250"
                />
              </div>
            </div>

            {/* Live Visual Breakdown */}
            <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Calculated Checkout Receipt
              </p>

              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between text-neutral-700">
                  <span>Product Subtotal</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-emerald-700">
                  <span>Coupon Discount</span>
                  <span className="font-semibold">-₹{couponDiscount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between border-t border-dashed border-neutral-300 pt-2 font-medium text-neutral-800">
                  <span>Discounted Subtotal</span>
                  <span>₹{discountedSubtotal.toFixed(2)}</span>
                </div>

                {calculatedCharges.map((c) => (
                  <div
                    key={c._id || c.key}
                    className={`flex justify-between text-xs ${
                      c.isActive ? "text-neutral-700" : "text-neutral-400 line-through"
                    }`}
                  >
                    <span>
                      {c.name} {c.isActive && c.type === "percentage" ? `(${c.value}%)` : ""}
                      {!c.isActive && " (Inactive)"}
                    </span>
                    <span className="font-medium">
                      +₹{(c.isActive ? c.amount : 0).toFixed(2)}
                    </span>
                  </div>
                ))}

                <div className="border-t border-neutral-300 pt-3">
                  <div className="flex items-center justify-between text-base font-black text-neutral-900">
                    <span>Final Payable Amount</span>
                    <span className="text-[#5C0F17]">₹{finalPayable.toFixed(2)}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-neutral-400">
                    This is the exact authoritative amount generated on Razorpay order creation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add or Edit Surcharge */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-lg font-bold text-neutral-900">
                {editingCharge ? `Edit '${editingCharge.name}'` : "Add New Surcharge"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCharge} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-700">
                  Charge Name *
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={60}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. GST or Platform Fee"
                  className={inputClass}
                />
              </div>

              {!editingCharge && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-neutral-700">
                    Unique Key Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={40}
                    value={form.key}
                    onChange={(e) => setForm({ ...form, key: e.target.value })}
                    placeholder="e.g. gst, platform_fee, packaging_charge"
                    className={inputClass}
                  />
                  <p className="mt-1 text-[11px] text-neutral-400">
                    Lowercase alphanumeric string used in APIs and order records.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-neutral-700">
                    Fee Type *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className={inputClass}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-neutral-700">
                    Value *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max={form.type === "percentage" ? "100" : "100000"}
                    step="0.01"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    placeholder="e.g. 18 or 20"
                    className={inputClass}
                  />
                </div>
              </div>

              {form.type === "percentage" && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-neutral-700">
                    Calculation Basis
                  </label>
                  <select
                    value={form.calculationBasis}
                    onChange={(e) => setForm({ ...form, calculationBasis: e.target.value })}
                    className={inputClass}
                  >
                    <option value="discounted_subtotal">
                      Discounted Subtotal (Subtotal - Coupon Discount) [Standard]
                    </option>
                    <option value="subtotal">
                      Raw Subtotal (Before Coupon Discount)
                    </option>
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-700">
                  Customer Explanation Description
                </label>
                <textarea
                  rows={2}
                  maxLength={200}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Explains what this charge is for on the checkout summary"
                  className={inputClass}
                />
                <p className="mt-1 text-right text-[11px] text-neutral-400">
                  {form.description.length}/200
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chargeIsActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-neutral-300 text-[#5C0F17] focus:ring-[#5C0F17]"
                />
                <label htmlFor="chargeIsActive" className="text-xs font-medium text-neutral-700">
                  Active (applied to checkout calculations)
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-neutral-100 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#5C0F17] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#4A0D15] disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingCharge ? "Save Changes" : "Create Charge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

