import { api } from "./api";
import type { ApiResponse, Patient, QueueItem } from "@/types/api";

export type VisitRegistrationRow = {
  id: string;
  visitNo: string;
  complaint?: string;
  status: string;
  visitDate: string;
  patient: Patient;
  polyclinic: {
    id: string;
    name: string;
    code: string;
    queuePrefix: string;
  };
  queue?: QueueItem | null;
  payment?: {
    id: string;
    invoiceNo: string;
    total: string;
    paidAmount: string;
    status: "unpaid" | "partial" | "paid" | "void";
  } | null;
};

export async function createVisit(payload: {
  visitNo?: string;
  patientId: string;
  polyclinicId: string;
  doctorId?: string;
  complaint?: string;
}) {
  const response = await api.post<ApiResponse<unknown>>("/visits", payload);
  return response.data.data;
}

export async function getVisits() {
  const response = await api.get<ApiResponse<VisitRegistrationRow[]>>("/visits");
  return response.data.data;
}



