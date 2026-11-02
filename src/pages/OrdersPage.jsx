import { useEffect, useState } from "react";
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShoppingBag,
  Filter,
  Eye,
  X,
  CreditCard,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Package,
  IndianRupee,
  Receipt,
  Truck,
  Percent,
  TrendingUp,
  User,
  ShieldCheck,
} from "lucide-react";
import { api } from "../services/api";
import { resolveImageUrl } from "../utils/imageHelper";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);

  // Selected Order for Details Drawer/Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (paymentStatusFilter !== "all") params.append("paymentStatus", paymentStatusFilter);
      if (search.trim()) params.append("search", search.trim());
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      params.append("page", page);
      params.append("limit", 15);

      const data = await api.get(`/orders?${params.toString()}`);
      setOrders(data.orders || []);
      setTotalPages(data.pages || 1);
      setTotalOrders(data.total || 0);
    } catch (err) {
      console.error("Orders fetch error:", err);
      setError(err.message || "Failed to load orders from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, paymentStatusFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadOrders();
  };

  const handleDateFilterApply = (e) => {
    e.preventDefault();
    setPage(1);
    loadOrders();
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPaymentStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  // Open complete order details on click
  const handleOpenOrder = async (order) => {
    setSelectedOrder(order);
    setDetailsError(null);
    try {
      setDetailsLoading(true);
      const res = await api.get(`/orders/${order._id || order.orderNumber}`);
      if (res.success && res.order) {
        setSelectedOrder(res.order);
      }
    } catch (err) {
      console.warn("Could not fetch extra order details, showing cached order:", err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      await api.put(`/orders/${orderId}/status`, { orderStatus: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus } : o))
      );
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, orderStatus: newStatus }));
      }
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Cancelled":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case "paid":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "failed":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900">Orders</h1>
          <p className="mt-1 text-xs text-neutral-500">
            Monitor, inspect and update customer orders ({totalOrders} total). Click any order to open complete details.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-xs font-semibold text-red-600">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <form onSubmit={handleSearchSubmit} className="md:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input
              type="text"
              maxLength={100}
              placeholder="Search by order #, customer, email, or Razorpay ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-xs outline-none focus:border-[#5C0F17] focus:bg-white"
            />
          </form>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs font-medium outline-none focus:border-[#5C0F17] focus:bg-white"
            >
              <option value="all">All Order Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <select
              value={paymentStatusFilter}
              onChange={(e) => {
                setPaymentStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs font-medium outline-none focus:border-[#5C0F17] focus:bg-white"
            >
              <option value="all">All Payment Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Date Range Filtering */}
        <form onSubmit={handleDateFilterApply} className="flex flex-wrap items-center gap-3 pt-2 border-t border-neutral-100 text-xs">
          <span className="font-bold text-neutral-600 flex items-center gap-1">
            <Calendar size={14} className="text-neutral-400" /> Filter Date Range:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs outline-none focus:border-[#5C0F17]"
            />
            <span className="text-neutral-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs outline-none focus:border-[#5C0F17]"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-[#5C0F17] px-4 py-1.5 font-bold text-white transition hover:bg-[#4A0D15]"
          >
            Apply
          </button>
          {(startDate || endDate || search || statusFilter !== "all" || paymentStatusFilter !== "all") && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-semibold text-neutral-400 hover:text-neutral-700"
            >
              Reset Filters
            </button>
          )}
        </form>
      </div>

      {/* Orders Table Section */}
      <section className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#5C0F17] border-t-transparent" />
          </div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-100 bg-[#FAF6F0]/70 text-neutral-500">
                <tr>
                  <th className="px-5 py-4 font-bold">Order #</th>
                  <th className="px-5 py-4 font-bold">Customer</th>
                  <th className="px-5 py-4 font-bold">Items</th>
                  <th className="px-5 py-4 font-bold">Total</th>
                  <th className="px-5 py-4 font-bold">Date</th>
                  <th className="px-5 py-4 font-bold">Payment</th>
                  <th className="px-5 py-4 font-bold">Order Status</th>
                  <th className="px-5 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-100">
                {orders.map((order) => (
                  <tr
                    key={order._id}
                    onClick={() => handleOpenOrder(order)}
                    className="hover:bg-neutral-50/80 transition cursor-pointer group"
                    title="Click row to view complete order details"
                  >
                    <td className="px-5 py-4 font-mono font-bold text-neutral-900 group-hover:text-[#5C0F17]">
                      {order.orderNumber}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-neutral-800">{order.customerDetails?.name || "Customer"}</p>
                      <p className="text-[11px] text-neutral-400">{order.customerDetails?.email}</p>
                    </td>
                    <td className="px-5 py-4 text-neutral-600 font-medium">
                      {order.items?.length || 0} product(s)
                    </td>
                    <td className="px-5 py-4 font-black text-neutral-900">
                      ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4 text-neutral-500 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold uppercase text-neutral-700">{order.paymentMethod}</span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getPaymentStatusBadge(
                            order.paymentStatus
                          )}`}
                        >
                          {order.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        disabled={updatingId === order._id}
                        value={order.orderStatus}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className={`rounded-xl border px-2.5 py-1 text-xs font-bold outline-none transition ${getStatusBadge(
                          order.orderStatus
                        )}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenOrder(order)}
                        className="inline-flex items-center gap-1 rounded-xl bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-700 hover:bg-[#5C0F17] hover:text-white transition"
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <ShoppingBag size={40} className="mx-auto text-neutral-300" />
            <h3 className="mt-3 text-base font-bold text-neutral-700">No orders found</h3>
            <p className="mt-1 text-xs text-neutral-400">
              There are currently no orders matching the search or filter criteria.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-3 text-xs">
            <span className="text-neutral-500 font-medium">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 disabled:opacity-40 hover:bg-neutral-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 disabled:opacity-40 hover:bg-neutral-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* Complete Order Details Drawer / Modal                        */}
      {/* ============================================================ */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-xs">
          <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-neutral-100">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="absolute right-5 top-5 rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-100 pb-5">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5C0F17]/10 text-[#5C0F17]">
                  <Package size={24} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-neutral-900">
                      Order {selectedOrder.orderNumber}
                    </h2>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getOrderStatusBadge(
                        selectedOrder.orderStatus
                      )}`}
                    >
                      {selectedOrder.orderStatus}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${getPaymentStatusBadge(
                        selectedOrder.paymentStatus
                      )}`}
                    >
                      {selectedOrder.paymentStatus}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    Placed on: {new Date(selectedOrder.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>

              {detailsLoading && (
                <div className="flex items-center gap-1.5 text-xs text-[#5C0F17] font-semibold">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#5C0F17] border-t-transparent" />
                  Refreshing details...
                </div>
              )}
            </div>

            {/* Customer & Shipping Details Grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer Info Card */}
              <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/60 p-4 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-neutral-800">
                  <User size={15} className="text-[#5C0F17]" /> Customer Profile
                </div>
                <div className="space-y-1 text-neutral-600">
                  <p><span className="text-neutral-400">Name:</span> <b className="text-neutral-800">{selectedOrder.customerDetails?.name || "N/A"}</b></p>
                  <p><span className="text-neutral-400">Email:</span> {selectedOrder.customerDetails?.email || "N/A"}</p>
                  <p><span className="text-neutral-400">Phone:</span> {selectedOrder.customerDetails?.phone || "N/A"}</p>
                  <p className="font-mono text-[11px] text-neutral-400">
                    User ID: {selectedOrder.user?._id || selectedOrder.user || "N/A"}
                  </p>
                </div>
              </div>

              {/* Shipping Address Card */}
              <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/60 p-4 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-neutral-800">
                  <MapPin size={15} className="text-[#5C0F17]" /> Delivery Address
                </div>
                <div className="text-neutral-600 space-y-1">
                  <p className="font-bold text-neutral-800">{selectedOrder.customerDetails?.name}</p>
                  <p>{selectedOrder.shippingAddress?.street}</p>
                  <p>
                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.postalCode}
                  </p>
                  <p className="text-neutral-400">{selectedOrder.shippingAddress?.country || "India"}</p>
                </div>
              </div>
            </div>

            {/* Payment & Transaction Info */}
            <div className="mt-4 rounded-2xl border border-neutral-200/80 bg-neutral-50/60 p-4 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-neutral-800">
                <CreditCard size={15} className="text-[#5C0F17]" /> Payment & Gateway Information
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-neutral-600 pt-1">
                <div>
                  <span className="text-neutral-400 block text-[11px]">Payment Method</span>
                  <b className="uppercase text-neutral-800">{selectedOrder.paymentMethod}</b>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[11px]">Payment Status</span>
                  <b className={selectedOrder.paymentStatus === "paid" ? "text-emerald-700 font-black" : "text-amber-700"}>
                    {selectedOrder.paymentStatus.toUpperCase()}
                  </b>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[11px]">Amount Collected</span>
                  <b className="font-mono text-neutral-900">
                    {selectedOrder.paymentStatus === "paid"
                      ? `₹${Number(selectedOrder.totalAmount).toLocaleString("en-IN")}`
                      : "₹0.00 (Pending)"}
                  </b>
                </div>

                {selectedOrder.paymentDetails?.razorpayOrderId && (
                  <div className="sm:col-span-2">
                    <span className="text-neutral-400 block text-[10px]">Razorpay Order ID</span>
                    <span className="font-mono text-[11px] text-neutral-700">{selectedOrder.paymentDetails.razorpayOrderId}</span>
                  </div>
                )}
                {selectedOrder.paymentDetails?.razorpayPaymentId && (
                  <div>
                    <span className="text-neutral-400 block text-[10px]">Razorpay Payment ID</span>
                    <span className="font-mono text-[11px] text-neutral-700">{selectedOrder.paymentDetails.razorpayPaymentId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Purchased Items List */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Purchased Products ({selectedOrder.items?.length || 0})
                </h3>
              </div>

              <div className="divide-y divide-neutral-100 border-y border-neutral-100 max-h-60 overflow-y-auto">
                {selectedOrder.items?.map((item, idx) => {
                  const itemImg = resolveImageUrl(
                    item.image || (item.product && item.product.images && item.product.images[0]) || ""
                  );
                  return (
                    <div key={idx} className="flex items-center gap-4 py-3">
                      {itemImg ? (
                        <img
                          src={itemImg}
                          alt={item.name}
                          className="h-12 w-12 rounded-xl object-cover bg-neutral-100 border border-neutral-200/60"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
                          <Package size={20} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-neutral-800">{item.name}</p>
                        <p className="text-[11px] text-neutral-400">
                          Qty: {item.quantity} × ₹{Number(item.price).toLocaleString("en-IN")}
                        </p>
                        {item.allocatedDiscount > 0 && (
                          <p className="text-[10px] text-rose-600 font-semibold">
                            Coupon discount applied: -₹{item.allocatedDiscount}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-xs font-bold text-neutral-900 font-mono">
                        ₹{Number(item.price * item.quantity).toLocaleString("en-IN")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Complete Itemized Financial Breakdown */}
            <div className="mt-6 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 p-5 text-xs space-y-2.5">
              <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                <Receipt size={14} className="text-[#DA9B26]" /> Authoritative Financial Breakdown
              </h4>

              <div className="flex justify-between text-neutral-600">
                <span>Product Selling Subtotal</span>
                <span className="font-mono">₹{Number(selectedOrder.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>

              {selectedOrder.coupon?.discount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span className="flex items-center gap-1">
                    <Percent size={12} /> Coupon Discount ({selectedOrder.coupon?.code || "APPLIED"})
                  </span>
                  <span className="font-mono">-₹{Number(selectedOrder.coupon.discount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              {selectedOrder.discountedSubtotal !== undefined && selectedOrder.discountedSubtotal !== selectedOrder.subtotal && (
                <div className="flex justify-between text-neutral-500 text-[11px]">
                  <span>Discounted Subtotal</span>
                  <span className="font-mono">₹{Number(selectedOrder.discountedSubtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="flex justify-between text-neutral-600">
                <span>Taxes & GST Collected</span>
                <span className="font-mono">₹{Number(selectedOrder.taxAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between text-neutral-600">
                <span>Platform Fee</span>
                <span className="font-mono">₹{Number(selectedOrder.platformFee || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Detailed chargesBreakdown if any */}
              {Array.isArray(selectedOrder.chargesBreakdown) && selectedOrder.chargesBreakdown.length > 0 && (
                <div className="pl-3 py-1 border-l-2 border-neutral-200 space-y-1 text-[11px] text-neutral-500">
                  {selectedOrder.chargesBreakdown.map((charge, cIdx) => (
                    <div key={cIdx} className="flex justify-between">
                      <span>• {charge.name || charge.key}</span>
                      <span className="font-mono">₹{Number(charge.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between text-neutral-600">
                <span>Shipping Delivery Fee</span>
                <span className="font-mono">
                  {Number(selectedOrder.shippingFee || 0) === 0 ? "FREE" : `₹${Number(selectedOrder.shippingFee).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                </span>
              </div>

              <div className="flex justify-between border-t border-neutral-200 pt-3 text-sm font-black text-neutral-900">
                <span>Total Payable Amount</span>
                <span className="font-mono text-base text-[#5C0F17]">
                  ₹{Number(selectedOrder.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between pt-1 text-xs font-bold">
                <span className="text-neutral-500">Amount Paid / Collected</span>
                <span className={`font-mono ${selectedOrder.paymentStatus === "paid" ? "text-emerald-700 font-black" : "text-amber-700"}`}>
                  {selectedOrder.paymentStatus === "paid"
                    ? `₹${Number(selectedOrder.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                    : "₹0.00 (Pending)"}
                </span>
              </div>
            </div>

            {/* Status Change & Actions Footer */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-600">Update Order Status:</span>
                <select
                  value={selectedOrder.orderStatus}
                  onChange={(e) => handleStatusChange(selectedOrder._id, e.target.value)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-bold outline-none shadow-xs ${getStatusBadge(
                    selectedOrder.orderStatus
                  )}`}
                >
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl bg-neutral-900 px-6 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
