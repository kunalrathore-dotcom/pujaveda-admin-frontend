import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { adminAuthService } from "../services/adminAuthService";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(() => adminAuthService.getSession());
  const [loading, setLoading] = useState(Boolean(adminAuthService.getToken()));

  useEffect(() => {
    let isMounted = true;
    const token = adminAuthService.getToken();

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    adminAuthService
      .getMe()
      .then((verifiedAdmin) => {
        if (!isMounted) return;
        if (verifiedAdmin && verifiedAdmin.role === "admin") {
          setUser(verifiedAdmin);
        } else {
          adminAuthService.logout();
          setUser(null);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        adminAuthService.logout();
        setUser(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (emailOrCredentials, maybePassword) => {
    const credentials =
      typeof emailOrCredentials === "string"
        ? { email: emailOrCredentials, password: maybePassword }
      : emailOrCredentials;
    setLoading(true);
    try {
      const loggedInAdmin = await adminAuthService.login(credentials);
      setUser(loggedInAdmin);
      return loggedInAdmin;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    adminAuthService.logout();
    setUser(null);
    window.location.reload();
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user && user.role === "admin"),
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used inside AdminAuthProvider.");
  }
  return context;
}
