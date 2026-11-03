import { api } from "./api";

export const legalService = {
  async getAll() {
    const res = await api.get("/legal/admin/all");
    return res.data?.pages || res.pages || [];
  },

  async getBySlug(slug) {
    const res = await api.get(`/legal/admin/${slug}`);
    return res.data?.page || res.page;
  },

  async update(slug, { title, content, isPublished }) {
    const res = await api.put(`/legal/admin/${slug}`, {
      title,
      content,
      isPublished,
    });
    return res.data?.page || res.page;
  },
};

