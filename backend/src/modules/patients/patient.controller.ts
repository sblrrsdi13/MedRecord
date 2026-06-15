import type { Request, Response } from "express";
import { created, ok } from "../../utils/api-response.js";
import { writeAuditLog } from "../../middleware/audit.middleware.js";
import { emitResourceEvent } from "../../socket/socket.js";
import * as service from "./patient.service.js";

export async function index(req: Request, res: Response) {
  return ok(res, await service.listPatients(req.query as unknown as { page: number; limit: number; search?: string }));
}

export async function store(req: Request, res: Response) {
  const patient = await service.createPatient(req.body);
  await writeAuditLog(req, "create", "patients", patient.id);
  emitResourceEvent("patients", "create", { id: patient.id });
  return created(res, patient, "Pasien berhasil dibuat");
}

export async function update(req: Request, res: Response) {
  const patient = await service.updatePatient(req.params.id, req.body);
  await writeAuditLog(req, "update", "patients", patient.id);
  emitResourceEvent("patients", "update", { id: patient.id });
  return ok(res, patient, "Pasien berhasil diperbarui");
}
