import { api } from "./api";

export const MAX_BANNERS = 20;

const broadcastChange = () => {
  localStorage.setItem("sonic_catalog_sync", String(Date.now()));
  window.dispatchEvent(new Event("sonic-catalog-updated"));
};

export const bannerService = {
  async getAll({ isDeleted = "false" } = {}) {
    const params = new URLSearchParams();
    if (isDeleted && isDeleted !== "false") params.append("isDeleted", isDeleted);
    const qs = params.toString();
    const data = await api.get(`/banners/all${qs ? `?${qs}` : ""}`);
    return data.banners || [];
  },

  async create(bannerData) {
    const data = await api.post("/banners", bannerData);
    broadcastChange();
    return data.banner;
  },

  async update(id, changes) {
    const data = await api.put(`/banners/${id}`, changes);
    broadcastChange();
    return data.banner;
  },

  async remove(id) {
    const data = await api.delete(`/banners/${id}`);
    broadcastChange();
    return data.success;
  },

  async restore(id) {
    const data = await api.put(`/banners/${id}/restore`);
    broadcastChange();
    return data.success;
  },
};
