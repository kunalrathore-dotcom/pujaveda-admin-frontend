import { api } from "./api";

const broadcastChange = () => {
  localStorage.setItem("sonic_catalog_sync", String(Date.now()));
  window.dispatchEvent(new Event("sonic-catalog-updated"));
};

export const productService = {
  async getAll({ search = "", categoryId = "all", isDeleted = "false" } = {}) {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append("search", search.trim());
    if (categoryId && categoryId !== "all") params.append("categoryId", categoryId);
    if (isDeleted && isDeleted !== "false") params.append("isDeleted", isDeleted);
    params.append("isPublished", "all");

    const qs = params.toString();
    const endpoint = `/products${qs ? `?${qs}` : ""}`;

    const data = await api.get(endpoint);
    return data.products || [];
  },

  async getById(id) {
    const data = await api.get(`/products/${id}`);
    return data.product;
  },

  async create(productData) {
    const data = await api.post("/products", productData);
    broadcastChange();
    return data.product;
  },

  async update(id, changes) {
    const data = await api.put(`/products/${id}`, changes);
    broadcastChange();
    return data.product;
  },

  async remove(id) {
    const data = await api.delete(`/products/${id}`);
    broadcastChange();
    return data.success;
  },

  async restore(id) {
    const data = await api.put(`/products/${id}/restore`);
    broadcastChange();
    return data.success;
  },

  async bulkTrash(ids) {
    const data = await api.post("/products/bulk-trash", { ids });
    broadcastChange();
    return data.success;
  },

  async bulkRestore(ids) {
    const data = await api.post("/products/bulk-restore", { ids });
    broadcastChange();
    return data.success;
  },
};
