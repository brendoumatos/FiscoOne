import adminApi from "./adminApi";

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

export const adminService = {
  async login(payload: { email: string; password: string; mfaCode: string }) {
    const { data } = await adminApi.post("/login", payload);
    localStorage.setItem("fiscoone_admin_token", data.token);
    localStorage.setItem("fiscoone_admin_refresh", data.refreshToken);
    localStorage.setItem("fiscoone_admin_user", JSON.stringify(data.admin));
    return data;
  },

  async refresh() {
    const refresh = localStorage.getItem("fiscoone_admin_refresh");
    if (!refresh) return null;
    const { data } = await adminApi.post("/refresh", { refreshToken: refresh });
    localStorage.setItem("fiscoone_admin_token", data.token);
    return data.token as string;
  },

  logout() {
    localStorage.removeItem("fiscoone_admin_token");
    localStorage.removeItem("fiscoone_admin_refresh");
    localStorage.removeItem("fiscoone_admin_user");
  },

  async getOverview() {
    const { data } = await adminApi.get("/metrics/overview");
    return data;
  },

  async getCompanies() {
    const { data } = await adminApi.get("/companies");
    return data.companies;
  },

  async updateCompanyStatus(companyId: string, status: string) {
    const { data } = await adminApi.patch(`/companies/${companyId}/status`, { status });
    return data.subscription;
  },

  async getPlans() {
    const { data } = await adminApi.get("/plans");
    return data.plans;
  },

  async savePlan(plan: any) {
    if (plan.id) {
      const { data } = await adminApi.put(`/plans/${plan.id}`, plan);
      return data.plan;
    }
    const { data } = await adminApi.post("/plans", plan);
    return data.plan;
  },

  async getSeats() {
    const { data } = await adminApi.get("/users/seats");
    return data.seats;
  },

  async getAuditLogs() {
    const { data } = await adminApi.get("/audit");
    return data.logs;
  },

  async getImpersonationSessions() {
    const { data } = await adminApi.get("/impersonation/sessions");
    return data.sessions;
  },

  async startImpersonation(payload: { companyId: string; userId?: string; reason?: string }) {
    const { data } = await adminApi.post("/impersonate", payload);
    return data;
  },

  async stopImpersonation(sessionId: string) {
    const { data } = await adminApi.post("/impersonate/exit", { sessionId });
    return data;
  },
};
