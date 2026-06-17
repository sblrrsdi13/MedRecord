import { api } from "@/services/api";
import type { ApiResponse, QueueItem } from "@/types/api";

type Paginated<T> = {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export async function getQueues(params?: { page?: number; polyclinicId?: string; status?: string }) {
  const response = await api.get<ApiResponse<Paginated<QueueItem>>>("/queues", { params });
  return response.data.data;
}

export async function createQueue(payload: { polyclinicId: string; patientId?: string; visitId?: string }) {
  const response = await api.post<ApiResponse<QueueItem>>("/queues", payload);
  return response.data.data;
}

export async function callQueue(id: string) {
  const response = await api.patch<ApiResponse<QueueItem>>(`/queues/${id}/call`);
  return response.data.data;
}

export async function recallQueue(id: string) {
  const response = await api.patch<ApiResponse<QueueItem>>(`/queues/${id}/recall`);
  return response.data.data;
}

export async function skipQueue(id: string) {
  const response = await api.patch<ApiResponse<QueueItem>>(`/queues/${id}/skip`);
  return response.data.data;
}

export async function completeQueue(id: string) {
  const response = await api.patch<ApiResponse<QueueItem>>(`/queues/${id}/complete`);
  return response.data.data;
}

export async function cancelQueue(id: string) {
  const response = await api.patch<ApiResponse<QueueItem>>(`/queues/${id}/cancel`);
  return response.data.data;
}



