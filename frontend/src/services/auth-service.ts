import { api } from "./api";
import type { ApiResponse, UserSession } from "@/types/api";
import type { PatientRegisterInput, RegisterInput } from "@/validations/auth.schema";

export async function login(payload: { email: string; password: string }) {
  const response = await api.post<ApiResponse<{ accessToken: string; user: UserSession }>>("/auth/login", payload);
  return response.data.data;
}

export async function logout() {
  await api.post("/auth/logout");
}

export async function registerUser(payload: RegisterInput) {
  const response = await api.post<ApiResponse<UserSession>>("/auth/register", payload);
  return response.data.data;
}

export async function registerPatient(payload: PatientRegisterInput) {
  const response = await api.post<ApiResponse<UserSession>>("/auth/patient-register", {
    name: payload.name,
    email: payload.email,
    nik: payload.nik,
    birthDate: payload.birthDate,
    gender: payload.gender,
    bloodType: payload.bloodType || undefined,
    phone: payload.phone || undefined,
    address: payload.address,
    password: payload.password
  });
  return response.data.data;
}

export async function getMe() {
  const response = await api.get<ApiResponse<UserSession & { phone?: string; isActive: boolean; createdAt: string }>>("/auth/me");
  return response.data.data;
}

export async function updateProfile(payload: { name: string; email: string; phone?: string }) {
  const response = await api.put<ApiResponse<UserSession & { phone?: string }>>("/auth/profile", payload);
  return response.data.data;
}

export async function changePassword(payload: { currentPassword: string; newPassword: string }) {
  const response = await api.put<ApiResponse<{ changed: boolean }>>("/auth/change-password", payload);
  return response.data.data;
}



