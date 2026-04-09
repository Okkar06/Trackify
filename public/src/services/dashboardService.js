import axios from "axios";

const apiBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");

const client = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  timeout: 15000,
});

const getMockUserId = () => {
  const stored = window.localStorage.getItem("trackify_mock_user_id");
  if (stored && stored.trim()) return stored.trim();
  return "mock-user";
};

const withMockUser = () => {
  return {
    headers: {
      "x-user-id": getMockUserId(),
    },
  };
};

export async function fetchMonthlySummary({ month, year, signal }) {
  const res = await client.get("/dashboard/monthly-summary", {
    ...withMockUser(),
    params: { month, year },
    signal,
  });
  return res.data;
}

export async function fetchCalendarDates({ month, year, signal }) {
  const res = await client.get("/dashboard/calendar", {
    ...withMockUser(),
    params: { month, year },
    signal,
  });
  return res.data;
}

export async function fetchDateDetails({ date, signal }) {
  const res = await client.get(`/dashboard/date/${date}`, {
    ...withMockUser(),
    signal,
  });
  return res.data;
}

