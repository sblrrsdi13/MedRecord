import { api } from "@/services/api";
import type { ApiResponse } from "@/types/api";

export async function createDoctor(payload: {
  userId: string;
  sipNumber?: string;
  specialization?: string;
  polyclinicId?: string;
}) {
  const response = await api.post<ApiResponse<unknown>>("/doctors", payload);
  return response.data.data;
}

export async function createDoctorSchedule(payload: {
  doctorId: string;
  polyclinicId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  quota: number;
  isActive: boolean;
}) {
  const response = await api.post<ApiResponse<unknown>>("/doctor-schedules", payload);
  return response.data.data;
}



