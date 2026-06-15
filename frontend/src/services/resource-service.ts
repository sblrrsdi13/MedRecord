import { api } from "./api";
import type { ApiResponse } from "@/types/api";

export async function getResource<T>(path: string, params?: Record<string, unknown>) {
  const response = await api.get<ApiResponse<T>>(path, { params });
  return response.data.data;
}

export async function deleteResource<T>(path: string) {
  const response = await api.delete<ApiResponse<T>>(path);
  return response.data.data;
}

export async function updateResource<T>(path: string, payload: Record<string, unknown>) {
  const response = await api.put<ApiResponse<T>>(path, payload);
  return response.data.data;
}



