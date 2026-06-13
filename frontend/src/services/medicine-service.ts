import { api } from "./api";
import type { ApiResponse } from "@/types/api";

export type Medicine = {
  id: string;
  code: string;
  name: string;
  unit: string;
  price: string;
  stock: number;
  minStock: number;
};

export async function createMedicine(payload: {
  code: string;
  name: string;
  unit: string;
  price: number;
  stock: number;
  minStock: number;
}) {
  const response = await api.post<ApiResponse<Medicine>>("/medicines", payload);
  return response.data.data;
}



