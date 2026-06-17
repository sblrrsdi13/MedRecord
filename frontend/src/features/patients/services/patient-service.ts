import { api } from "@/services/api";
import type { ApiResponse, Patient } from "@/types/api";

type Paginated<T> = {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export async function getPatients(params: { page?: number; search?: string }) {
  const response = await api.get<ApiResponse<Paginated<Patient>>>("/patients", { params });
  return response.data.data;
}

export async function createPatient(payload: {
  medicalRecordNo?: string;
  userId?: string;
  name: string;
  nik?: string;
  gender: "MALE" | "FEMALE";
  birthDate: string;
  phone?: string;
  address?: string;
  bloodType?: string;
  allergyNotes?: string;
}) {
  const response = await api.post<ApiResponse<Patient>>("/patients", payload);
  return response.data.data;
}

export async function updatePatient(id: string, payload: {
  medicalRecordNo?: string;
  userId?: string;
  name: string;
  nik?: string;
  gender: "MALE" | "FEMALE";
  birthDate: string;
  phone?: string;
  address?: string;
  bloodType?: string;
  allergyNotes?: string;
}) {
  const response = await api.put<ApiResponse<Patient>>(`/patients/${id}`, payload);
  return response.data.data;
}



