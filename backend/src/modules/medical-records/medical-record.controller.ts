import type { Request, Response } from "express";
import { writeAuditLog } from "../../middleware/audit.middleware.js";
import { created, ok } from "../../utils/api-response.js";
import { emitResourceEvent } from "../../socket/socket.js";
import * as medicalRecordService from "./medical-record.service.js";

export async function listMedicalRecords(req: Request, res: Response) {
  const records = await medicalRecordService.listMedicalRecords(req.query as Record<string, unknown>);
  return ok(res, records);
}

export async function createMedicalRecord(req: Request, res: Response) {
  const record = await medicalRecordService.createMedicalRecord(req.user!, req.body);
  await writeAuditLog(req, "create", "medical_records", record.id, { visitId: record.visitId, patientId: record.patientId });
  emitResourceEvent("medical-records", "create", { id: record.id, visitId: record.visitId, patientId: record.patientId });
  emitResourceEvent("visits", "update", { id: record.visitId });
  return created(res, record, "Rekam medis berhasil dibuat");
}

export async function updateMedicalRecord(req: Request, res: Response) {
  const record = await medicalRecordService.updateMedicalRecord(req.params.id, req.user!, req.body);
  await writeAuditLog(req, "update", "medical_records", record.id, { visitId: record.visitId, patientId: record.patientId });
  emitResourceEvent("medical-records", "update", { id: record.id, visitId: record.visitId, patientId: record.patientId });
  emitResourceEvent("visits", "update", { id: record.visitId });
  return ok(res, record, "Rekam medis berhasil diperbarui");
}

export async function deleteMedicalRecord(req: Request, res: Response) {
  const record = await medicalRecordService.deleteMedicalRecord(req.params.id);
  await writeAuditLog(req, "delete", "medical_records", record.id, { visitId: record.visitId, patientId: record.patientId });
  emitResourceEvent("medical-records", "delete", { id: record.id, visitId: record.visitId, patientId: record.patientId });
  return ok(res, record, "Rekam medis berhasil dihapus");
}
