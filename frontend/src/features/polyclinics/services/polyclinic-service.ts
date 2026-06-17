import { api } from "@/services/api";
import type { ApiResponse } from "@/types/api";
import { getCachedResource, invalidateCachedResource } from "@/features/resources/services/resource-service";

export type Polyclinic = {
  id: string;
  name: string;
  code: string;
  queuePrefix: string;
  consultationFee?: string;
  description?: string;
  isActive: boolean;
};

type Paginated<T> = {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export async function getPolyclinics(params?: { page?: number; search?: string }) {
  if (!params?.search) {
    return getCachedResource<Paginated<Polyclinic>>("/polyclinics", params);
  }

  const response = await api.get<ApiResponse<Paginated<Polyclinic>>>("/polyclinics", { params });
  return response.data.data;
}

export async function createPolyclinic(payload: {
  name: string;
  code: string;
  queuePrefix: string;
  consultationFee?: number;
  description?: string;
  isActive: boolean;
}) {
  const response = await api.post<ApiResponse<Polyclinic>>("/polyclinics", payload);
  invalidateCachedResource("/polyclinics");
  return response.data.data;
}



