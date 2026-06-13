import { api } from "./api";
import type { ApiResponse, RoleName } from "@/types/api";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  role: { name: RoleName };
  createdAt: string;
};

export async function getUsers() {
  const response = await api.get<ApiResponse<UserRow[]>>("/users");
  return response.data.data;
}

export async function deleteUserPermanent(id: string) {
  const response = await api.delete<ApiResponse<Pick<UserRow, "id" | "name" | "email">>>(`/users/${id}/permanent`);
  return response.data.data;
}



