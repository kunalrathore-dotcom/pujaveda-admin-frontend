import { api } from "./api";

export const promotionalSectionService = {
  async getAll({ isDeleted = "false" } = {}) {
    const params = new URLSearchParams();
    if (isDeleted && isDeleted !== "false") params.append("isDeleted", isDeleted);
    const qs = params.toString();
    const data = await api.get(`/content/divine-cards/all${qs ? `?${qs}` : ""}`);
    return data.cards || [];
  },

  async create(payload) {
    const data = await api.post("/content/divine-cards", payload);
    return data.card;
  },

  async update(id, payload) {
    const data = await api.put(`/content/divine-cards/${id}`, payload);
    return data.card;
  },

  async delete(id) {
    return api.delete(`/content/divine-cards/${id}`);
  },

  async restore(id) {
    return api.put(`/content/divine-cards/${id}/restore`);
  },
};

