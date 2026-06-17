import crypto from "node:crypto";
import { Prisma, RoleName } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/errors.js";
import { hasPaginationQuery, paginationMeta, parsePagination } from "../../utils/pagination.js";
import { advanceVisitStatus } from "../visits/visit.service.js";
import type { MedicalRecordPayload } from "./medical-record.schema.js";

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
} satisfies Prisma.MedicalRecordInclude;

export async function listMedicalRecords(query: Record<string, unknown>) {
  if (!hasPaginationQuery(query)) {
    return prisma.medicalRecord.findMany({
      include: medicalRecordListInclude,
      orderBy: { createdAt: "desc" },
      take: 20
    });
  }

  const paging = parsePagination(query, { limit: 20 });
  const where: Prisma.MedicalRecordWhereInput = paging.search
    ? {
        OR: [
          { diagnosis: { contains: paging.search, mode: "insensitive" } },
          { treatment: { contains: paging.search, mode: "insensitive" } },
          { anamnesis: { contains: paging.search, mode: "insensitive" } },
          { notes: { contains: paging.search, mode: "insensitive" } },
          { patient: { name: { contains: paging.search, mode: "insensitive" } } },
          { patient: { patientCode: { contains: paging.search, mode: "insensitive" } } },
          { patient: { medicalRecordNo: { contains: paging.search, mode: "insensitive" } } },
          { patient: { nik: { contains: paging.search, mode: "insensitive" } } },
          { doctor: { user: { name: { contains: paging.search, mode: "insensitive" } } } }
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

  return { items: records, meta: paginationMeta(paging, total) };
}

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

function medicalRecordPayload(body: MedicalRecordPayload, doctorId: string, patientId: string) {
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

export async function createMedicalRecord(user: NonNullable<Express.Request["user"]>, data: MedicalRecordPayload) {
  const doctorId = await resolveDoctorId(user, data.doctorId);
  return prisma.$transaction(async (tx) => {
    const patientId = await getVisitPatientId(tx, data.visitId);
    await ensureMedicalRecordNo(tx, patientId);
    const createdRecord = await tx.medicalRecord.create({ data: medicalRecordPayload(data, doctorId, patientId) });
    await advanceVisitStatus(tx, data.visitId, "examined");
    return createdRecord;
  });
}

export async function updateMedicalRecord(id: string, user: NonNullable<Express.Request["user"]>, data: MedicalRecordPayload) {
  const doctorId = await resolveDoctorId(user, data.doctorId);
  return prisma.$transaction(async (tx) => {
    await assertMedicalRecordVisitChangeIsSafe(tx, id, data.visitId);
    const patientId = await getVisitPatientId(tx, data.visitId);
    await ensureMedicalRecordNo(tx, patientId);
    const updatedRecord = await tx.medicalRecord.update({ where: { id }, data: medicalRecordPayload(data, doctorId, patientId) });
    await advanceVisitStatus(tx, data.visitId, "examined");
    return updatedRecord;
  });
}

export async function deleteMedicalRecord(id: string) {
  return prisma.medicalRecord.delete({ where: { id } });
}
