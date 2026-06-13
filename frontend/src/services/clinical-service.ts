import { api } from "./api";
import type { ApiResponse } from "@/types/api";

export async function createVitalSign(payload: {
  visitId: string;
  patientId: string;
  temperature?: number;
  bloodPressure?: string;
  pulse?: number;
  respiration?: number;
  weight?: number;
  height?: number;
  notes?: string;
}) {
  const response = await api.post<ApiResponse<unknown>>("/vital-signs", payload);
  return response.data.data;
}

export async function createMedicalRecord(payload: {
  visitId: string;
  patientId?: string;
  doctorId?: string;
  anamnesis?: string;
  diagnosis: string;
  treatment?: string;
  treatmentFee?: number;
  notes?: string;
}) {
  const response = await api.post<ApiResponse<unknown>>("/medical-records", payload);
  return response.data.data;
}



