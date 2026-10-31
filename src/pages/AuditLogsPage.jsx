import { useEffect, useState } from "react";
import {
  History,
  Users,
  UserCheck,
  UserPlus,
  LogIn,
  Activity,
  Search,
  Filter,
  RefreshCw,
  Clock,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShoppingCart,
  Eye,
  Tag,
  CreditCard,
  Key,
  Calendar,
} from "lucide-react";
import { auditService } from "../services/auditService";

const inputClass =
  "rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#5C0F17] focus:ring-2 focus:ring-[#5C0F17]/10";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalRegisteredUsers: 0,
    usersLoggedInToday: 0,
    registrationsToday: 0,
    loginEventsToday: 0,
    activityEventsToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [eventType, setEventType] = useState("all");
  const [dateFilter, setDateFilter] = useState("all"); // all, today, 7days, 30days
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // User Timeline Modal State
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userTimeline, setUserTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineTotal, setTimelineTotal] = useState(0);
  const [timelinePage, setTimelinePage] = useState(1);
  const [timelineTotalPages, setTimelineTotalPages] = useState(1);

  const getDateRange = () => {
    const now = new Date();
    if (dateFilter === "today") {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { startDate: today.toISOString(), endDate: now.toISOString() };
    }
    if (dateFilter === "7days") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return { startDate: d.toISOString(), endDate: now.toISOString() };
    }
    if (dateFilter === "30days") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return { startDate: d.toISOString(), endDate: now.toISOString() };
    }
    return {};
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const res = await auditService.getStats();
      if (res.success && res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error("Load audit stats error:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError("");
      const { startDate, endDate } = getDateRange();
      const res = await auditService.getLogs({
        search,
        category,
        eventType,
        startDate,
        endDate,
        page,
        limit: 20,
      });

      if (res.success && res.data) {
        setLogs(res.data.logs || []);
        setTotalPages(res.data.pages || 1);
        setTotalCount(res.data.total || 0);
      }
    } catch (err) {
      console.error("Load audit logs error:", err);
      setError(err.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [category, eventType, dateFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const handleResetFilters = () => {
    setSearch("");
    setCategory("all");
    setEventType("all");
    setDateFilter("all");
    setPage(1);
  };

  const openUserTimeline = async (userId, userFallback = null) => {
    if (!userId) return;
    try {
      setTimelineModalOpen(true);
      setTimelineLoading(true);
      setTimelinePage(1);

      const res = await auditService.getUserTimeline(userId, { page: 1, limit: 50 });
      if (res.success && res.data) {
        setSelectedUser(res.data.user || userFallback || { _id: userId });
        setUserTimeline(res.data.timeline || []);
        setTimelineTotal(res.data.total || 0);
        setTimelineTotalPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error("User timeline error:", err);
      alert(err.message || "Failed to load user activity timeline.");
      setTimelineModalOpen(false);
    } finally {
      setTimelineLoading(false);
    }
  };

  const getEventBadgeClass = (cat, evt) => {
    if (evt?.includes("FAIL") || evt?.includes("REVOKED")) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    switch (cat) {
      case "auth":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "shopping":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "product":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "account":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-200";
    }
  };

  const getEventIcon = (cat, evt) => {
    if (evt?.includes("LOGIN") || evt?.includes("REGISTER") || evt?.includes("LOGOUT")) {
      return <LogIn size={14} />;
    }
    if (evt?.includes("COUPON")) {
      return <Tag size={14} />;
    }
    if (evt?.includes("ORDER") || evt?.includes("PAYMENT")) {
      return <CreditCard size={14} />;
    }
    if (evt?.includes("CART")) {
      return <ShoppingCart size={14} />;
    }
    if (evt?.includes("PRODUCT")) {
      return <Eye size={14} />;
    }
    return <Activity size={14} />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-neutral-900">
              Audit Logs
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              <History size={13} /> Live Ledger
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Real-time audit log tracking authentication, product views, cart modifications, coupon usage, and checkout payments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              loadStats();
              loadLogs();
            }}
            disabled={loading || statsLoading}
            className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading || statsLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium">Total Registered</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <Users size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-neutral-900">
            {statsLoading ? "..." : stats.totalRegisteredUsers.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-neutral-400">Total customer accounts</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium">Users Logged In Today</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <UserCheck size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-neutral-900">
            {statsLoading ? "..." : stats.usersLoggedInToday.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-neutral-400">Unique active visitors today</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium">Registrations Today</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <UserPlus size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-neutral-900">
            {statsLoading ? "..." : stats.registrationsToday.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-neutral-400">New signups today</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium">Total Logins Today</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <LogIn size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-neutral-900">
            {statsLoading ? "..." : stats.loginEventsToday.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-neutral-400">Session authentications</p>
        </div>

        <div className="col-span-2 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:col-span-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium">Activities Today</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-[#5C0F17]">
              <Activity size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-neutral-900">
            {statsLoading ? "..." : stats.activityEventsToday.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-neutral-400">Total actions recorded</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user name, email, IP, action, or metadata..."
              className={`${inputClass} w-full pl-10`}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:items-center">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="all">All Categories</option>
              <option value="auth">Authentication</option>
              <option value="shopping">Shopping & Orders</option>
              <option value="product">Product & Wishlist</option>
              <option value="account">Account & Profile</option>
              <option value="system">System</option>
            </select>

            <select
              value={eventType}
              onChange={(e) => {
                setEventType(e.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="all">All Event Types</option>
              <option value="USER_REGISTERED">User Registered</option>
              <option value="USER_LOGGED_IN">User Logged In</option>
              <option value="USER_LOGGED_OUT">User Logged Out</option>
              <option value="LOGIN_FAILED">Login Failed</option>
              <option value="PRODUCT_VIEWED">Product Viewed</option>
              <option value="CART_ITEM_ADDED">Added to Cart</option>
              <option value="CART_ITEM_REMOVED">Removed from Cart</option>
              <option value="COUPON_APPLIED">Coupon Applied</option>
              <option value="COUPON_REMOVED">Coupon Removed</option>
              <option value="CHECKOUT_INITIATED">Checkout Initiated</option>
              <option value="ORDER_PLACED">Order Placed</option>
              <option value="PAYMENT_SUCCEEDED">Payment Succeeded</option>
              <option value="PAYMENT_FAILED">Payment Failed</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>

            <div className="col-span-2 flex gap-2 sm:col-span-3 lg:col-span-1">
              <button
                type="submit"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Search
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-xl border border-neutral-200 px-3 py-2.5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-50"
              >
                Reset
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50/70 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Event Type</th>
                <th className="px-5 py-3.5">Activity Description & Metadata</th>
                <th className="px-5 py-3.5">IP & Client</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-neutral-400">
                    <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-[#5C0F17]" />
                    Loading audit records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-neutral-500">
                    No activity logs match the selected criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  return (
                    <tr key={log._id} className="transition hover:bg-neutral-50/60">
                      {/* Timestamp */}
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-neutral-500">
                        <div className="font-medium text-neutral-800">
                          {new Date(log.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <div className="font-mono text-[11px] text-neutral-400">
                          {new Date(log.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* User Info */}
                      <td className="px-5 py-3.5">
                        {log.user ? (
                          <div>
                            <button
                              type="button"
                              onClick={() =>
                                openUserTimeline(log.user, {
                                  _id: log.user,
                                  name: log.userName,
                                  email: log.userEmail,
                                })
                              }
                              className="group flex items-center gap-1 font-semibold text-neutral-900 hover:text-[#5C0F17]"
                            >
                              <span>{log.userName || "Customer"}</span>
                              <ExternalLink size={12} className="opacity-0 group-hover:opacity-100" />
                            </button>
                            <p className="text-xs text-neutral-400">{log.userEmail}</p>
                          </div>
                        ) : (
                          <div>
                            <span className="font-medium text-neutral-700">
                              {log.userName || "Guest / Anonymous"}
                            </span>
                            {log.userEmail && (
                              <p className="text-xs text-neutral-400">{log.userEmail}</p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-semibold capitalize text-neutral-700">
                          {log.category}
                        </span>
                      </td>

                      {/* Event Type Badge */}
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${getEventBadgeClass(
                            log.category,
                            log.eventType
                          )}`}
                        >
                          {getEventIcon(log.category, log.eventType)}
                          {log.eventType}
                        </span>
                      </td>

                      {/* Description & Metadata */}
                      <td className="max-w-xs px-5 py-3.5 text-xs text-neutral-700">
                        <p className="font-medium text-neutral-900">{log.description}</p>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {Object.entries(log.metadata)
                              .filter(([k, v]) => v !== undefined && v !== null && k !== "userAgent")
                              .slice(0, 4)
                              .map(([k, v]) => (
                                <span
                                  key={k}
                                  className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] text-neutral-600"
                                >
                                  {k}: {typeof v === "object" ? JSON.stringify(v) : String(v)}
                                </span>
                              ))}
                          </div>
                        )}
                      </td>

                      {/* IP & Client */}
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-neutral-500">
                        <div className="font-mono text-[11px] text-neutral-700">
                          {log.ipAddress || "—"}
                        </div>
                        <div className="max-w-[120px] truncate text-[11px] text-neutral-400">
                          {log.userAgent || "Browser Client"}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
                        {log.user && (
                          <button
                            type="button"
                            onClick={() =>
                              openUserTimeline(log.user, {
                                _id: log.user,
                                name: log.userName,
                                email: log.userEmail,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                          >
                            <History size={12} />
                            Timeline
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-neutral-200 bg-white px-5 py-3.5 text-xs text-neutral-500">
          <div>
            Showing <span className="font-semibold">{logs.length}</span> of{" "}
            <span className="font-semibold">{totalCount}</span> events
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* User Activity Timeline Modal */}
      {timelineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 p-5">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">
                  User Activity Timeline
                </h3>
                <p className="text-xs text-neutral-500">
                  {selectedUser?.name || "User"} ({selectedUser?.email || "No email"}) •{" "}
                  {timelineTotal} total activities
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTimelineModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content: Vertical Timeline */}
            <div className="flex-1 overflow-y-auto p-5">
              {timelineLoading ? (
                <div className="flex items-center justify-center py-12 text-sm text-neutral-400">
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin text-[#5C0F17]" />
                  Loading timeline...
                </div>
              ) : userTimeline.length === 0 ? (
                <p className="py-8 text-center text-sm text-neutral-500">
                  No activity records logged for this user.
                </p>
              ) : (
                <div className="relative pl-6">
                  {/* Vertical rule line */}
                  <div className="absolute bottom-2 left-2.5 top-2 w-0.5 bg-neutral-200" />

                  <div className="space-y-6">
                    {userTimeline.map((item) => (
                      <div key={item._id} className="relative flex items-start gap-4">
                        {/* Dot */}
                        <div className="absolute -left-6 mt-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#5C0F17] text-white shadow-sm">
                          <div className="h-2 w-2 rounded-full bg-white" />
                        </div>

                        {/* Content Box */}
                        <div className="flex-1 rounded-xl border border-neutral-100 bg-neutral-50 p-3.5">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getEventBadgeClass(
                                item.category,
                                item.eventType
                              )}`}
                            >
                              {item.eventType}
                            </span>
                            <span className="text-[11px] text-neutral-400">
                              {new Date(item.createdAt).toLocaleString("en-IN", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </span>
                          </div>

                          <p className="mt-1.5 text-sm font-medium text-neutral-900">
                            {item.description}
                          </p>

                          {/* Metadata breakdown */}
                          {item.metadata && Object.keys(item.metadata).length > 0 && (
                            <div className="mt-2 rounded-lg bg-white p-2.5 text-xs text-neutral-600 shadow-sm">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                Event Payload Context
                              </p>
                              <div className="mt-1 grid grid-cols-2 gap-1.5">
                                {Object.entries(item.metadata).map(([k, v]) => (
                                  <div key={k} className="font-mono text-[11px]">
                                    <span className="text-neutral-400">{k}: </span>
                                    <span className="font-medium text-neutral-800">
                                      {typeof v === "object" ? JSON.stringify(v) : String(v)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-neutral-100 p-4">
              <button
                type="button"
                onClick={() => setTimelineModalOpen(false)}
                className="rounded-xl bg-neutral-900 px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
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

