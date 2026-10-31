import { api } from "./api";

export const auditService = {
  async getLogs(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.category && params.category !== "all") query.append("category", params.category);
    if (params.eventType && params.eventType !== "all") query.append("eventType", params.eventType);
    if (params.userId) query.append("userId", params.userId);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return api.get(`/audit/logs${queryString}`);
  },

  async getStats() {
    return api.get("/audit/stats");
  },

  async getUserTimeline(userId, params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return api.get(`/audit/user/${userId}${queryString}`);
  },
};

