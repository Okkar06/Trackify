import { apiClient, withMockUser } from "@/services/apiClient";

export async function listWorkEntries({ signal }) {
  const res = await apiClient.get("/work", {
    ...withMockUser(),
    signal,
  });
  return res.data;
}

export async function fetchWorkEntry({ id, signal }) {
  const res = await apiClient.get(`/work/${id}`, {
    ...withMockUser(),
    signal,
  });
  return res.data;
}

export async function createWorkEntry({ payload, signal }) {
  const res = await apiClient.post("/work", payload, {
    ...withMockUser(),
    signal,
  });
  return res.data;
}

export async function updateWorkEntry({ id, payload, signal }) {
  const res = await apiClient.put(`/work/${id}`, payload, {
    ...withMockUser(),
    signal,
  });
  return res.data;
}

export async function deleteWorkEntry({ id, signal }) {
  const res = await apiClient.delete(`/work/${id}`, {
    ...withMockUser(),
    signal,
  });
  return res.data;
}

