import { api } from "./api";

const TOKEN_KEY = "sonic_admin_token";
const SESSION_KEY = "sonic_admin_auth_session";

export const adminAuthService = {
  async login({ email, password }) {
    const data = await api.post("/auth/admin-login", { email, password });
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
    }
    return data.user;
  },

  getSession() {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  async getMe() {
    if (!this.getToken()) return null;
    try {
      const data = await api.get("/auth/me");
      if (data.user && data.user.role === "admin") {
        localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
        return data.user;
      }
    } catch {
      this.logout();
    }
    return null;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
  },

  async forgotPassword(email) {
    return await api.post("/auth/admin-forgot-password", { email });
  },

  async verifyResetOtp(email, otp) {
    return await api.post("/auth/admin-verify-reset-otp", { email, otp });
  },

  async resetPassword({ email, resetToken, password, confirmPassword }) {
    return await api.post("/auth/admin-reset-password", {
      email,
      resetToken,
      password,
      confirmPassword,
    });
  },
};
