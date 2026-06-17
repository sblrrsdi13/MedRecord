import type { Request, Response } from "express";
import { created, ok } from "../../utils/api-response.js";
import { emitResourceEvent } from "../../socket/socket.js";
import * as doctorService from "./doctor.service.js";

export async function listDoctors(_req: Request, res: Response) {
  const doctors = await doctorService.listDoctors();
  return ok(res, doctors);
}

export async function createDoctor(req: Request, res: Response) {
  const doctor = await doctorService.createDoctor(req.body);
  emitResourceEvent("doctors", "create", { id: doctor.id });
  return created(res, doctor, "Dokter berhasil dibuat");
}

export async function updateDoctor(req: Request, res: Response) {
  const doctor = await doctorService.updateDoctor(req.params.id, req.body);
  emitResourceEvent("doctors", "update", { id: doctor.id });
  return ok(res, doctor, "Dokter berhasil diperbarui");
}

export async function deleteDoctor(req: Request, res: Response) {
  const doctor = await doctorService.deleteDoctor(req.params.id);
  emitResourceEvent("doctors", "delete", { id: doctor.id });
  return ok(res, doctor, "Dokter berhasil dihapus");
}
