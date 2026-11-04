/**
 * Utility to resolve and normalize image URLs across environments.
 * Ensures relative upload paths and legacy localhost links resolve to the active backend.
 */
export const resolveImageUrl = (url, fallback = "") => {
  if (!url || typeof url !== "string") return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;

  // External full URLs (Unsplash, HTTPS CDNs, etc.)
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    if (
      trimmed.includes("localhost:5000/uploads/") ||
      trimmed.includes("localhost:5001/uploads/") ||
      trimmed.includes("localhost:10000/uploads/") ||
      trimmed.includes("127.0.0.1:5000/uploads/") ||
      trimmed.includes("127.0.0.1:5001/uploads/")
    ) {
      const filename = trimmed.split("/uploads/")[1]?.split("?")[0];
      const backendBase = (
        import.meta.env.VITE_API_URL ||
        (import.meta.env.PROD
          ? "https://pujaveda-backend.onrender.com/api"
          : "http://localhost:5001/api")
      ).replace(/\/api\/?$/, "");
      return `${backendBase}/uploads/${filename}`;
    }
    return trimmed;
  }

  // Relative upload paths (/uploads/... or uploads/...)
  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("uploads/")) {
    const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    const backendBase = (
      import.meta.env.VITE_API_URL ||
      (import.meta.env.PROD
        ? "https://pujaveda-backend.onrender.com/api"
        : "http://localhost:5001/api")
    ).replace(/\/api\/?$/, "");
    return `${backendBase}${cleanPath}`;
  }

  return trimmed;
};
