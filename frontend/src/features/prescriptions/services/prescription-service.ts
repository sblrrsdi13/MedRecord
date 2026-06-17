import { api } from "@/services/api";
import type { ApiResponse } from "@/types/api";

export async function createPrescription(payload: {
  medicalRecordId: string;
  items: Array<{
    medicineId: string;
    quantity: number;
    dosage: string;
    instruction?: string;
  }>;
}) {
  const response = await api.post<ApiResponse<unknown>>("/prescriptions", payload);
  return response.data.data;
}



