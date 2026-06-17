import { Prisma, VisitStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/errors.js";
import { generateVisitNo } from "../../utils/numbering.js";
import { hasPaginationQuery, paginationMeta, parsePagination } from "../../utils/pagination.js";
import type { VisitPayload } from "./visit.schema.js";

const visitListInclude = {
  patient: {
    select: {
      id: true,
      patientCode: true,
      medicalRecordNo: true,
      userId: true,
      name: true,
      nik: true,
      gender: true,
      birthDate: true,
      phone: true,
      address: true,
      bloodType: true,
      allergyNotes: true,
      createdAt: true,
      updatedAt: true
    }
  },
  doctor: { include: { user: { select: { id: true, name: true, email: true } } } },
  polyclinic: {
    select: {
      id: true,
      name: true,
      code: true,
      queuePrefix: true,
      consultationFee: true,
      description: true,
      isActive: true
    }
  },
  queue: { select: { id: true, queueNumber: true, status: true, calledAt: true, completedAt: true } },
  payment: { select: { id: true, invoiceNo: true, status: true, total: true, paidAmount: true, paymentMethod: true } }
};

const visitStatusRank: Record<VisitStatus, number> = {
  registered: 10,
  waiting: 20,
  examined: 30,
  prescribed: 40,
  ready_to_pay: 50,
  paid: 60,
  completed: 70,
  cancelled: 99
};

const terminalStatuses = new Set<VisitStatus>(["paid", "completed", "cancelled"]);

export async function listVisits(query: Record<string, unknown>) {
  if (!hasPaginationQuery(query)) {
    return prisma.visit.findMany({
      include: visitListInclude,
      orderBy: { visitDate: "desc" },
      take: 20
    });
  }

  const paging = parsePagination(query, { limit: 20 });
  const where = paging.search
    ? {
        OR: [
          { visitNo: { contains: paging.search, mode: "insensitive" as const } },
          { complaint: { contains: paging.search, mode: "insensitive" as const } },
          { patient: { name: { contains: paging.search, mode: "insensitive" as const } } },
          { patient: { patientCode: { contains: paging.search, mode: "insensitive" as const } } },
          { patient: { medicalRecordNo: { contains: paging.search, mode: "insensitive" as const } } },
          { patient: { nik: { contains: paging.search, mode: "insensitive" as const } } },
          { polyclinic: { name: { contains: paging.search, mode: "insensitive" as const } } }
        ]
      }
    : {};

  const [visits, total] = await Promise.all([
    prisma.visit.findMany({
      where,
      include: visitListInclude,
      orderBy: { visitDate: "desc" },
      skip: (paging.page - 1) * paging.limit,
      take: paging.limit
    }),
    prisma.visit.count({ where })
  ]);

  return { items: visits, meta: paginationMeta(paging, total) };
}

export async function createVisit(data: VisitPayload) {
  return prisma.$transaction(async (tx) => {
    const [patient, polyclinic] = await Promise.all([
      tx.patient.findUnique({ where: { id: data.patientId }, select: { id: true } }),
      tx.polyclinic.findUnique({ where: { id: data.polyclinicId }, select: { id: true, isActive: true } })
    ]);

    if (!patient) throw new AppError(404, "Pasien tidak ditemukan.", "PATIENT_NOT_FOUND");
    if (!polyclinic || !polyclinic.isActive) throw new AppError(404, "Poli tidak ditemukan atau tidak aktif.", "POLYCLINIC_NOT_FOUND");

    const visitNo = data.visitNo || await generateVisitNo(tx);
    return tx.visit.create({ data: { ...data, visitNo } });
  });
}

export async function updateVisit(id: string, data: VisitPayload) {
  return prisma.visit.update({ where: { id }, data });
}

export async function deleteVisit(id: string) {
  return prisma.visit.delete({ where: { id } });
}

export async function advanceVisitStatus(tx: Prisma.TransactionClient, visitId: string, nextStatus: VisitStatus) {
  const visit = await tx.visit.findUnique({
    where: { id: visitId },
    select: { id: true, status: true }
  });

  if (!visit) {
    throw new AppError(404, "Kunjungan tidak ditemukan.", "VISIT_NOT_FOUND");
  }

  if (visit.status === nextStatus || terminalStatuses.has(visit.status)) {
    return visit;
  }

  if (visitStatusRank[nextStatus] <= visitStatusRank[visit.status]) {
    return visit;
  }

  return tx.visit.update({
    where: { id: visitId },
    data: { status: nextStatus },
    select: { id: true, status: true }
  });
}
