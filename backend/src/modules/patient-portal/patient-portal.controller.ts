import type { Request, Response } from "express";
import { writeAuditLog } from "../../middleware/audit.middleware.js";
import { ok } from "../../utils/api-response.js";
import { patientProfileSchema } from "./patient-portal.schema.js";
import * as patientPortalService from "./patient-portal.service.js";

export async function getPatientPortalMe(req: Request, res: Response) {
  const result = await patientPortalService.getPatientPortalMe(req.user!.id);
  return ok(res, result.data, result.message);
}

export async function payPatientInvoice(req: Request, res: Response) {
  const result = await patientPortalService.payPatientInvoice(req.user!.id, req.params.id);
  if (result.status === "not-linked") return ok(res, null, "Akun pasien belum terhubung dengan data pasien");
  if (result.status === "not-found") return ok(res, null, "Invoice tidak ditemukan di akun pasien ini");

  await writeAuditLog(req, "patient_pay", "payments", result.data.id, { visitId: result.data.visitId, invoiceNo: result.data.invoiceNo });
  return ok(res, result.data, "Invoice berhasil dibayar");
}

export async function updatePatientProfile(req: Request, res: Response) {
  const parsed = patientProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: "Validation error",
      errors: parsed.error.flatten(),
      data: null
    });
  }

  const result = await patientPortalService.updatePatientProfile(req.user!.id, parsed.data);
  if (result.status === "not-linked") return ok(res, null, "Akun pasien belum terhubung dengan data pasien");
  if (result.status === "email-conflict") return res.status(409).json({ success: false, message: "Email sudah digunakan akun lain", data: null });
  if (result.status === "nik-conflict") return res.status(409).json({ success: false, message: "NIK sudah digunakan pasien lain", data: null });

  await writeAuditLog(req, "update_own_profile", "patients", result.data.patient.id);
  return ok(res, {
    user: {
      id: result.data.user.id,
      name: result.data.user.name,
      email: result.data.user.email,
      phone: result.data.user.phone,
      role: result.data.user.role.name
    },
    patient: result.data.patient
  }, "Profil pasien berhasil diperbarui");
}
