import type { Request, Response } from "express";
import { writeAuditLog } from "../../middleware/audit.middleware.js";
import { created, ok } from "../../utils/api-response.js";
import { emitResourceEvent } from "../../socket/socket.js";
import * as vitalSignService from "./vital-sign.service.js";

function visitPatientMismatch(res: Response) {
  return res.status(422).json({ success: false, message: "Kunjungan tidak sesuai dengan pasien yang dipilih", data: null });
}

export async function listVitalSigns(req: Request, res: Response) {
  const result = await vitalSignService.listVitalSigns(req.query as Record<string, unknown>);
  return ok(res, result);
}

export async function createVitalSign(req: Request, res: Response) {
  if (!(await vitalSignService.visitBelongsToPatient(req.body.visitId, req.body.patientId))) {
    return visitPatientMismatch(res);
  }

  const vitalSign = await vitalSignService.createVitalSign(req.body);
  await writeAuditLog(req, "CREATE_VITAL_SIGN", "vital_signs", vitalSign.id, { visitId: vitalSign.visitId, patientId: vitalSign.patientId });
  emitResourceEvent("vital-signs", "create", { id: vitalSign.id, visitId: vitalSign.visitId, patientId: vitalSign.patientId });
  return created(res, vitalSign, "Vital sign berhasil dicatat");
}

export async function updateVitalSign(req: Request, res: Response) {
  if (!(await vitalSignService.visitBelongsToPatient(req.body.visitId, req.body.patientId))) {
    return visitPatientMismatch(res);
  }

  const vitalSign = await vitalSignService.updateVitalSign(req.params.id, req.body);
  await writeAuditLog(req, "UPDATE_VITAL_SIGN", "vital_signs", vitalSign.id, { visitId: vitalSign.visitId, patientId: vitalSign.patientId });
  emitResourceEvent("vital-signs", "update", { id: vitalSign.id, visitId: vitalSign.visitId, patientId: vitalSign.patientId });
  return ok(res, vitalSign, "Vital sign berhasil diperbarui");
}

export async function deleteVitalSign(req: Request, res: Response) {
  const vitalSign = await vitalSignService.deleteVitalSign(req.params.id);
  await writeAuditLog(req, "DELETE_VITAL_SIGN", "vital_signs", vitalSign.id, { visitId: vitalSign.visitId, patientId: vitalSign.patientId });
  emitResourceEvent("vital-signs", "delete", { id: vitalSign.id, visitId: vitalSign.visitId, patientId: vitalSign.patientId });
  return ok(res, vitalSign, "Vital sign berhasil dihapus");
}
