import { Router } from "express";
import crypto from "node:crypto";
import { Prisma, RoleName } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { writeAuditLog } from "../../middleware/audit.middleware.js";
import { created, ok } from "../../utils/api-response.js";
import { AppError } from "../../utils/errors.js";
import { OPERATIONAL_ROLES } from "../../constants/roles.js";
import { advanceVisitStatus } from "../visits/visit.service.js";
import { hasPaginationQuery, paginationMeta, parsePagination } from "../../utils/pagination.js";
import { emitResourceEvent } from "../../socket/socket.js";

export const medicalRecordRoutes = Router();

const medicalRecordListInclude = {
  patient: {
    select: {
      id: true,
      patientCode: true,
      medicalRecordNo: true,
      name: true,
      nik: true,
      gender: true,
      birthDate: true,
      phone: true,
      address: true,
      bloodType: true,
      allergyNotes: true
    }
  },
  doctor: { include: { user: { select: { id: true, name: true, email: true } } } },
  visit: { select: { id: true, visitNo: true, visitDate: true, complaint: true, status: true } }
};

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

async function assertMedicalRecordVisitChangeIsSafe(tx: Prisma.TransactionClient, recordId: string, nextVisitId: string) {
  const currentRecord = await tx.medicalRecord.findUnique({
    where: { id: recordId },
    select: { visitId: true, patientId: true }
  });

  if (!currentRecord) {
    throw new AppError(404, "Rekam medis tidak ditemukan.", "MEDICAL_RECORD_NOT_FOUND");
  }

  if (currentRecord.visitId === nextVisitId) return;

  const nextVisit = await tx.visit.findUnique({
    where: { id: nextVisitId },
    select: { patientId: true }
  });

  if (!nextVisit) {
    throw new AppError(404, "Kunjungan tidak ditemukan.", "VISIT_NOT_FOUND");
  }

  if (nextVisit.patientId !== currentRecord.patientId) {
    throw new AppError(422, "Rekam medis tidak boleh dipindahkan ke kunjungan pasien lain.", "MEDICAL_RECORD_PATIENT_MISMATCH");
  }
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
medicalRecordRoutes.get("/", authorize(OPERATIONAL_ROLES), async (req, res) => {
  if (!hasPaginationQuery(req.query as Record<string, unknown>)) {
    const records = await prisma.medicalRecord.findMany({
      include: medicalRecordListInclude,
      orderBy: { createdAt: "desc" },
      take: 20
    });
    return ok(res, records);
  }

  const paging = parsePagination(req.query as Record<string, unknown>, { limit: 20 });
  const where = paging.search
    ? {
        OR: [
          { diagnosis: { contains: paging.search, mode: "insensitive" as const } },
          { treatment: { contains: paging.search, mode: "insensitive" as const } },
          { anamnesis: { contains: paging.search, mode: "insensitive" as const } },
          { notes: { contains: paging.search, mode: "insensitive" as const } },
          { patient: { name: { contains: paging.search, mode: "insensitive" as const } } },
          { patient: { patientCode: { contains: paging.search, mode: "insensitive" as const } } },
          { patient: { medicalRecordNo: { contains: paging.search, mode: "insensitive" as const } } },
          { patient: { nik: { contains: paging.search, mode: "insensitive" as const } } },
          { doctor: { user: { name: { contains: paging.search, mode: "insensitive" as const } } } }
        ]
      }
    : {};

  const [records, total] = await Promise.all([
    prisma.medicalRecord.findMany({
      where,
      include: medicalRecordListInclude,
      orderBy: { createdAt: "desc" },
      skip: (paging.page - 1) * paging.limit,
      take: paging.limit
    }),
    prisma.medicalRecord.count({ where })
  ]);

  return ok(res, { items: records, meta: paginationMeta(paging, total) });
});

medicalRecordRoutes.post("/", authorize(OPERATIONAL_ROLES), validate(schema), async (req, res) => {
  const doctorId = await resolveDoctorId(req.user!, req.body.doctorId);
  const record = await prisma.$transaction(async (tx) => {
    const patientId = await getVisitPatientId(tx, req.body.visitId);
    await ensureMedicalRecordNo(tx, patientId);
    const createdRecord = await tx.medicalRecord.create({ data: medicalRecordPayload(req.body, doctorId, patientId) });
    await advanceVisitStatus(tx, req.body.visitId, "examined");
    return createdRecord;
  });
  await writeAuditLog(req, "create", "medical_records", record.id, { visitId: record.visitId, patientId: record.patientId });
  emitResourceEvent("medical-records", "create", { id: record.id, visitId: record.visitId, patientId: record.patientId });
  emitResourceEvent("visits", "update", { id: record.visitId });
  return created(res, record, "Rekam medis berhasil dibuat");
});
medicalRecordRoutes.put("/:id", authorize(OPERATIONAL_ROLES), validate(schema), async (req, res) => {
  const doctorId = await resolveDoctorId(req.user!, req.body.doctorId);
  const record = await prisma.$transaction(async (tx) => {
    await assertMedicalRecordVisitChangeIsSafe(tx, req.params.id, req.body.visitId);
    const patientId = await getVisitPatientId(tx, req.body.visitId);
    await ensureMedicalRecordNo(tx, patientId);
    const updatedRecord = await tx.medicalRecord.update({ where: { id: req.params.id }, data: medicalRecordPayload(req.body, doctorId, patientId) });
    await advanceVisitStatus(tx, req.body.visitId, "examined");
    return updatedRecord;
  });
  await writeAuditLog(req, "update", "medical_records", record.id, { visitId: record.visitId, patientId: record.patientId });
  emitResourceEvent("medical-records", "update", { id: record.id, visitId: record.visitId, patientId: record.patientId });
  emitResourceEvent("visits", "update", { id: record.visitId });
  return ok(res, record, "Rekam medis berhasil diperbarui");
});
medicalRecordRoutes.delete("/:id", authorize(OPERATIONAL_ROLES), async (req, res) => {
  const record = await prisma.medicalRecord.delete({ where: { id: req.params.id } });
  await writeAuditLog(req, "delete", "medical_records", record.id, { visitId: record.visitId, patientId: record.patientId });
  emitResourceEvent("medical-records", "delete", { id: record.id, visitId: record.visitId, patientId: record.patientId });
  return ok(res, record, "Rekam medis berhasil dihapus");
});
