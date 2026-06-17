import { api } from "@/services/api";
import type { ApiResponse, PaginatedResponse, RoleName } from "@/types/api";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  role: { name: RoleName };
  createdAt: string;
};

export function getUsers(): Promise<UserRow[]>;
export function getUsers(params: { page?: number; limit?: number; search?: string }): Promise<UserRow[] | PaginatedResponse<UserRow>>;
export async function getUsers(params?: { page?: number; limit?: number; search?: string }) {
  const response = await api.get<ApiResponse<UserRow[] | PaginatedResponse<UserRow>>>("/users", { params });
  return response.data.data;
}

export async function deleteUserPermanent(id: string) {
  const response = await api.delete<ApiResponse<Pick<UserRow, "id" | "name" | "email">>>(`/users/${id}/permanent`);
  return response.data.data;
}



