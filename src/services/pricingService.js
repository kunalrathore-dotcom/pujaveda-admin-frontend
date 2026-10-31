import { api } from "./api";

export const pricingService = {
  async getAllCharges({ isDeleted = "false" } = {}) {
    const params = new URLSearchParams();
    if (isDeleted && isDeleted !== "false") params.append("isDeleted", isDeleted);
    const qs = params.toString();
    return api.get(`/pricing-charges${qs ? `?${qs}` : ""}`);
  },

  async createCharge(data) {
    return api.post("/pricing-charges", data);
  },

  async updateCharge(id, data) {
    return api.put(`/pricing-charges/${id}`, data);
  },

  async toggleChargeStatus(id) {
    return api.patch(`/pricing-charges/${id}/status`);
  },

  async deleteCharge(id) {
    return api.delete(`/pricing-charges/${id}`);
  },

  async restoreCharge(id) {
    return api.put(`/pricing-charges/${id}/restore`);
  },
};

