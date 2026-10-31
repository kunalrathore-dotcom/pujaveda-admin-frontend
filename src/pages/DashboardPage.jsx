import { useEffect, useState } from "react";
import {
  Package,
  ShoppingBag,
  Users,
  IndianRupee,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { api } from "../services/api";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [orderStatusCounts, setOrderStatusCounts] = useState({
    Pending: 0,
    Processing: 0,
    Delivered: 0,
    Cancelled: 0,
  });
  const [salesByDate, setSalesByDate] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = () => {
    setLoading(true);
    setError(null);

    api
      .get("/admin/dashboard")
      .then((data) => {
        if (data.stats) {
          setStats(data.stats);
        }
        if (data.recentOrders) {
          setRecentOrders(data.recentOrders);
        }
        if (data.lowStockProducts) {
          setLowStockProducts(data.lowStockProducts);
        }
        if (data.orderStatusCounts) {
          setOrderStatusCounts(data.orderStatusCounts);
        }
        if (data.salesByDate) {
          setSalesByDate(data.salesByDate);
        }
      })
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
        setError(err.message || "Failed to load dashboard metrics from MongoDB Atlas.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const statCards = [
    {
      label: "Total Products",
      value: stats.totalProducts.toLocaleString("en-IN"),
      subtext: stats.totalProducts > 0 ? "Actual documents in MongoDB" : "No products in database",
      icon: Package,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders.toLocaleString("en-IN"),
      subtext: stats.totalOrders > 0 ? "Actual customer orders" : "No orders placed yet",
      icon: ShoppingBag,
      color: "bg-rose-50 text-rose-600",
    },
    {
      label: "Registered Customers",
      value: stats.totalCustomers.toLocaleString("en-IN"),
      subtext: stats.totalCustomers > 0 ? "Active user accounts" : "No registered customers yet",
      icon: Users,
      color: "bg-violet-50 text-violet-600",
    },
    {
      label: "Eligible Revenue",
      value: `₹${Number(stats.totalRevenue).toLocaleString("en-IN")}`,
      subtext: "Aggregated from paid, non-cancelled orders",
      icon: IndianRupee,
      color: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Real-time ecommerce analytics directly aggregated from your MongoDB database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchDashboard}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            MongoDB Connected
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchDashboard}
            className="rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#5C0F17] border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Real Metrics Cards */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map(({ label, value, subtext, icon: Icon, color }) => (
              <article
                key={label}
                className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
                    <Icon size={21} />
                  </span>
                  <ArrowUpRight size={18} className="text-neutral-300" />
                </div>

                <p className="mt-5 text-sm font-medium text-neutral-500">{label}</p>
                <p className="mt-1 text-2xl font-black text-neutral-900">{value}</p>
                <p className="mt-2 text-xs text-neutral-400">{subtext}</p>
              </article>
            ))}
          </section>

          {/* Order Status Breakdown */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <p className="text-xs font-medium text-neutral-500">Pending Orders</p>
              <p className="mt-1 text-xl font-black text-amber-600">{orderStatusCounts.Pending || 0}</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <p className="text-xs font-medium text-neutral-500">Processing Orders</p>
              <p className="mt-1 text-xl font-black text-blue-600">{orderStatusCounts.Processing || 0}</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <p className="text-xs font-medium text-neutral-500">Delivered Orders</p>
              <p className="mt-1 text-xl font-black text-emerald-600">{orderStatusCounts.Delivered || 0}</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <p className="text-xs font-medium text-neutral-500">Cancelled Orders</p>
              <p className="mt-1 text-xl font-black text-neutral-400">{orderStatusCounts.Cancelled || 0}</p>
            </div>
          </section>

          {/* Low Stock Alerts (Live Inventory) */}
          {lowStockProducts.length > 0 && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-600" />
                <h2 className="font-extrabold text-amber-900">Low Stock Alerts (Inventory ≤ 10)</h2>
              </div>
              <p className="mt-1 text-xs text-amber-700">
                The following products in your catalog require restocking.
              </p>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {lowStockProducts.map((p) => (
                  <div
                    key={p._id || p.slug}
                    className="flex items-center justify-between rounded-xl border border-amber-200/80 bg-white p-3 shadow-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="truncate text-xs font-bold text-neutral-900">{p.name}</p>
                      <p className="text-[10px] text-neutral-400">₹{Number(p.price).toLocaleString("en-IN")}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-black ${
                        p.stock === 0 ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {p.stock === 0 ? "Out of Stock" : `${p.stock} left`}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent Orders Section */}
          <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 p-5">
              <div>
                <h2 className="font-extrabold text-neutral-900">Recent Customer Orders</h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Live order stream from database
                </p>
              </div>
              <span className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-600">
                {recentOrders.length} order(s) shown
              </span>
            </div>

            {recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                    <tr>
                      <th className="px-5 py-4 font-bold">Order ID</th>
                      <th className="px-5 py-4 font-bold">Customer</th>
                      <th className="px-5 py-4 font-bold">Amount</th>
                      <th className="px-5 py-4 font-bold">Date</th>
                      <th className="px-5 py-4 font-bold">Payment</th>
                      <th className="px-5 py-4 font-bold">Order Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-neutral-100">
                    {recentOrders.map((order) => (
                      <tr key={order._id || order.id} className="hover:bg-neutral-50">
                        <td className="px-5 py-4 font-bold text-neutral-900">
                          {order.orderNumber || order.id}
                        </td>
                        <td className="px-5 py-4 text-neutral-700">
                          {order.customerDetails?.name || order.customer || "Customer"}
                        </td>
                        <td className="px-5 py-4 font-bold text-neutral-900">
                          ₹{Number(order.totalAmount || order.amount).toLocaleString("en-IN")}
                        </td>
                        <td className="px-5 py-4 text-xs text-neutral-400">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 text-xs">
                          <span className="font-semibold uppercase text-neutral-700">{order.paymentMethod}</span>
                          <span
                            className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              order.paymentStatus === "paid"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                              order.orderStatus === "Delivered"
                                ? "bg-emerald-50 text-emerald-700"
                                : order.orderStatus === "Processing"
                                  ? "bg-blue-50 text-blue-700"
                                  : order.orderStatus === "Cancelled"
                                    ? "bg-neutral-100 text-neutral-600"
                                    : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {order.orderStatus === "Delivered" && <CheckCircle2 size={13} />}
                            {order.orderStatus === "Processing" && <Clock size={13} />}
                            {order.orderStatus === "Pending" && <AlertCircle size={13} />}
                            {order.orderStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <ShoppingBag size={40} className="mx-auto text-neutral-300" />
                <h3 className="mt-3 text-base font-bold text-neutral-700">No orders placed yet</h3>
                <p className="mt-1 text-xs text-neutral-400">
                  When customers purchase products in the store, their orders will appear here automatically.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
