import { api } from "./api";

export const BLOG_CATEGORIES = [
  "Puja Guides",
  "Festival Guides",
  "Product Knowledge",
  "Home Mandir Ideas",
  "Spiritual Lifestyle",
];

export const blogService = {
  async getAll({ page = 1, limit = 10, search = "", category = "", status = "all" } = {}) {
    const params = new URLSearchParams();
    if (page) params.append("page", String(page));
    if (limit) params.append("limit", String(limit));
    if (search && search.trim()) params.append("search", search.trim());
    if (category && category.trim()) params.append("category", category.trim());
    if (status && status !== "all") params.append("status", status);

    const qs = params.toString();
    const data = await api.get(`/admin/blog${qs ? `?${qs}` : ""}`);
    return data;
  },

  async getById(id) {
    const data = await api.get(`/admin/blog/${id}`);
    return data.article;
  },

  async create(articleData) {
    const data = await api.post("/admin/blog", articleData);
    return data;
  },

  async update(id, articleData) {
    const data = await api.put(`/admin/blog/${id}`, articleData);
    return data;
  },

  async updateStatus(id, status) {
    const data = await api.patch(`/admin/blog/${id}/status`, { status });
    return data;
  },

  async delete(id) {
    const data = await api.delete(`/admin/blog/${id}`);
    return data;
  },

  async getCategories() {
    const data = await api.get("/blog/categories");
    return data.categories || [];
  },
};

export default blogService;

