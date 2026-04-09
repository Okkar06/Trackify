import { apiClient } from "@/services/apiClient";

export async function login({ email, password, signal }) {
  const res = await apiClient.post(
    "/auth/login",
    { email, password },
    {
      signal,
    }
  );
  return res.data;
}

export async function register({ email, password, fullName, signal }) {
  const res = await apiClient.post(
    "/auth/register",
    { email, password, fullName },
    {
      signal,
    }
  );
  return res.data;
}

