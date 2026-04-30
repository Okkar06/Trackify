import { apiClient } from "@/services/apiClient";

export async function fetchMonthlyPay({ startDate, endDate, signal }) {
  const res = await apiClient.get("/pay/monthly", {
    params: { startDate, endDate },
    signal,
  });
  return res.data;
}

export async function fetchYearlyPay({ year, signal }) {
  const res = await apiClient.get("/pay/yearly", {
    params: { year },
    signal,
  });
  return res.data;
}
