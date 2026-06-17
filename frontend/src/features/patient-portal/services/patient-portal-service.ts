import { api } from "@/services/api";
import type { ApiResponse, Patient, QueueItem } from "@/types/api";

export type PortalVisit = {
  id: string;
  visitNo: string;
  complaint?: string;
  status: string;
  visitDate: string;
  polyclinic?: { name: string };
  doctor?: { user?: { name: string } };
};

export type PatientPortalData = {
  patient: Patient | null;
  visits: PortalVisit[];
  medicalRecords: Array<{
    id: string;
    anamnesis?: string;
    diagnosis: string;
    treatment?: string;
    treatmentFee?: string | number;
    notes?: string;
    createdAt: string;
    doctor?: { user?: { name: string } };
  }>;
  prescriptions: Array<{
    id: string;
    status: string;
    createdAt: string;
    items: Array<{
      quantity: number;
      dosage: string;
      instruction?: string;
      medicine: { name: string; unit: string };
    }>;
  }>;
  payments: Array<{
    id: string;
    invoiceNo: string;
    subtotal?: string | number;
    discount?: string | number;
    total: string | number;
    paidAmount: string | number;
    paymentMethod?: string | null;
    status: string;
    createdAt: string;
    isDraft?: boolean;
    details?: Array<{
      id: string;
      itemName: string;
      quantity: number;
      price: string | number;
      total: string | number;
    }>;
  }>;
  queues: QueueItem[];
  summary?: {
    visits: number;
    medicalRecords: number;
    prescriptions: number;
    paidPayments: number;
    pendingPayments: number;
    queues: number;
    nextVisit?: PortalVisit | null;
  };
};

export async function getPatientPortal() {
  const response = await api.get<ApiResponse<PatientPortalData>>("/patient-portal/me");
  return response.data.data;
}

export async function payPatientInvoice(id: string) {
  const response = await api.patch<ApiResponse<PatientPortalData["payments"][number]>>(`/patient-portal/payments/${id}/pay`);
  return response.data.data;
}

export async function updatePatientPortalProfile(payload: {
  name: string;
  email: string;
  phone?: string;
  nik: string;
  birthDate: string;
  gender: "MALE" | "FEMALE";
  bloodType?: string;
  address: string;
  allergyNotes?: string;
}) {
  const response = await api.patch<ApiResponse<{
    user: { id: string; name: string; email: string; phone?: string; role: string };
    patient: Patient;
  }>>("/patient-portal/profile", payload);
  return response.data.data;
}



