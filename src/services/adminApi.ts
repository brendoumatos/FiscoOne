import axios from "axios";

// Dedicated axios instance for admin console to avoid clashing with tenant session tokens
const adminApi = axios.create({
  baseURL: "http://localhost:3001/admin",
  headers: { "Content-Type": "application/json" },
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("fiscoone_admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("fiscoone_admin_token");
      localStorage.removeItem("fiscoone_admin_refresh");
      localStorage.removeItem("fiscoone_admin_user");
    }
    return Promise.reject(error);
  }
);

export default adminApi;
