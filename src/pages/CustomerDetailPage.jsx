import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  ShoppingBag,
  IndianRupee,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Heart,
  MapPin,
  Package,
  Eye,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Star,
  Coins,
  Zap,
  MessageSquare,
} from "lucide-react";
import { api } from "../services/api";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/admin/customers/${id}`);
      if (res && res.success) {
        setData(res);
      } else {
        setError(res?.message || "Customer not found.");
      }
    } catch (err) {
      console.error("Customer fetch error:", err);
      setError(err.message || "Failed to load customer profile from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCustomer();
    }
  }, [id]);

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
          <p className="text-xs font-semibold text-neutral-500">Loading customer profile...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.customer) {
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
          <h2 className="text-base font-bold text-neutral-800">Unable to load customer</h2>
          <p className="mt-1 text-xs text-neutral-500 max-w-md mx-auto">
            {error || "The requested customer profile could not be retrieved from the database."}
          </p>
          <button
            type="button"
            onClick={fetchCustomer}
            className="mt-4 rounded-xl bg-[#5C0F17] px-4 py-2 text-xs font-bold text-white hover:bg-[#4A0D15] transition"
          >
            Retry Fetch
          </button>
        </div>
      </div>
    );
  }

  const { customer, orderSummary = {}, orders = [], wishlist = { count: 0, items: [] } } = data;
  const initial = customer.name ? customer.name.charAt(0).toUpperCase() : "U";

  const accountAgeDays = customer.createdAt
    ? Math.max(0, Math.floor((Date.now() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const joinedDateFormatted = customer.createdAt
    ? new Date(customer.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "N/A";

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation Header */}
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
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              User Details</h1>
            <p className="text-xs text-neutral-500">View detailed information about the user.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchCustomer}
          className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 shadow-xs transition"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ============================================================ */}
      {/* A. Top Hero Banner Card (Screenshot Structure Reference)     */}
      {/* ============================================================ */}
      <div className="rounded-3xl border border-[#3E0F16] bg-gradient-to-r from-[#25080D] via-[#2D0A10] to-[#400B10] p-6 text-[#FAF5ED] shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {/* Avatar Circle */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#DA9B26] to-[#B7791F] text-2xl font-black text-[#2D0A10] shadow-md ring-4 ring-[#FFFDF9]/10">
              {initial}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-[#FFFDF9]">
                  {customer.name}
                </h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                    customer.isActive
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  }`}
                >
                  {customer.isActive ? "Active Account" : "Inactive"}
                </span>
                <span className="rounded-full bg-[#DA9B26]/20 px-2 py-0.5 text-[10px] font-bold text-[#DA9B26] border border-[#DA9B26]/30 uppercase">
                  {customer.role || "Customer"}
                </span>
              </div>

              <p className="mt-1 text-xs text-[#D8C7B8]">
                Member since{" "}
                {customer.createdAt
                  ? new Date(customer.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "N/A"}
              </p>
              <p className="font-mono text-[11px] text-[#A89688] mt-0.5">
                ID: {customer._id}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* B. Overview Stats Grid (Screenshot Reference Cards)          */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Profile Status */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
            Profile Status
          </span>
          <span className="text-base font-black text-emerald-700 mt-1 block">
            {customer.isActive ? "Active" : "Inactive"}
          </span>
          <span className="text-[10px] text-neutral-400">Account status</span>
        </div>

        {/* Total Orders */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
            Total Orders
          </span>
          <span className="text-base font-black text-neutral-900 font-mono mt-1 block">
            {orderSummary.totalOrders || 0}
          </span>
          <span className="text-[10px] text-neutral-400">All-time orders</span>
        </div>

        {/* Successfully Paid */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
            Paid Orders
          </span>
          <span className="text-base font-black text-emerald-700 font-mono mt-1 block">
            {orderSummary.paidOrdersCount || 0}
          </span>
          <span className="text-[10px] text-emerald-600 font-medium">Verified payments</span>
        </div>

        {/* Pending Orders */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
            Pending Orders
          </span>
          <span className="text-base font-black text-amber-700 font-mono mt-1 block">
            {orderSummary.pendingOrdersCount || 0}
          </span>
          <span className="text-[10px] text-amber-600 font-medium">Unpaid / pending COD</span>
        </div>

        {/* Delivered Orders */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 block">
            Delivered
          </span>
          <span className="text-base font-black text-blue-700 font-mono mt-1 block">
            {orderSummary.deliveredOrdersCount || 0}
          </span>
          <span className="text-[10px] text-blue-600 font-medium">Fulfilled orders</span>
        </div>

        {/* Total Spent / Paid */}
        <div className="rounded-2xl border border-[#DA9B26]/40 bg-gradient-to-br from-[#FFFDF9] to-[#FAF6F0] p-4 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#5C0F17] block">
            Total Paid
          </span>
          <span className="text-base font-black text-[#5C0F17] font-mono mt-1 block">
            ₹{Number(orderSummary.totalPaid || 0).toLocaleString("en-IN")}
          </span>
          <span className="text-[10px] text-neutral-500 font-medium">Actual collected</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* C. Personal Info & Address Information Grid                  */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <User size={16} className="text-[#5C0F17]" />
            <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider">
              Personal Information
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-neutral-400 block text-[11px]">Full Name</span>
              <p className="font-bold text-neutral-800 mt-0.5">{customer.name}</p>
            </div>
            <div>
              <span className="text-neutral-400 block text-[11px]">Email Address</span>
              <p className="font-semibold text-neutral-800 mt-0.5 flex items-center gap-1">
                <Mail size={12} className="text-neutral-400" /> {customer.email}
              </p>
            </div>
            <div>
              <span className="text-neutral-400 block text-[11px]">Phone Number</span>
              <p className="font-semibold text-neutral-800 mt-0.5 flex items-center gap-1">
                <Phone size={12} className="text-neutral-400" /> {customer.phone || "Not provided"}
              </p>
            </div>
            <div>
              <span className="text-neutral-400 block text-[11px]">Account ID</span>
              <p className="font-mono text-neutral-700 mt-0.5">{customer._id}</p>
            </div>
            <div>
              <span className="text-neutral-400 block text-[11px]">Account Created</span>
              <p className="text-neutral-700 mt-0.5">
                {customer.createdAt ? new Date(customer.createdAt).toLocaleString("en-IN") : "N/A"}
              </p>
            </div>
            <div>
              <span className="text-neutral-400 block text-[11px]">Last Updated</span>
              <p className="text-neutral-700 mt-0.5">
                {customer.updatedAt ? new Date(customer.updatedAt).toLocaleString("en-IN") : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <MapPin size={16} className="text-[#5C0F17]" />
            <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider">
              Saved Delivery Addresses ({customer.addresses?.length || 0})
            </h3>
          </div>

          {customer.addresses && customer.addresses.length > 0 ? (
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {customer.addresses.map((addr, idx) => (
                <div
                  key={addr._id || idx}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-3.5 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-800">Address #{idx + 1}</span>
                    {addr.isDefault && (
                      <span className="rounded-md bg-[#5C0F17] px-2 py-0.5 text-[10px] font-bold text-[#DA9B26]">
                        Default Address
                      </span>
                    )}
                  </div>
                  <p className="text-neutral-700">{addr.street || "No street line"}</p>
                  <p className="text-neutral-600">
                    {addr.city}, {addr.state} {addr.postalCode ? `- ${addr.postalCode}` : ""}
                  </p>
                  <p className="text-neutral-400">{addr.country || "India"}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-center text-xs text-neutral-400">
              <MapPin size={24} className="mx-auto text-neutral-300 mb-1.5" />
              <p>No saved addresses in customer profile.</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Shipping addresses are recorded per order during checkout.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* D. Customer Order History Table                              */}
      {/* ============================================================ */}
      <section className="rounded-3xl border border-neutral-200/80 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-neutral-100 p-5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-neutral-900">
              Customer Order History ({orders.length})
            </h3>
            <p className="text-xs text-neutral-500">
              Complete chronological order log for this customer. Click an order number to open its dedicated Order Details page.
            </p>
          </div>
          <div className="text-xs font-bold text-neutral-600 bg-neutral-50 border border-neutral-200/70 rounded-xl px-3 py-1.5">
            Total Orders: {orders.length}
          </div>
        </div>

        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-100 bg-[#FAF6F0]/80 text-[#756255]">
                <tr>
                  <th className="px-4 py-3.5 font-bold whitespace-nowrap">Order #</th>
                  <th className="px-4 py-3.5 font-bold whitespace-nowrap">Order Date</th>
                  <th className="px-4 py-3.5 font-bold whitespace-nowrap text-right">Product Value</th>
                  <th className="px-4 py-3.5 font-bold whitespace-nowrap text-right">Order Total</th>
                  <th className="px-4 py-3.5 font-bold whitespace-nowrap text-right">Customer Paid</th>
                  <th className="px-4 py-3.5 font-bold whitespace-nowrap text-center">Payment Status</th>
                  <th className="px-4 py-3.5 font-bold whitespace-nowrap text-center">Order Status</th>
                  <th className="px-4 py-3.5 font-bold whitespace-nowrap text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-neutral-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-[#5C0F17] whitespace-nowrap">
                      <Link
                        to={`/orders/${o._id || o.orderNumber}`}
                        className="hover:underline flex items-center gap-1 text-[#5C0F17]"
                        title="Open Order Details"
                      >
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 whitespace-nowrap text-[11px]">
                      {o.orderDate
                        ? new Date(o.orderDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-neutral-700 whitespace-nowrap">
                      ₹{o.productValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-neutral-900 whitespace-nowrap">
                      ₹{o.finalOrderAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold whitespace-nowrap">
                      <span className={o.customerPaid > 0 ? "text-emerald-700" : "text-amber-700"}>
                        {o.customerPaid > 0
                          ? `₹${o.customerPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                          : "₹0.00 (Unpaid)"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${getPaymentStatusBadge(
                          o.paymentStatus
                        )}`}
                      >
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getOrderStatusBadge(
                          o.orderStatus
                        )}`}
                      >
                        {o.orderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link
                        to={`/orders/${o._id || o.orderNumber}`}
                        className="inline-flex items-center gap-1 rounded-xl bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-700 hover:bg-[#5C0F17] hover:text-white transition"
                      >
                        <Eye size={12} /> View Order
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-neutral-400 text-xs">
            <ShoppingBag size={36} className="mx-auto text-neutral-300 mb-2" />
            <p className="font-bold text-neutral-600">No orders placed by this customer yet.</p>
            <p className="text-[11px] mt-0.5">Orders will appear here once the customer checks out.</p>
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* E. Additional Customer Info (Wishlist / Saved Items)         */}
      {/* ============================================================ */}
      {wishlist.items && wishlist.items.length > 0 && (
        <section className="rounded-3xl border border-neutral-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Heart size={16} className="text-[#5C0F17]" />
            <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider">
              Saved Wishlist Items ({wishlist.count})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {wishlist.items.map((prod, idx) => (
              <div
                key={prod._id || idx}
                className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50/50 p-3"
              >
                {prod.images?.[0] ? (
                  <img
                    src={prod.images[0]}
                    alt={prod.name}
                    className="h-12 w-12 rounded-xl object-cover bg-white border border-neutral-200/60"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-200 text-neutral-400">
                    <Package size={18} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-neutral-900">{prod.name}</p>
                  <p className="text-[11px] font-mono font-bold text-[#5C0F17]">
                    ₹{Number(prod.price || 0).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
