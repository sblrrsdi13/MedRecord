import type { Request, Response } from "express";
import { writeAuditLog } from "../../middleware/audit.middleware.js";
import { created, ok } from "../../utils/api-response.js";
import { emitResourceEvent } from "../../socket/socket.js";
import * as visitService from "./visit.service.js";

export async function listVisits(req: Request, res: Response) {
  const result = await visitService.listVisits(req.query as Record<string, unknown>);
  return ok(res, result);
}

export async function createVisit(req: Request, res: Response) {
  const visit = await visitService.createVisit(req.body);
  await writeAuditLog(req, "create", "visits", visit.id, { visitNo: visit.visitNo, patientId: visit.patientId, polyclinicId: visit.polyclinicId });
  emitResourceEvent("visits", "create", { id: visit.id, patientId: visit.patientId, polyclinicId: visit.polyclinicId });
  return created(res, visit, "Kunjungan berhasil dibuat");
}

export async function updateVisit(req: Request, res: Response) {
  const visit = await visitService.updateVisit(req.params.id, req.body);
  await writeAuditLog(req, "update", "visits", visit.id, { visitNo: visit.visitNo, patientId: visit.patientId, polyclinicId: visit.polyclinicId });
  emitResourceEvent("visits", "update", { id: visit.id, patientId: visit.patientId, polyclinicId: visit.polyclinicId });
  return ok(res, visit, "Kunjungan berhasil diperbarui");
}

export async function deleteVisit(req: Request, res: Response) {
  const visit = await visitService.deleteVisit(req.params.id);
  await writeAuditLog(req, "delete", "visits", visit.id, { visitNo: visit.visitNo, patientId: visit.patientId, polyclinicId: visit.polyclinicId });
  emitResourceEvent("visits", "delete", { id: visit.id, patientId: visit.patientId, polyclinicId: visit.polyclinicId });
  return ok(res, visit, "Kunjungan berhasil dihapus");
}
