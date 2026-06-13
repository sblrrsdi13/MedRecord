import { api } from "./api";
import type { ApiResponse, Patient, QueueItem } from "@/types/api";

export type DashboardSummary = {
  totals: {
    totalPatients: number;
    todayVisits: number;
    completedVisits: number;
    pendingVisits: number;
    waitingQueues: number;
    calledQueues: number;
    pendingPrescriptions: number;
    lowStockMedicines: number;
    unpaidPayments: number;
    revenueToday: string | number;
  };
  recentVisits: Array<{
    id: string;
    visitNo: string;
    status: string;
    visitDate: string;
    complaint?: string;
    patient: Patient;
    polyclinic: { name: string };
    queue?: QueueItem | null;
    doctor?: { user?: { name: string } } | null;
  }>;
  queueSnapshot: QueueItem[];
  lowStockList: Array<{
    id: string;
    code: string;
    name: string;
    stock: number;
    minStock: number;
    unit: string;
  }>;
};

export async function getDashboardSummary() {
  const response = await api.get<ApiResponse<DashboardSummary>>("/dashboard/summary");
  return response.data.data;
}



