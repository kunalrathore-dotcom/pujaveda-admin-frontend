import { api } from "./api";

export const couponService = {
  async getCoupons(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.discountType && params.discountType !== "all") query.append("discountType", params.discountType);
    if (params.isActive !== undefined && params.isActive !== "all") query.append("isActive", params.isActive);
    if (params.isDeleted && params.isDeleted !== "false") query.append("isDeleted", params.isDeleted);
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return api.get(`/coupons${queryString}`);
  },

  async createCoupon(data) {
    return api.post("/coupons", data);
  },

  async updateCoupon(id, data) {
    return api.put(`/coupons/${id}`, data);
  },

  async toggleStatus(id) {
    return api.patch(`/coupons/${id}/status`);
  },

  async deleteCoupon(id) {
    return api.delete(`/coupons/${id}`);
  },

  async restoreCoupon(id) {
    return api.put(`/coupons/${id}/restore`);
  },

  async bulkTrash(ids) {
    return api.post("/coupons/bulk-trash", { ids });
  },

  async bulkRestore(ids) {
    return api.post("/coupons/bulk-restore", { ids });
  },

  async getCouponUsages(id, params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return api.get(`/coupons/${id}/usages${queryString}`);
  },
};

