import { apiClient } from "@/services/apiClient";

export async function fetchMonthlySummary({ month, year, signal }) {
  const res = await apiClient.get("/dashboard/monthly-summary", {
    params: { month, year },
    signal,
  });
  return res.data;
}

export async function fetchCalendarDates({ month, year, signal }) {
  const res = await apiClient.get("/dashboard/calendar", {
    params: { month, year },
    signal,
  });
  return res.data;
}

export async function fetchDateDetails({ date, signal }) {
  const res = await apiClient.get(`/dashboard/date/${date}`, {
    signal,
  });
  return res.data;
}
