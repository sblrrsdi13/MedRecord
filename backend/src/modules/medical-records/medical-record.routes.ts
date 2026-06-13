import { Router } from "express";
import crypto from "node:crypto";
import { Prisma, RoleName } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { created, ok } from "../../utils/api-response.js";
import { AppError } from "../../utils/errors.js";
import { OPERATIONAL_ROLES } from "../../constants/roles.js";

export const medicalRecordRoutes = Router();

const schema = z.object({
  body: z.object({
    visitId: z.string().uuid(),
    patientId: z.string().uuid().optional(),
    doctorId: z.string().uuid().optional(),
    anamnesis: z.string().optional(),
    diagnosis: z.string().min(2),
    treatment: z.string().optional(),
    treatmentFee: z.coerce.number().nonnegative().default(0),
    notes: z.string().optional()
  })
});

async function resolveDoctorId(user: NonNullable<Express.Request["user"]>, inputDoctorId?: string) {
  if (user.role !== RoleName.DOCTOR) {
    if (!inputDoctorId) throw new AppError(422, "Pilih dokter terlebih dahulu.", "DOCTOR_REQUIRED");
    return inputDoctorId;
  }

  const doctor = await prisma.doctor.findUnique({
    where: { userId: user.id },
    select: { id: true }
  });

  if (!doctor) {
    throw new AppError(422, "Akun dokter belum terhubung dengan profil dokter.", "DOCTOR_PROFILE_NOT_LINKED");
  }

  return doctor.id;
}

async function generateMedicalRecordNo(tx: Prisma.TransactionClient) {
  const today = new Date();
  const datePart = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("");

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const sequence = await tx.patient.count({
      where: { medicalRecordNo: { startsWith: `RM${datePart}` } }
    });
    const candidate = `RM${datePart}${String(sequence + attempt + 1).padStart(4, "0")}`;
    const existing = await tx.patient.findUnique({ where: { medicalRecordNo: candidate }, select: { id: true } });
    if (!existing) return candidate;
  }

  return `RM${datePart}${crypto.randomInt(1000, 9999)}`;
}

async function ensureMedicalRecordNo(tx: Prisma.TransactionClient, patientId: string) {
  const patient = await tx.patient.findUnique({
    where: { id: patientId },
    select: { medicalRecordNo: true }
  });

  if (patient?.medicalRecordNo) return patient.medicalRecordNo;

  const medicalRecordNo = await generateMedicalRecordNo(tx);
  await tx.patient.update({
    where: { id: patientId },
    data: { medicalRecordNo }
  });
  return medicalRecordNo;
}

async function getVisitPatientId(tx: Prisma.TransactionClient, visitId: string) {
  const visit = await tx.visit.findUnique({
    where: { id: visitId },
    select: { patientId: true }
  });

  if (!visit) {
    throw new AppError(404, "Kunjungan tidak ditemukan.", "VISIT_NOT_FOUND");
  }

  return visit.patientId;
}

function medicalRecordPayload(body: z.infer<typeof schema>["body"], doctorId: string, patientId: string) {
  return {
    visitId: body.visitId,
    patientId,
    doctorId,
    anamnesis: body.anamnesis,
    diagnosis: body.diagnosis,
    treatment: body.treatment,
    treatmentFee: body.treatmentFee,
    notes: body.notes
  };
}

medicalRecordRoutes.use(authenticate);
medicalRecordRoutes.get("/", authorize(OPERATIONAL_ROLES), async (_req, res) => {
  const records = await prisma.medicalRecord.findMany({
    include: { patient: true, doctor: { include: { user: true } }, visit: true },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  return ok(res, records);
});

medicalRecordRoutes.post("/", authorize(OPERATIONAL_ROLES), validate(schema), async (req, res) => {
  const doctorId = await resolveDoctorId(req.user!, req.body.doctorId);
  const record = await prisma.$transaction(async (tx) => {
    const patientId = await getVisitPatientId(tx, req.body.visitId);
    await ensureMedicalRecordNo(tx, patientId);
    const createdRecord = await tx.medicalRecord.create({ data: medicalRecordPayload(req.body, doctorId, patientId) });
    await tx.visit.update({ where: { id: req.body.visitId }, data: { status: "examined" } });
    return createdRecord;
  });
  return created(res, record, "Rekam medis berhasil dibuat");
});
medicalRecordRoutes.put("/:id", authorize(OPERATIONAL_ROLES), validate(schema), async (req, res) => {
  const doctorId = await resolveDoctorId(req.user!, req.body.doctorId);
  const record = await prisma.$transaction(async (tx) => {
    const patientId = await getVisitPatientId(tx, req.body.visitId);
    await ensureMedicalRecordNo(tx, patientId);
    const updatedRecord = await tx.medicalRecord.update({ where: { id: req.params.id }, data: medicalRecordPayload(req.body, doctorId, patientId) });
    await tx.visit.update({ where: { id: req.body.visitId }, data: { status: "examined" } });
    return updatedRecord;
  });
  return ok(res, record, "Rekam medis berhasil diperbarui");
});
medicalRecordRoutes.delete("/:id", authorize(OPERATIONAL_ROLES), async (req, res) => ok(res, await prisma.medicalRecord.delete({ where: { id: req.params.id } }), "Rekam medis berhasil dihapus"));
