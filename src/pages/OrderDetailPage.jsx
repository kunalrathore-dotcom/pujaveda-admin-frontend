import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  MapPin,
  Package,
  Receipt,
  Truck,
  Percent,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { api } from "../services/api";
import { resolveImageUrl } from "../utils/imageHelper";

/**
 * Checks if an order has been collected according to business rules.
 */
function isOrderCollected(order) {
  if (!order || order.orderStatus === "Cancelled") return false;
  if (order.paymentMethod === "cod") {
    return order.orderStatus === "Delivered" && order.paymentStatus === "paid";
  }
  return order.paymentStatus === "paid";
}

/**
 * Calculates eligible fee earnings on an order.
 */
function getOrderAdminFee(order) {
  if (!order) return 0;
  const platformFee = Number(order.platformFee || 0);
  const charges = Array.isArray(order.chargesBreakdown) ? order.chargesBreakdown : [];
  const additional = charges.reduce((acc, c) => {
    const key = (c.key || "").toLowerCase();
    const name = (c.name || "").toLowerCase();
    if (
      key === "gst" ||
      key === "tax" ||
      key === "platform_fee" ||
      key === "shipping" ||
      name.includes("gst") ||
      name.includes("tax") ||
      name.includes("shipping") ||
      name.includes("platform fee")
    ) {
      return acc;
    }
    return acc + (Number(c.amount) || 0);
  }, 0);
  return Number((platformFee + additional).toFixed(2));
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedStatus, setSelectedStatus] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(null);
  const [updateError, setUpdateError] = useState(null);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/orders/${id}`);
      if (res && res.success && res.order) {
        setOrder(res.order);
        setSelectedStatus(res.order.orderStatus || "Pending");
      } else {
        setError(res?.message || "Order not found.");
      }
    } catch (err) {
      console.error("Order fetch error:", err);
      setError(err.message || "Failed to load order from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!order || selectedStatus === order.orderStatus) return;
    try {
      setUpdating(true);
      setUpdateSuccess(null);
      setUpdateError(null);

      const res = await api.put(`/orders/${order._id}/status`, {
        orderStatus: selectedStatus,
      });

      if (res && res.success) {
        setUpdateSuccess(`Order status updated to "${selectedStatus}" successfully.`);
        // Refresh order details from server
        await fetchOrder();
      } else {
        setUpdateError(res?.message || "Failed to update order status.");
      }
    } catch (err) {
      console.error("Status update error:", err);
      setUpdateError(err.message || "Failed to update order status.");
    } finally {
      setUpdating(false);
      setTimeout(() => setUpdateSuccess(null), 4000);
    }
  };

  const getOrderStatusBadge = (status = "Pending") => {
    switch (status) {
      case "Delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Processing":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const getPaymentStatusBadge = (status = "pending") => {
    const s = String(status).toLowerCase();
    switch (s) {
      case "paid":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "failed":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#5C0F17] border-t-transparent" />
          <p className="text-xs font-semibold text-neutral-500">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 shadow-xs transition"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-8 text-center">
          <AlertCircle size={36} className="mx-auto text-rose-600 mb-3" />
          <h2 className="text-base font-bold text-neutral-800">Order not found</h2>
          <p className="mt-1 text-xs text-neutral-500 max-w-md mx-auto">
            {error || "The requested order could not be located in the database."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={fetchOrder}
              className="rounded-xl bg-[#5C0F17] px-4 py-2 text-xs font-bold text-white hover:bg-[#4A0D15] transition"
            >
              Retry
            </button>
            <Link
              to="/orders"
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition"
            >
              Go to Orders List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const collected = isOrderCollected(order);
  const productVal = Number(order.productValue ?? order.subtotal ?? 0);
  const customerPaidVal = collected ? Number(order.customerPaid ?? order.totalAmount ?? 0) : 0;
  const adminFeeVal = collected ? Number(order.adminFeeEarnings ?? getOrderAdminFee(order)) : 0;
  const customerUserId = order.user?._id || (typeof order.user === "string" ? order.user : null);

  const transactionId =
    order.transactionId ||
    order.paymentDetails?.razorpayPaymentId ||
    order.paymentDetails?.razorpayOrderId ||
    null;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 shadow-xs transition"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                Order {order.orderNumber}
              </h1>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getOrderStatusBadge(
                  order.orderStatus
                )}`}
              >
                {order.orderStatus}
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Placed on{" "}
              {order.createdAt
                ? new Date(order.createdAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "N/A"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchOrder}
          className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 shadow-xs transition"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Notifications */}
      {updateSuccess && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-semibold text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          {updateSuccess}
        </div>
      )}
      {updateError && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-800">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          {updateError}
        </div>
      )}

      {/* ============================================================ */}
      {/* A. Top Hero Banner Card                                      */}
      {/* ============================================================ */}
      <div className="rounded-3xl border border-[#3E0F16] bg-gradient-to-r from-[#25080D] via-[#2D0A10] to-[#400B10] p-6 text-[#FAF5ED] shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#DA9B26]">
                Authoritative Order Record
              </span>
              <span className="font-mono text-xs text-[#D8C7B8]">• ID: {order._id}</span>
            </div>
            <h2 className="text-2xl font-black text-[#FFFDF9] tracking-tight mt-1">
              {order.orderNumber}
            </h2>
            <p className="text-xs text-[#D8C7B8] mt-1">
              Payment Method: <b className="uppercase text-white">{order.paymentMethod || "RAZORPAY"}</b>
              {transactionId && (
                <span className="ml-3 font-mono text-[11px] text-[#DA9B26]">
                  Ref: {transactionId}
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={`rounded-xl border px-3 py-1.5 text-xs font-black uppercase tracking-wider ${
                order.paymentStatus === "paid"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/40"
              }`}
            >
              Payment: {order.paymentStatus || "pending"}
            </span>
            <span
              className={`rounded-xl border px-3 py-1.5 text-xs font-black tracking-wider ${
                order.orderStatus === "Delivered"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : order.orderStatus === "Cancelled"
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  : "bg-blue-500/20 text-blue-300 border-blue-500/40"
              }`}
            >
              Status: {order.orderStatus}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* B. Three Core Figures Together                               */}
      {/* ============================================================ */}
      <div className="rounded-3xl border-2 border-[#DA9B26]/30 bg-gradient-to-br from-[#FFFDF9] via-white to-[#FAF6F0] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#5C0F17]">
            Order Financial Summary At A Glance
          </p>
          <span className="text-[10px] font-semibold text-neutral-400">
            {collected ? "✓ Confirmed Collected" : "Payment Pending / Uncollected"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* A. Product Value */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
              A. Product Value
            </span>
            <span className="text-xl font-black text-neutral-900 font-mono mt-1 block">
              ₹{productVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-neutral-500 font-medium mt-1 block">
              Original selling price of products
            </span>
          </div>

          {/* B. Customer Paid */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
              B. Customer Paid
            </span>
            <span className="text-xl font-black text-emerald-700 font-mono mt-1 block">
              {collected
                ? `₹${customerPaidVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                : "₹0.00"}
            </span>
            <span
              className={`text-[11px] font-semibold mt-1 block ${
                collected ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {collected
                ? "✓ Verified received from customer"
                : order.paymentMethod === "cod"
                ? "Pending COD delivery"
                : "Payment pending / failed"}
            </span>
          </div>

          {/* C. Admin Fee Earnings */}
          <div className="rounded-2xl border border-[#DA9B26]/40 bg-[#FFFDF9] p-4 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#5C0F17] block">
              C. Admin Fee Earnings
            </span>
            <span className="text-xl font-black text-[#5C0F17] font-mono mt-1 block">
              ₹{adminFeeVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-neutral-500 font-medium mt-1 block">
              {collected
                ? "Platform fee & eligible service charges"
                : "Earned only once order is paid/delivered"}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* C. Customer Profile & Shipping Information Cards             */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Customer Information Card */}
        <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <User size={18} className="text-[#5C0F17]" />
              <h3 className="text-sm font-black text-neutral-900">Customer Profile</h3>
            </div>
            {customerUserId && (
              <Link
                to={`/customers/${customerUserId}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#5C0F17] hover:underline"
              >
                View Full Profile <ExternalLink size={12} />
              </Link>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="text-neutral-400">Name:</span>
              <span className="font-bold text-neutral-900">
                {order.customerDetails?.name || order.user?.name || "Customer"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-neutral-400">Email:</span>
              <span className="font-medium text-neutral-700">
                {order.customerDetails?.email || order.user?.email || "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-neutral-400">Phone:</span>
              <span className="font-medium text-neutral-700">
                {order.customerDetails?.phone || order.user?.phone || "N/A"}
              </span>
            </div>
            {customerUserId && (
              <div className="flex justify-between items-center py-1 border-t border-neutral-100 pt-2">
                <span className="text-neutral-400">Database User ID:</span>
                <Link
                  to={`/customers/${customerUserId}`}
                  className="font-mono text-[11px] text-[#5C0F17] hover:underline"
                >
                  {customerUserId}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Shipping / Delivery Address */}
        <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <MapPin size={18} className="text-[#5C0F17]" />
            <h3 className="text-sm font-black text-neutral-900">Delivery Address</h3>
          </div>

          <div className="space-y-1.5 text-xs text-neutral-700">
            <p className="font-bold text-neutral-900">
              {order.customerDetails?.name || "Recipient"}
            </p>
            <p className="text-neutral-600">
              {order.shippingAddress?.street || "No street address specified"}
            </p>
            <p className="text-neutral-600">
              {order.shippingAddress?.city || "N/A"}, {order.shippingAddress?.state || "N/A"}{" "}
              {order.shippingAddress?.postalCode ? `- ${order.shippingAddress.postalCode}` : ""}
            </p>
            <p className="text-neutral-400">{order.shippingAddress?.country || "India"}</p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* D. Payment & Gateway Details                                 */}
      {/* ============================================================ */}
      <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-3 mb-4">
          <CreditCard size={18} className="text-[#5C0F17]" />
          <h3 className="text-sm font-black text-neutral-900">Payment & Gateway Details</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="rounded-2xl bg-neutral-50 p-3.5 border border-neutral-200/70">
            <span className="text-[10px] font-bold uppercase text-neutral-400 block">
              Payment Method
            </span>
            <span className="font-bold text-neutral-900 uppercase mt-1 block">
              {order.paymentMethod || "RAZORPAY"}
            </span>
          </div>

          <div className="rounded-2xl bg-neutral-50 p-3.5 border border-neutral-200/70">
            <span className="text-[10px] font-bold uppercase text-neutral-400 block">
              Payment Status
            </span>
            <span
              className={`font-black uppercase mt-1 block ${
                order.paymentStatus === "paid" ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {order.paymentStatus || "pending"}
            </span>
          </div>

          <div className="rounded-2xl bg-neutral-50 p-3.5 border border-neutral-200/70">
            <span className="text-[10px] font-bold uppercase text-neutral-400 block">
              Collection Status
            </span>
            <span className="font-bold text-neutral-900 mt-1 block">
              {collected
                ? `₹${Number(order.totalAmount || 0).toLocaleString("en-IN")} Received`
                : "Uncollected"}
            </span>
          </div>

          <div className="rounded-2xl bg-neutral-50 p-3.5 border border-neutral-200/70">
            <span className="text-[10px] font-bold uppercase text-neutral-400 block">
              Transaction ID
            </span>
            <span className="font-mono text-[11px] text-[#5C0F17] font-bold mt-1 block truncate">
              {transactionId || "—"}
            </span>
          </div>
        </div>

        {(order.paymentDetails?.razorpayOrderId || order.paymentDetails?.razorpayPaymentId) && (
          <div className="mt-4 rounded-2xl bg-neutral-50/80 p-3.5 border border-neutral-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {order.paymentDetails?.razorpayOrderId && (
              <div>
                <span className="text-neutral-400 text-[10px] uppercase font-bold block">
                  Razorpay Order ID
                </span>
                <span className="font-mono text-[11px] text-neutral-700 select-all">
                  {order.paymentDetails.razorpayOrderId}
                </span>
              </div>
            )}
            {order.paymentDetails?.razorpayPaymentId && (
              <div>
                <span className="text-neutral-400 text-[10px] uppercase font-bold block">
                  Razorpay Payment ID
                </span>
                <span className="font-mono text-[11px] text-neutral-700 select-all font-bold">
                  {order.paymentDetails.razorpayPaymentId}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* E. Purchased Items List                                      */}
      {/* ============================================================ */}
      <section className="rounded-3xl border border-neutral-200/80 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-neutral-100 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-[#5C0F17]" />
            <h3 className="text-sm font-black text-neutral-900">
              Purchased Products ({order.items?.length || 0})
            </h3>
          </div>
        </div>

        <div className="divide-y divide-neutral-100">
          {order.items?.map((item, idx) => {
            const itemImg = resolveImageUrl(
              item.image ||
                (item.product && Array.isArray(item.product.images) && item.product.images[0]) ||
                ""
            );
            const unitPrice = Number(item.price || 0);
            const qty = Number(item.quantity || 1);
            const itemSubtotal = unitPrice * qty;
            const discount = Number(item.allocatedDiscount || 0);
            const finalItemAmount = Math.max(0, itemSubtotal - discount);

            return (
              <div
                key={idx}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/50 transition"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {itemImg ? (
                    <img
                      src={itemImg}
                      alt={item.name || "Product"}
                      className="h-14 w-14 rounded-2xl object-cover bg-neutral-100 border border-neutral-200/80 shrink-0"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
                      <Package size={22} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-neutral-900 truncate">
                      {item.name || "Product Item"}
                    </h4>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      ₹{unitPrice.toLocaleString("en-IN")} × {qty} unit(s)
                    </p>
                    {discount > 0 && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-0.5">
                        Allocated coupon discount: -₹{discount.toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right sm:self-center shrink-0">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                    Line Total
                  </span>
                  <span className="text-sm font-black font-mono text-neutral-900">
                    ₹{finalItemAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================ */}
      {/* F. Complete 10-Point Authoritative Financial Breakdown        */}
      {/* ============================================================ */}
      <section className="rounded-3xl bg-neutral-50/80 border border-neutral-200/80 p-5 sm:p-6 text-xs space-y-3">
        <h4 className="font-black text-neutral-900 uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
          <Receipt size={16} className="text-[#DA9B26]" /> Complete Authoritative Financial Breakdown
        </h4>

        {/* 1. Original Product Value */}
        <div className="flex justify-between text-neutral-600">
          <span>1. Original Product Value (Subtotal)</span>
          <span className="font-mono font-medium">
            ₹{Number(order.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* 2. Coupon Discount */}
        {order.coupon?.discount > 0 && (
          <div className="flex justify-between text-rose-600 font-semibold">
            <span className="flex items-center gap-1">
              <Percent size={12} /> 2. Discount Applied ({order.coupon?.code || "COUPON"})
            </span>
            <span className="font-mono">
              -₹{Number(order.coupon.discount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* 3. Discounted Product Value */}
        <div className="flex justify-between text-neutral-500 text-[11px]">
          <span>3. Discounted Product Value</span>
          <span className="font-mono">
            ₹
            {Number(
              order.discountedSubtotal || order.subtotal || 0
            ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* 4. Tax (GST) */}
        <div className="flex justify-between text-neutral-600">
          <span>4. Taxes & GST Collected</span>
          <span className="font-mono font-medium">
            ₹{Number(order.taxAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* 5. Platform Fee */}
        <div className="flex justify-between text-neutral-600">
          <span>5. Platform Fee</span>
          <span className="font-mono font-medium">
            ₹{Number(order.platformFee || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* 6. Additional Service Charges */}
        {Array.isArray(order.chargesBreakdown) && order.chargesBreakdown.length > 0 && (
          <div className="pl-3 py-1 border-l-2 border-neutral-200 space-y-1 text-[11px] text-neutral-500">
            {order.chargesBreakdown.map((charge, cIdx) => (
              <div key={cIdx} className="flex justify-between">
                <span>• {charge.name || charge.key}</span>
                <span className="font-mono">
                  ₹{Number(charge.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 7. Shipping Fee */}
        <div className="flex justify-between text-neutral-600">
          <span>7. Shipping Fee</span>
          <span className="font-mono font-medium">
            {Number(order.shippingFee || 0) === 0
              ? "FREE"
              : `₹${Number(order.shippingFee).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          </span>
        </div>

        {/* 8. Final Customer Payable Amount */}
        <div className="flex justify-between border-t border-neutral-200 pt-3 text-sm font-black text-neutral-900">
          <span>8. Final Customer Payable Amount</span>
          <span className="font-mono text-base text-[#5C0F17]">
            ₹{Number(order.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* 9. Customer Paid Amount */}
        <div className="flex justify-between pt-1 text-xs font-bold">
          <span className="text-neutral-600">9. Customer Paid Amount</span>
          <span
            className={`font-mono ${collected ? "text-emerald-700 font-black" : "text-amber-700"}`}
          >
            {collected
              ? `₹${Number(order.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
              : "₹0.00 (Uncollected / Pending)"}
          </span>
        </div>

        {/* 10. Business Admin Fee Earnings */}
        <div className="flex justify-between pt-1 text-xs font-bold text-[#5C0F17] bg-[#5C0F17]/5 p-3 rounded-2xl border border-[#DA9B26]/30">
          <span>10. Business Admin Fee Earnings</span>
          <span className="font-mono font-black text-sm">
            ₹{adminFeeVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </section>

      {/* ============================================================ */}
      {/* G. Order Status Management Controls                          */}
      {/* ============================================================ */}
      <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-black text-neutral-900">Manage Order Fulfillment Status</h4>
          <p className="text-xs text-neutral-500">
            Update lifecycle status (Pending $\rightarrow$ Processing $\rightarrow$ Delivered $\rightarrow$ Cancelled)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            disabled={updating}
            className={`rounded-xl border px-3.5 py-2 text-xs font-bold outline-none shadow-xs transition ${getOrderStatusBadge(
              selectedStatus
            )}`}
          >
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <button
            type="button"
            onClick={handleStatusUpdate}
            disabled={updating || selectedStatus === order.orderStatus}
            className="rounded-xl bg-[#5C0F17] px-4 py-2 text-xs font-bold text-white hover:bg-[#4A0D15] disabled:opacity-50 transition shadow-xs"
          >
            {updating ? "Updating..." : "Save Status"}
          </button>
        </div>
      </div>
    </div>
  );
}
