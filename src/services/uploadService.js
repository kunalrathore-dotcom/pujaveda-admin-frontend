import { api } from "./api";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const uploadService = {
  async uploadImage(file, folder = "general") {
    if (!file) throw new Error("No file selected.");

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`Only JPG, PNG, and WebP images are allowed. Received: ${file.type}`);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File size cannot exceed 5MB.");
    }

    const formData = new FormData();
    formData.append("image", file);

    const data = await api.post(`/upload?folder=${encodeURIComponent(folder)}`, formData, true);
    return data;
  },

  async uploadMultipleImages(files, folder = "products") {
    if (!files || files.length === 0) throw new Error("No files selected.");

    const fileList = Array.from(files);
    for (const file of fileList) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error(`File '${file.name}' has invalid type '${file.type}'. Only JPG, PNG, and WebP allowed.`);
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File '${file.name}' exceeds the 5MB size limit.`);
      }
    }

    const formData = new FormData();
    fileList.forEach((file) => {
      formData.append("images", file);
    });

    const data = await api.post(`/upload/multiple?folder=${encodeURIComponent(folder)}`, formData, true);
    return data;
  },
};
