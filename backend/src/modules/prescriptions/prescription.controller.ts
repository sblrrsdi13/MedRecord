import type { Request, Response } from "express";
import { writeAuditLog } from "../../middleware/audit.middleware.js";
import { created, ok } from "../../utils/api-response.js";
import { emitResourceEvent } from "../../socket/socket.js";
import * as prescriptionService from "./prescription.service.js";

export async function listPrescriptions(req: Request, res: Response) {
  const result = await prescriptionService.listPrescriptions(req.query as Record<string, unknown>);
  return ok(res, result);
}

export async function createPrescription(req: Request, res: Response) {
  const prescription = await prescriptionService.createPrescription(req.body);
  await writeAuditLog(req, "create", "prescriptions", prescription.id, {
    medicalRecordId: req.body.medicalRecordId,
    visitId: prescription.visitId,
    patientId: prescription.patientId
  });
  emitResourceEvent("prescriptions", "create", { id: prescription.id, visitId: prescription.visitId, patientId: prescription.patientId });
  if (prescription.visitId) emitResourceEvent("visits", "update", { id: prescription.visitId });
  return created(res, prescription, "Resep berhasil dibuat");
}

export async function updatePrescription(req: Request, res: Response) {
  const prescription = await prescriptionService.updatePrescription(req.params.id, req.body);
  await writeAuditLog(req, "update", "prescriptions", prescription.id, { status: prescription.status });
  emitResourceEvent("prescriptions", "update", { id: prescription.id, medicalRecordId: prescription.medicalRecordId });
  return ok(res, prescription, "Status resep berhasil diperbarui");
}

export async function deletePrescription(req: Request, res: Response) {
  const prescription = await prescriptionService.deletePrescription(req.params.id);
  await writeAuditLog(req, "delete", "prescriptions", prescription.id, { medicalRecordId: prescription.medicalRecordId });
  emitResourceEvent("prescriptions", "delete", { id: prescription.id, medicalRecordId: prescription.medicalRecordId });
  return ok(res, prescription, "Resep berhasil dihapus");
}
