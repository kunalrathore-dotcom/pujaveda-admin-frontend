import { api } from "./api";

const broadcastChange = () => {
  localStorage.setItem("sonic_catalog_sync", String(Date.now()));
  window.dispatchEvent(new Event("sonic-catalog-updated"));
};

export const categoryService = {
  async getAll({ isDeleted = "false" } = {}) {
    const params = new URLSearchParams();
    params.append("all", "true");
    if (isDeleted && isDeleted !== "false") params.append("isDeleted", isDeleted);

    const data = await api.get(`/categories?${params.toString()}`);
    const categories = data.categories || [];
    return categories.map((cat) => ({
      ...cat,
      id: cat._id || cat.id,
      subcategories: (cat.subcategories || []).map((sub) => ({
        ...sub,
        id: sub._id || sub.id,
      })),
    }));
  },

  async create({ name, image, imageId }) {
    const data = await api.post("/categories", { name, image, imageId });
    broadcastChange();
    const cat = data.category;
    return {
      ...cat,
      id: cat._id || cat.id,
      subcategories: (cat.subcategories || []).map((sub) => ({
        ...sub,
        id: sub._id || sub.id,
      })),
    };
  },

  async update(id, changes) {
    const data = await api.put(`/categories/${id}`, changes);
    broadcastChange();
    const cat = data.category;
    return {
      ...cat,
      id: cat._id || cat.id,
      subcategories: (cat.subcategories || []).map((sub) => ({
        ...sub,
        id: sub._id || sub.id,
      })),
    };
  },

  async remove(id) {
    const data = await api.delete(`/categories/${id}`);
    broadcastChange();
    return data.success;
  },

  async restore(id) {
    const data = await api.put(`/categories/${id}/restore`);
    broadcastChange();
    return data.success;
  },

  async createSubcategory(categoryId, { name }) {
    const data = await api.post(`/categories/${categoryId}/subcategories`, { name });
    broadcastChange();
    return data.subcategory;
  },

  async updateSubcategory(categoryId, subcategoryId, { name }) {
    const data = await api.put(`/categories/${categoryId}/subcategories/${subcategoryId}`, { name });
    broadcastChange();
    return data.subcategory;
  },

  async removeSubcategory(categoryId, subcategoryId) {
    const data = await api.delete(`/categories/${categoryId}/subcategories/${subcategoryId}`);
    broadcastChange();
    return data.success;
  },

  async restoreSubcategory(categoryId, subcategoryId) {
    const data = await api.put(`/categories/${categoryId}/subcategories/${subcategoryId}/restore`);
    broadcastChange();
    return data.success;
  },

  async bulkTrash(ids) {
    const data = await api.post("/categories/bulk-trash", { ids });
    broadcastChange();
    return data.success;
  },

  async bulkRestore(ids) {
    const data = await api.post("/categories/bulk-restore", { ids });
    broadcastChange();
    return data.success;
  },

  async bulkTrashSubcategories(items) {
    const data = await api.post("/categories/subcategories/bulk-trash", { items });
    broadcastChange();
    return data.success;
  },

  async bulkRestoreSubcategories(items) {
    const data = await api.post("/categories/subcategories/bulk-restore", { items });
    broadcastChange();
    return data.success;
  },
};
