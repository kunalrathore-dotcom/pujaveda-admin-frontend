import { api } from "./api";

export const earningsService = {
  /**
   * Fetches real-time financial summary aggregated from MongoDB.
   */
  async getSummary(filters = {}) {
    const params = new URLSearchParams();
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    const queryString = params.toString();
    const endpoint = `/admin/earnings/summary${queryString ? `?${queryString}` : ""}`;
    return api.get(endpoint);
  },

  /**
   * Fetches paginated recent orders with complete financial breakdown.
   */
  async getOrders(paramsObj = {}) {
    const params = new URLSearchParams();
    if (paramsObj.page) params.append("page", paramsObj.page);
    if (paramsObj.limit) params.append("limit", paramsObj.limit);
    if (paramsObj.search && paramsObj.search.trim()) params.append("search", paramsObj.search.trim());
    if (paramsObj.paymentStatus && paramsObj.paymentStatus !== "all") params.append("paymentStatus", paramsObj.paymentStatus);
    if (paramsObj.orderStatus && paramsObj.orderStatus !== "all") params.append("orderStatus", paramsObj.orderStatus);
    if (paramsObj.startDate) params.append("startDate", paramsObj.startDate);
    if (paramsObj.endDate) params.append("endDate", paramsObj.endDate);
    const queryString = params.toString();
    const endpoint = `/admin/earnings/orders${queryString ? `?${queryString}` : ""}`;
    return api.get(endpoint);
  },

  /**
   * Fetches chronological chart points starting from reference date/month/year.
   */
  async getChart(paramsObj = {}) {
    const params = new URLSearchParams();
    if (paramsObj.mode) params.append("mode", paramsObj.mode);
    if (paramsObj.date) params.append("date", paramsObj.date);
    if (paramsObj.metric) params.append("metric", paramsObj.metric);
    const queryString = params.toString();
    const endpoint = `/admin/earnings/chart${queryString ? `?${queryString}` : ""}`;
    return api.get(endpoint);
  },
};
