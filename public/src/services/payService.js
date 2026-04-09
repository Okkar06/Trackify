import { apiClient, withMockUser } from "@/services/apiClient";

export async function fetchMonthlyPay({ month, year, signal }) {
  const res = await apiClient.get("/pay/monthly", {
    ...withMockUser(),
    params: { month, year },
    signal,
  });
  return res.data;
}

export async function fetchYearlyPay({ year, signal }) {
  const res = await apiClient.get("/pay/yearly", {
    ...withMockUser(),
    params: { year },
    signal,
  });
  return res.data;
}

