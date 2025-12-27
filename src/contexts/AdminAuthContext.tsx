import { createContext, useContext, useEffect, useState } from "react";
import { adminService, type AdminUser } from "@/services/admin";

interface AdminAuthContextType {
  admin: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: { email: string; password: string; mfaCode: string }) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("fiscoone_admin_token");
    const storedAdmin = localStorage.getItem("fiscoone_admin_user");
    if (storedToken && storedAdmin) {
      setToken(storedToken);
      setAdmin(JSON.parse(storedAdmin));
    }
    setIsLoading(false);
  }, []);

  const login = async (payload: { email: string; password: string; mfaCode: string }) => {
    setIsLoading(true);
    try {
      const { token: accessToken, admin: adminUser } = await adminService.login(payload);
      setToken(accessToken);
      setAdmin(adminUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    adminService.logout();
    setToken(null);
    setAdmin(null);
  };

  const refresh = async () => {
    const refreshed = await adminService.refresh();
    if (refreshed) setToken(refreshed);
  };

  return (
    <AdminAuthContext.Provider
      value={{ admin, token, isAuthenticated: Boolean(token), isLoading, login, logout, refresh }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
