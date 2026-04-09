import { apiClient, withMockUser } from "@/services/apiClient";

export async function fetchUserProfile({ signal }) {
  const res = await apiClient.get("/users/profile", {
    ...withMockUser(),
    signal,
  });
  return res.data;
}

export async function updateUserProfile({ payload, signal }) {
  const res = await apiClient.put("/users/profile", payload, {
    ...withMockUser(),
    signal,
  });
  return res.data;
}

