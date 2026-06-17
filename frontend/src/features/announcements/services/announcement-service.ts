import { api } from "@/services/api";
import type { ApiResponse } from "@/types/api";

export type AnnouncementItem = {
  id: string;
  title: string;
  content: string;
  category: "info" | "education" | "warning" | "promo";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  author?: { id: string; name?: string | null; email?: string | null } | null;
};

export type AnnouncementPayload = {
  title: string;
  content: string;
  category: AnnouncementItem["category"];
  isActive: boolean;
};

export async function getAnnouncements() {
  const response = await api.get<ApiResponse<AnnouncementItem[]>>("/announcements");
  return response.data.data;
}

export async function createAnnouncement(payload: AnnouncementPayload) {
  const response = await api.post<ApiResponse<AnnouncementItem>>("/announcements", payload);
  return response.data.data;
}

export async function updateAnnouncement(id: string, payload: AnnouncementPayload) {
  const response = await api.put<ApiResponse<AnnouncementItem>>(`/announcements/${id}`, payload);
  return response.data.data;
}

export async function deleteAnnouncement(id: string) {
  const response = await api.delete<ApiResponse<{ deleted: boolean }>>(`/announcements/${id}`);
  return response.data.data;
}



