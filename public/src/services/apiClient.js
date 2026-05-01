import axios from "axios";
import { useServerWakeStore } from "@/stores/serverWakeStore";

const defaultApiBaseUrl = import.meta.env.DEV ? "http://localhost:4000" : window.location.origin;
const apiBaseUrl = (import.meta.env.VITE_API_URL || defaultApiBaseUrl).replace(/\/$/, "");

export const apiClient = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  timeout: 60000,
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

let wakeShowTimer = null;
let wakeTimeoutTimer = null;

const scheduleWakeTimers = () => {
  if (wakeShowTimer || wakeTimeoutTimer) return;
  const state = useServerWakeStore.getState();

  wakeShowTimer = window.setTimeout(() => {
    if (useServerWakeStore.getState().inFlight > 0) useServerWakeStore.getState().openLoading();
  }, state.showAfterMs);

  wakeTimeoutTimer = window.setTimeout(() => {
    if (useServerWakeStore.getState().inFlight > 0) {
      useServerWakeStore.getState().openTimeout("Server is taking longer than expected. Please try again.");
    }
  }, state.timeoutMs);
};

const clearWakeTimers = () => {
  if (wakeShowTimer) {
    window.clearTimeout(wakeShowTimer);
    wakeShowTimer = null;
  }
  if (wakeTimeoutTimer) {
    window.clearTimeout(wakeTimeoutTimer);
    wakeTimeoutTimer = null;
  }
};

apiClient.interceptors.request.use((config) => {
  useServerWakeStore.getState().requestStarted();
  scheduleWakeTimers();

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

apiClient.interceptors.response.use(
  (response) => {
    useServerWakeStore.getState().requestFinished();
    if (useServerWakeStore.getState().inFlight === 0) clearWakeTimers();
    return response;
  },
  (error) => {
    useServerWakeStore.getState().requestFinished();
    if (useServerWakeStore.getState().inFlight === 0) clearWakeTimers();

    const isTimeout =
      error?.code === "ECONNABORTED" ||
      String(error?.message || "").toLowerCase().includes("timeout") ||
      error?.name === "AxiosError" && error?.message === "timeout of 60000ms exceeded";

    if (isTimeout) {
      useServerWakeStore.getState().openTimeout("Server is taking longer than expected. Please try again.");
    }

    return Promise.reject(error);
  }
);
