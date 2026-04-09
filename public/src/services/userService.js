import { apiClient } from "@/services/apiClient";

export async function fetchUserProfile({ signal }) {
  const res = await apiClient.get("/users/profile", {
    signal,
  });
  return res.data;
}

export async function updateUserProfile({ payload, signal }) {
  const res = await apiClient.put("/users/profile", payload, {
    signal,
  });
  return res.data;
}

export async function uploadProfileImage({ file, signal }) {
  const formData = new FormData();
  formData.append("image", file);

  const res = await apiClient.post("/users/profile/image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    signal,
  });

  return res.data;
}
