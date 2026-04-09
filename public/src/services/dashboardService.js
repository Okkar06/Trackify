import { apiClient, withMockUser } from "@/services/apiClient";

export async function fetchMonthlySummary({ month, year, signal }) {
  const res = await apiClient.get("/dashboard/monthly-summary", {
    ...withMockUser(),
    params: { month, year },
    signal,
  });
  return res.data;
}

export async function fetchCalendarDates({ month, year, signal }) {
  const res = await apiClient.get("/dashboard/calendar", {
    ...withMockUser(),
    params: { month, year },
    signal,
  });
  return res.data;
}

export async function fetchDateDetails({ date, signal }) {
  const res = await apiClient.get(`/dashboard/date/${date}`, {
    ...withMockUser(),
    signal,
  });
  return res.data;
}

