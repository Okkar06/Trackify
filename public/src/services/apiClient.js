import axios from "axios";

const defaultApiBaseUrl = import.meta.env.DEV ? "http://localhost:4000" : window.location.origin;
const apiBaseUrl = (import.meta.env.VITE_API_URL || defaultApiBaseUrl).replace(/\/$/, "");

export const apiClient = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  timeout: 15000,
});

const SESSION_KEY = "trackify_session";

export const getAccessToken = () => {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return String(parsed?.access_token || "").trim();
  } catch {
    return "";
  }
};

export const setSession = (session) => {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session || {}));
};

export const clearSession = () => {
  window.localStorage.removeItem(SESSION_KEY);
};

export const getMockUserId = () => {
  const stored = window.localStorage.getItem("trackify_mock_user_id");
  if (stored && stored.trim()) return stored.trim();
  return "mock-user";
};

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  }

  const useMockUser = String(import.meta.env.VITE_USE_MOCK_USER || "").toLowerCase() === "true";
  if (useMockUser) {
    const mockUserId = getMockUserId();
    if (mockUserId) {
      config.headers = config.headers || {};
      config.headers["x-user-id"] = mockUserId;
    }
  }

  return config;
});
