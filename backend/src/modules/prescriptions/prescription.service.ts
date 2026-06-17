import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { hasPaginationQuery, paginationMeta, parsePagination } from "../../utils/pagination.js";
import { advanceVisitStatus } from "../visits/visit.service.js";
import type { CreatePrescriptionPayload, UpdatePrescriptionPayload } from "./prescription.schema.js";

const prescriptionInclude = {
  medicalRecord: { include: { patient: true, doctor: { include: { user: { select: { name: true } } } } } },
  items: { include: { medicine: true } }
} satisfies Prisma.PrescriptionInclude;

export async function listPrescriptions(query: Record<string, unknown>) {
  if (!hasPaginationQuery(query)) {
    return prisma.prescription.findMany({
      include: prescriptionInclude,
      orderBy: { createdAt: "desc" },
      take: 20
    });
  }

  const paging = parsePagination(query, { limit: 20 });
  const where: Prisma.PrescriptionWhereInput = paging.search
    ? {
        OR: [
          { status: { contains: paging.search, mode: "insensitive" } },
          { medicalRecord: { diagnosis: { contains: paging.search, mode: "insensitive" } } },
          { medicalRecord: { patient: { name: { contains: paging.search, mode: "insensitive" } } } },
          { medicalRecord: { patient: { patientCode: { contains: paging.search, mode: "insensitive" } } } },
          { medicalRecord: { patient: { medicalRecordNo: { contains: paging.search, mode: "insensitive" } } } },
          { medicalRecord: { doctor: { user: { name: { contains: paging.search, mode: "insensitive" } } } } },
          { items: { some: { medicine: { name: { contains: paging.search, mode: "insensitive" } } } } }
        ]
      }
    : {};

  const [prescriptions, total] = await Promise.all([
    prisma.prescription.findMany({
      where,
      include: prescriptionInclude,
      orderBy: { createdAt: "desc" },
      skip: (paging.page - 1) * paging.limit,
      take: paging.limit
    }),
    prisma.prescription.count({ where })
  ]);

  return { items: prescriptions, meta: paginationMeta(paging, total) };
}

export async function createPrescription(data: CreatePrescriptionPayload) {
  const items = data.items?.length
    ? data.items
    : [{
        medicineId: data.medicineId as string,
        quantity: data.quantity as number,
        dosage: data.dosage as string,
        instruction: data.instruction
      }];

  return prisma.$transaction(async (tx) => {
    const createdPrescription = await tx.prescription.create({
      data: {
        medicalRecordId: data.medicalRecordId,
        status: "draft",
        items: {
          create: items.map((item) => ({
            medicineId: item.medicineId,
            quantity: item.quantity,
            dosage: item.dosage,
            instruction: item.instruction
          }))
        }
      },
      include: { items: { include: { medicine: true } } }
    });

    const record = await tx.medicalRecord.findUnique({
      where: { id: data.medicalRecordId },
      select: { visitId: true, patientId: true }
    });

    if (record) {
      await advanceVisitStatus(tx, record.visitId, "ready_to_pay");
    }

    return { ...createdPrescription, visitId: record?.visitId, patientId: record?.patientId };
  });
}

export async function updatePrescription(id: string, data: UpdatePrescriptionPayload) {
  return prisma.prescription.update({ where: { id }, data });
}

export async function deletePrescription(id: string) {
  return prisma.prescription.delete({ where: { id } });
}
