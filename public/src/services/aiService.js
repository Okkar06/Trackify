import { apiClient } from "@/services/apiClient";

export async function analyzeWorkImage({ file, signal }) {
  const formData = new FormData();
  formData.append("image", file);

  const res = await apiClient.post("/ai/analyze-work-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    signal,
  });

  return res.data;
}

