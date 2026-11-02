import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Percent,
  Receipt,
  Truck,
  Search,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  ShieldAlert,
  Coins,
} from "lucide-react";
import { earningsService } from "../services/earningsService";

export default function EarningsPage() {
  // --- 1. Summary Cards State ---
  const [summary, setSummary] = useState({
    productValue: 0,
    customerPaid: 0,
    adminFeeEarnings: 0,
    taxesCollected: 0,
    platformFee: 0,
    shippingCollected: 0,
    discountGiven: 0,
    pendingAmount: 0,
    totalOrders: 0,
    collectedOrdersCount: 0,
    pendingOrdersCount: 0,
    failedOrdersCount: 0,
    cancelledOrdersCount: 0,
  });
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(null);

  // Date filters for Summary & Orders
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // --- 2. Recent Orders State ---
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);
  const [search, setSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);

  // --- 3. Earnings Analytics Chart State ---
  const [chartMode, setChartMode] = useState("day"); // 'day' | 'month' | 'year'
  const [chartMetric, setChartMetric] = useState("totalCollected"); // 'totalCollected' | 'adminFeeEarnings' | 'productRevenue' | 'platformFee'
  const [chartDate, setChartDate] = useState("2026-10-31");
  const [chartData, setChartData] = useState({
    points: [],
    hasData: false,
    referenceKey: "",
  });
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // --- Data Fetchers ---
  const fetchSummary = async (start = filterStartDate, end = filterEndDate) => {
    try {
      setSummaryLoading(true);
      setSummaryError(null);
      const res = await earningsService.getSummary({ startDate: start, endDate: end });
      if (res.success && res.summary) {
        setSummary(res.summary);
      }
    } catch (err) {
      console.error("Summary fetch error:", err);
      setSummaryError(err.message || "Failed to load earnings summary from MongoDB.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      const res = await earningsService.getOrders({
        page,
        limit: 10,
        search,
        paymentStatus: paymentStatusFilter,
        orderStatus: orderStatusFilter,
        startDate: filterStartDate,
        endDate: filterEndDate,
      });
      if (res.success) {
        setOrders(res.orders || []);
        setTotalPages(res.pagination?.pages || 1);
        setTotalOrdersCount(res.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Orders fetch error:", err);
      setOrdersError(err.message || "Failed to load recent orders.");
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchChart = async () => {
    try {
      setChartLoading(true);
      setChartError(null);
      const res = await earningsService.getChart({
        mode: chartMode,
        date: chartDate,
        metric: chartMetric,
      });
      if (res.success) {
        setChartData({
          points: res.points || [],
          hasData: res.hasData || false,
          referenceKey: res.referenceKey || "",
        });
      }
    } catch (err) {
      console.error("Chart fetch error:", err);
      setChartError(err.message || "Failed to load earnings chart data.");
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [page, paymentStatusFilter, orderStatusFilter]);

  useEffect(() => {
    fetchChart();
  }, [chartMode, chartDate, chartMetric]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleApplyDateFilters = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSummary();
    fetchOrders();
  };

  const handleResetDateFilters = () => {
    setFilterStartDate("");
    setFilterEndDate("");
    setSearch("");
    setPaymentStatusFilter("all");
    setOrderStatusFilter("all");
    setPage(1);
    fetchSummary("", "");
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

  const maxChartValue = useMemo(() => {
    if (!chartData.points || chartData.points.length === 0) return 100;
    const maxVal = Math.max(...chartData.points.map((p) => p.value || 0));
    return maxVal > 0 ? maxVal * 1.15 : 100;
  }, [chartData.points]);

  return (
    <div className="space-y-8 pb-12">
      {/* ============================================================ */}
      {/* Header                                                       */}
      {/* ============================================================ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Earnings</h1>
          <p className="mt-1 text-xs text-neutral-500 font-medium">
            View your revenue and customer payment history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchSummary();
            fetchOrders();
            fetchChart();
          }}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 shadow-xs transition"
        >
          <RefreshCw size={13} className={summaryLoading || ordersLoading || chartLoading ? "animate-spin" : ""} />
          Refresh Data
        </button>
      </div>

      {summaryError && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-4 text-xs font-semibold text-rose-700 border border-rose-200">
          <AlertCircle size={16} />
          {summaryError}
        </div>
      )}

      {/* ============================================================ */}
      {/* Exactly Two Summary Cards (Screenshot Structure Reference)   */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Card 1: Total Revenue */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 sm:p-6 shadow-xs flex items-center gap-4 transition hover:shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <IndianRupee size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xs font-bold text-neutral-500 block">Total Revenue</span>
            <div className="text-2xl font-black text-neutral-900 font-mono mt-0.5">
              {summaryLoading ? (
                <div className="h-7 w-28 animate-pulse rounded bg-neutral-200" />
              ) : (
                `Rs ${(summary.totalRevenue ?? summary.customerPaid ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
              )}
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Overall amount collected through eligible orders
            </p>
          </div>
        </div>

        {/* Card 2: Today's Revenue */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 sm:p-6 shadow-xs flex items-center gap-4 transition hover:shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#DA9B26]/10 text-[#5C0F17] border border-[#DA9B26]/20">
            <Sparkles size={22} className="text-[#DA9B26]" />
          </div>
          <div>
            <span className="text-xs font-bold text-neutral-500 block">Today's Revenue</span>
            <div className="text-2xl font-black text-neutral-900 font-mono mt-0.5">
              {summaryLoading ? (
                <div className="h-7 w-28 animate-pulse rounded bg-neutral-200" />
              ) : (
                `Rs ${(summary.todayRevenue ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
              )}
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Amount actually collected today (payment date)
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Orders / Transactions Table (Following Screenshot Structure) */}
      {/* ============================================================ */}
      <section className="rounded-3xl border border-neutral-200/80 bg-white shadow-xs overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="border-b border-neutral-100 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base font-black text-neutral-900">Orders & Payment History</h2>
              <p className="text-xs text-neutral-500">
                View customer payment records, product values, collected revenues, and fee earnings.
              </p>
            </div>
            <div className="text-xs font-bold text-neutral-600 bg-neutral-50 border border-neutral-200/70 rounded-xl px-3 py-1.5 self-start">
              Showing Page {page} of {totalPages} ({totalOrdersCount} orders)
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
            <form onSubmit={handleSearchSubmit} className="md:col-span-2 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={15} />
              <input
                type="text"
                maxLength={100}
                placeholder="Search payment id, order #, customer, email, phone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-xs font-medium outline-none focus:border-[#5C0F17] focus:bg-white"
              />
            </form>

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
                <option value="paid">Paid Only</option>
                <option value="pending">Pending Only</option>
                <option value="failed">Failed Only</option>
              </select>
            </div>

            <div>
              <select
                value={orderStatusFilter}
                onChange={(e) => {
                  setOrderStatusFilter(e.target.value);
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
          </div>
        </div>

        {ordersError && (
          <div className="m-5 flex items-center gap-2 rounded-2xl bg-rose-50 p-4 text-xs font-semibold text-rose-700 border border-rose-200">
            <AlertCircle size={16} />
            {ordersError}
          </div>
        )}

        {/* Table Body */}
        {ordersLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#5C0F17] border-t-transparent" />
          </div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-100 bg-[#FAF6F0]/80 text-[#756255]">
                <tr>
                  <th className="px-4 py-3.5 font-bold whitespace-nowrap">S.No</th>
                  <th className="px-4 py-3.5 font-bold whitespace-nowrap">User</th>
                  <th className="px-4 py-3.5 font-bold whitespace-nowrap">Order ID</th>
                  <th className="px-4 py-3.5 font-bold whitespace-nowrap">Transaction ID</th>
                  <th className="px-4 py-3.5 font-bold whitespace-nowrap text-right">Product Value</th>
                  <th className="px-4 py-3.5 font-bold whitespace-nowrap text-right">Customer Paid</th>
                  <th className="px-4 py-3.5 font-bold whitespace-nowrap text-right">Admin Fee Earnings</th>
                  <th className="px-4 py-3.5 font-bold whitespace-nowrap">Purchased Date & Time</th>
                  <th className="px-4 py-3.5 font-bold whitespace-nowrap text-center">Payment Status</th>
                  <th className="px-4 py-3.5 font-bold whitespace-nowrap text-center">Order Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {orders.map((o, idx) => (
                  <tr key={o._id} className="hover:bg-neutral-50/80 transition">
                    <td className="px-4 py-3 font-mono text-neutral-500 whitespace-nowrap">
                      {(page - 1) * 10 + idx + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {o.userId ? (
                        <Link
                          to={`/customers/${o.userId}`}
                          className="font-bold text-[#5C0F17] hover:underline block"
                          title="View Customer Profile"
                        >
                          {o.customerName}
                        </Link>
                      ) : (
                        <span className="font-bold text-neutral-800">{o.customerName}</span>
                      )}
                      <div className="text-[10px] text-neutral-400">{o.customerEmail || o.customerPhone || "N/A"}</div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold whitespace-nowrap">
                      <Link
                        to={`/orders/${o._id || o.orderNumber}`}
                        className="text-neutral-900 hover:text-[#5C0F17] hover:underline"
                        title="View Order Details"
                      >
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px]">
                      {o.transactionId ? (
                        <Link
                          to={`/orders/${o._id || o.orderNumber}`}
                          className="font-semibold text-[#5C0F17] hover:underline bg-[#5C0F17]/5 px-2 py-0.5 rounded-md border border-[#5C0F17]/10"
                          title="View Order Details"
                        >
                          {o.transactionId}
                        </Link>
                      ) : (
                        <span className="text-neutral-400 font-mono">—</span>
                      )}
                    </td>

                    {/* Three Important Financial Values */}
                    <td className="px-4 py-3 text-right font-mono font-bold text-neutral-800 whitespace-nowrap">
                      ₹{o.productValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-black whitespace-nowrap">
                      <span className={o.isCollected ? "text-emerald-700" : "text-amber-700"}>
                        {o.isCollected
                          ? `₹${o.customerPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                          : "₹0.00"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-[#5C0F17] whitespace-nowrap">
                      ₹{o.adminFeeEarnings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-4 py-3 text-neutral-600 whitespace-nowrap text-[11px]">
                      {o.orderDate
                        ? new Date(o.orderDate).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "N/A"}
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getPaymentStatusBadge(
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
              There are currently no orders in the database matching your search or filters.
            </p>
          </div>
        )}

        {/* Table Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-3.5 text-xs font-semibold text-neutral-500">
            <div>
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* 3. Earnings Analytics Chart Section                          */}
      {/* ============================================================ */}
      <section className="rounded-3xl border border-neutral-200/80 bg-white p-5 sm:p-7 shadow-xs space-y-6">
        {/* Chart Header & Controls */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-neutral-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-[#DA9B26]" />
              <h2 className="text-lg font-black text-neutral-900">Earnings Analytics</h2>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Chronological timeline. The selected reference period appears first on the left, followed by subsequent periods to the right.
            </p>
          </div>

          {/* Controls: Mode, Reference Date, Metric */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Mode Switcher */}
            <div className="flex rounded-2xl border border-neutral-200 bg-neutral-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setChartMode("day");
                  setChartDate("2026-10-31");
                }}
                className={`rounded-xl px-3 py-1.5 transition ${
                  chartMode === "day"
                    ? "bg-[#5C0F17] text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Day (7D)
              </button>
              <button
                type="button"
                onClick={() => {
                  setChartMode("month");
                  setChartDate("2026-10");
                }}
                className={`rounded-xl px-3 py-1.5 transition ${
                  chartMode === "month"
                    ? "bg-[#5C0F17] text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Month (12M)
              </button>
              <button
                type="button"
                onClick={() => {
                  setChartMode("year");
                  setChartDate("2026");
                }}
                className={`rounded-xl px-3 py-1.5 transition ${
                  chartMode === "year"
                    ? "bg-[#5C0F17] text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Year (5Y)
              </button>
            </div>

            {/* Reference Period Selector */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700">
              <span className="text-[11px] text-neutral-400">Starting:</span>
              {chartMode === "day" && (
                <input
                  type="date"
                  value={chartDate}
                  onChange={(e) => setChartDate(e.target.value)}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs outline-none focus:border-[#5C0F17]"
                />
              )}
              {chartMode === "month" && (
                <input
                  type="month"
                  value={chartDate.slice(0, 7)}
                  onChange={(e) => setChartDate(e.target.value)}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs outline-none focus:border-[#5C0F17]"
                />
              )}
              {chartMode === "year" && (
                <select
                  value={chartDate.slice(0, 4)}
                  onChange={(e) => setChartDate(e.target.value)}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs outline-none focus:border-[#5C0F17]"
                >
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                  <option value="2029">2029</option>
                  <option value="2030">2030</option>
                </select>
              )}
            </div>

            {/* Metric Selector */}
            <select
              value={chartMetric}
              onChange={(e) => setChartMetric(e.target.value)}
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-bold outline-none focus:border-[#5C0F17]"
            >
              <option value="totalCollected">Metric: Customer Paid (₹)</option>
              <option value="adminFeeEarnings">Metric: Admin Fee Earnings (₹)</option>
              <option value="productRevenue">Metric: Product Value (₹)</option>
              <option value="platformFee">Metric: Platform Fee (₹)</option>
            </select>
          </div>
        </div>

        {chartError && (
          <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-4 text-xs font-semibold text-rose-700 border border-rose-200">
            <AlertCircle size={16} />
            {chartError}
          </div>
        )}

        {/* Chart Visualization */}
        {chartLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#5C0F17] border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Legend & Period Info */}
            <div className="flex flex-wrap items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded-md bg-[#DA9B26] border border-[#B7791F]" />
                  <span className="font-bold text-neutral-800">
                    Selected Reference Period (Point 1)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded-md bg-[#5C0F17]" />
                  <span className="font-medium text-neutral-600">Subsequent Chronological Periods</span>
                </div>
              </div>

              {!chartData.hasData && (
                <div className="rounded-full bg-amber-50 px-3 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                  Zero collections recorded in this window
                </div>
              )}
            </div>

            {/* Responsive Column Bars */}
            <div className="rounded-2xl border border-neutral-100 bg-[#FAF6F0]/40 p-4 sm:p-6">
              <div className="flex h-64 items-end gap-2 sm:gap-4 pt-8">
                {chartData.points.map((pt, idx) => {
                  const heightPercent = maxChartValue > 0 ? Math.min(Math.round((pt.value / maxChartValue) * 100), 100) : 0;
                  const isRef = pt.isReference;

                  return (
                    <div
                      key={pt.key || idx}
                      className="group relative flex flex-1 flex-col items-center justify-end h-full cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      {/* Bar Value Tooltip on Hover */}
                      <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-16 z-30 transition-all duration-150 transform -translate-y-1">
                        <div className="rounded-xl bg-[#2D0A10] px-3 py-2 text-[11px] text-white shadow-xl whitespace-nowrap border border-[#DA9B26]/30">
                          <p className="font-bold text-[#DA9B26]">{pt.fullLabel}</p>
                          <p className="font-mono font-bold text-white">₹{pt.value.toLocaleString("en-IN")}</p>
                          <p className="text-[10px] text-[#FAF5ED]/80">
                            {pt.orderCount} order(s) · {pt.paidOrderCount} collected
                          </p>
                        </div>
                      </div>

                      {/* Top Value Label */}
                      <span className="mb-1 text-[10px] font-mono font-bold text-neutral-600 truncate max-w-full">
                        {pt.value > 0 ? `₹${Math.round(pt.value).toLocaleString("en-IN")}` : "₹0"}
                      </span>

                      {/* Bar Column */}
                      <div className="w-full flex justify-center items-end h-full">
                        <div
                          style={{ height: `${Math.max(heightPercent, 4)}%` }}
                          className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 ${
                            isRef
                              ? "bg-gradient-to-t from-[#B7791F] to-[#DA9B26] border-t-2 border-x-2 border-[#5C0F17] shadow-md ring-2 ring-[#DA9B26]/40"
                              : pt.value > 0
                              ? "bg-gradient-to-t from-[#400B10] to-[#5C0F17] hover:brightness-110"
                              : "bg-neutral-200/70 hover:bg-neutral-300"
                          }`}
                        />
                      </div>

                      {/* Reference Badge for Point 0 */}
                      {isRef && (
                        <div className="absolute -bottom-6">
                          <span className="rounded-md bg-[#5C0F17] px-1.5 py-0.5 text-[9px] font-black uppercase text-[#DA9B26] shadow-xs">
                            Start
                          </span>
                        </div>
                      )}

                      {/* Bottom Label */}
                      <div className="mt-2 text-center">
                        <p className={`text-[11px] whitespace-nowrap ${isRef ? "font-black text-[#5C0F17]" : "font-semibold text-neutral-600"}`}>
                          {pt.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X-Axis Baseline */}
              <div className="mt-8 border-t border-neutral-200/80 pt-3 flex flex-wrap items-center justify-between text-[11px] text-neutral-400">
                <span>Timeline Start: <b>{chartData.points[0]?.fullLabel || "N/A"}</b></span>
                <span>Window End: <b>{chartData.points[chartData.points.length - 1]?.fullLabel || "N/A"}</b></span>
              </div>
            </div>

            {/* Hovered details inspector */}
            {hoveredPoint && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-xs shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-neutral-400">Inspecting Period:</span>{" "}
                  <b className="text-neutral-900">{hoveredPoint.fullLabel}</b>
                  {hoveredPoint.isReference && (
                    <span className="ml-2 rounded-full bg-[#5C0F17] text-[#DA9B26] px-2 py-0.5 text-[10px] font-bold">
                      Reference Period
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-6 font-mono text-xs">
                  <div>
                    <span className="text-neutral-400">Customer Paid:</span>{" "}
                    <b className="text-emerald-700">₹{hoveredPoint.totalCollected.toLocaleString("en-IN")}</b>
                  </div>
                  <div>
                    <span className="text-neutral-400">Admin Fee:</span>{" "}
                    <b className="text-[#5C0F17]">₹{hoveredPoint.adminFeeEarnings.toLocaleString("en-IN")}</b>
                  </div>
                  <div>
                    <span className="text-neutral-400">Product Value:</span>{" "}
                    <b className="text-neutral-800">₹{hoveredPoint.productRevenue.toLocaleString("en-IN")}</b>
                  </div>
                  <div>
                    <span className="text-neutral-400">Orders:</span>{" "}
                    <b className="text-neutral-800">{hoveredPoint.orderCount} placed ({hoveredPoint.paidOrderCount} collected)</b>
                  </div>
                  {hoveredPoint.pendingAmount > 0 && (
                    <div>
                      <span className="text-neutral-400">Pending:</span>{" "}
                      <b className="text-amber-700">₹{hoveredPoint.pendingAmount.toLocaleString("en-IN")}</b>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
