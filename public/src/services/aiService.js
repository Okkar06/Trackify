import { apiClient } from "@/services/apiClient";

export async function analyzeWorkImage({ file, employeeName, signal }) {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("employeeName", employeeName);

  const res = await apiClient.post("/ai/analyze-work-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    signal,
  });

  return res.data;
}
