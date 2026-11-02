// Centralized Admin API configuration
// In production builds (or Vercel), uses the Render production backend URL.
// In local development, falls back to localhost:5000 or the VITE_API_URL defined in .env.
const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://pujaveda-backend.onrender.com/api"
    : "http://localhost:5000/api")
).replace(/\/+$/, "");

const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem("sonic_admin_token");
  const headers = {};
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const handleAuthError = (res) => {
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("sonic_admin_token");
    localStorage.removeItem("sonic_admin_auth_session");
    if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
  }
};

export const api = {
  async get(endpoint) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      handleAuthError(res);
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  },

  async post(endpoint, body, isMultipart = false) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: getHeaders(isMultipart),
      body: isMultipart ? body : JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      handleAuthError(res);
      const err = new Error(data.message || `Request failed with status ${res.status}`);
      err.errors = data.errors;
      err.fieldErrors =
        data.errors && typeof data.errors === "object" && !Array.isArray(data.errors)
          ? data.errors
          : {};
      err.devOtp = data.devOtp;
      throw err;
    }
    return data;
  },

  async put(endpoint, body) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      handleAuthError(res);
      const err = new Error(data.message || `Request failed with status ${res.status}`);
      err.errors = data.errors;
      err.fieldErrors =
        data.errors && typeof data.errors === "object" && !Array.isArray(data.errors)
          ? data.errors
          : {};
      err.devOtp = data.devOtp;
      throw err;
    }
    return data;
  },

  async patch(endpoint, body) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      handleAuthError(res);
      const err = new Error(data.message || `Request failed with status ${res.status}`);
      err.errors = data.errors;
      err.fieldErrors =
        data.errors && typeof data.errors === "object" && !Array.isArray(data.errors)
          ? data.errors
          : {};
      err.devOtp = data.devOtp;
      throw err;
    }
    return data;
  },

  async delete(endpoint) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      handleAuthError(res);
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  },
};
