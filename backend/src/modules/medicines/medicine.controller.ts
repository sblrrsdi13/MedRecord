import type { Request, Response } from "express";
import { created, ok } from "../../utils/api-response.js";
import { emitResourceEvent } from "../../socket/socket.js";
import * as medicineService from "./medicine.service.js";

export async function listMedicines(req: Request, res: Response) {
  const result = await medicineService.listMedicines(req.query as Record<string, unknown>);
  return ok(res, result);
}

export async function createMedicine(req: Request, res: Response) {
  const medicine = await medicineService.createMedicine(req.body);
  emitResourceEvent("medicines", "create", { id: medicine.id });
  return created(res, medicine, "Obat berhasil dibuat");
}

export async function updateMedicine(req: Request, res: Response) {
  const medicine = await medicineService.updateMedicine(req.params.id, req.body);
  emitResourceEvent("medicines", "update", { id: medicine.id });
  return ok(res, medicine, "Obat berhasil diperbarui");
}

export async function deleteMedicine(req: Request, res: Response) {
  const medicine = await medicineService.deleteMedicine(req.params.id);
  emitResourceEvent("medicines", "delete", { id: medicine.id });
  return ok(res, medicine, "Obat berhasil dihapus");
}
