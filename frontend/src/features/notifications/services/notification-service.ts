import { api } from "@/services/api";
import type { ApiResponse, RoleName } from "@/types/api";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "danger";
  readAt?: string | null;
  createdAt: string;
  sender?: { id: string; name: string; email: string; role?: RoleName | null } | null;
};

export type SendNotificationPayload = {
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "danger";
  recipientId?: string;
  targetRole?: RoleName;
};

export async function getNotifications() {
  const response = await api.get<ApiResponse<NotificationItem[]>>("/notifications");
  return response.data.data;
}

export async function sendNotification(payload: SendNotificationPayload) {
  const response = await api.post<ApiResponse<{ sent: number }>>("/notifications", payload);
  return response.data.data;
}

export async function markNotificationRead(id: string) {
  const response = await api.patch<ApiResponse<NotificationItem>>(`/notifications/${id}/read`);
  return response.data.data;
}

export async function deleteNotification(id: string) {
  const response = await api.delete<ApiResponse<{ deleted: boolean }>>(`/notifications/${id}`);
  return response.data.data;
}

export async function clearNotifications() {
  const response = await api.delete<ApiResponse<{ cleared: boolean }>>("/notifications");
  return response.data.data;
}



