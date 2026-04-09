import { apiClient } from "@/services/apiClient";

export async function listWorkEntries({ signal }) {
  const res = await apiClient.get("/work", {
    signal,
  });
  return res.data;
}

export async function fetchWorkEntry({ id, signal }) {
  const res = await apiClient.get(`/work/${id}`, {
    signal,
  });
  return res.data;
}

export async function createWorkEntry({ payload, signal }) {
  const res = await apiClient.post("/work", payload, {
    signal,
  });
  return res.data;
}

export async function updateWorkEntry({ id, payload, signal }) {
  const res = await apiClient.put(`/work/${id}`, payload, {
    signal,
  });
  return res.data;
}

export async function deleteWorkEntry({ id, signal }) {
  const res = await apiClient.delete(`/work/${id}`, {
    signal,
  });
  return res.data;
}
