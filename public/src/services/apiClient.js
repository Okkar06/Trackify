import axios from "axios";

const apiBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");

export const apiClient = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  timeout: 15000,
});

export const getMockUserId = () => {
  const stored = window.localStorage.getItem("trackify_mock_user_id");
  if (stored && stored.trim()) return stored.trim();
  return "mock-user";
};

export const withMockUser = () => {
  return {
    headers: {
      "x-user-id": getMockUserId(),
    },
  };
};

