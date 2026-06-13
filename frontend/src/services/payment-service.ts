import { api } from "./api";
import type { ApiResponse } from "@/types/api";

export async function createPayment(payload: {
  invoiceNo?: string;
  visitId: string;
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  paymentMethod?: "CASH" | "TRANSFER" | "BPJS";
  status: "unpaid" | "partial" | "paid" | "void";
}) {
  const response = await api.post<ApiResponse<unknown>>("/payments", payload);
  return response.data.data;
}

export type ReadyPaymentVisit = {
  id: string;
  visitNo: string;
  visitDate: string;
  status: string;
  patient: { id: string; name: string; medicalRecordNo?: string | null };
  polyclinic: { id: string; name: string; consultationFee?: string };
  medicalRecord?: {
    treatment?: string;
    treatmentFee?: string;
  } | null;
  billing: {
    consultationFee: number;
    treatmentFee: number;
    medicineTotal: number;
    subtotal: number;
    items: Array<{ itemName: string; quantity: number; price: number; total: number }>;
  };
};

export type PaymentRow = {
  id: string;
  invoiceNo: string;
  subtotal: string;
  discount: string;
  total: string;
  paidAmount: string;
  paymentMethod?: "CASH" | "TRANSFER" | "BPJS" | null;
  status: "unpaid" | "partial" | "paid" | "void";
  createdAt: string;
  visit?: { visitNo: string; patient?: { name: string; medicalRecordNo?: string | null }; polyclinic?: { name: string } };
  details: Array<{ id: string; itemName: string; quantity: number; price: string; total: string }>;
};

export async function getReadyPayments() {
  const response = await api.get<ApiResponse<ReadyPaymentVisit[]>>("/payments/ready");
  return response.data.data;
}

export async function getPayments() {
  const response = await api.get<ApiResponse<PaymentRow[]>>("/payments");
  return response.data.data;
}

export async function processReadyPayment(payload: {
  visitId: string;
  discount: number;
  paymentMethod: "CASH" | "TRANSFER" | "BPJS";
  paidAmount?: number;
}) {
  const response = await api.patch<ApiResponse<{ payment: PaymentRow; visit: unknown }>>("/payments/ready/pay", payload);
  return response.data.data;
}



