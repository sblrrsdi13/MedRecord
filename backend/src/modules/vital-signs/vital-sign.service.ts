import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { hasPaginationQuery, paginationMeta, parsePagination } from "../../utils/pagination.js";
import type { VitalSignPayload } from "./vital-sign.schema.js";

const vitalSignInclude = { patient: true, visit: true };

export async function listVitalSigns(query: Record<string, unknown>) {
  if (!hasPaginationQuery(query)) {
    return prisma.vitalSign.findMany({
      include: vitalSignInclude,
      orderBy: { createdAt: "desc" },
      take: 20
    });
  }

  const paging = parsePagination(query);
  const where: Prisma.VitalSignWhereInput | undefined = paging.search
    ? {
        OR: [
          { bloodPressure: { contains: paging.search, mode: "insensitive" } },
          { notes: { contains: paging.search, mode: "insensitive" } },
          { patient: { name: { contains: paging.search, mode: "insensitive" } } },
          { patient: { patientCode: { contains: paging.search, mode: "insensitive" } } },
          { visit: { visitNo: { contains: paging.search, mode: "insensitive" } } }
        ]
      }
    : undefined;

  const [total, vitalSigns] = await Promise.all([
    prisma.vitalSign.count({ where }),
    prisma.vitalSign.findMany({
      where,
      include: vitalSignInclude,
      orderBy: { createdAt: "desc" },
      skip: (paging.page - 1) * paging.limit,
      take: paging.limit
    })
  ]);

  return { items: vitalSigns, meta: paginationMeta(paging, total) };
}

export async function visitBelongsToPatient(visitId: string, patientId: string) {
  const visit = await prisma.visit.findFirst({ where: { id: visitId, patientId }, select: { id: true } });
  return Boolean(visit);
}

export async function createVitalSign(data: VitalSignPayload) {
  return prisma.vitalSign.create({ data });
}

export async function updateVitalSign(id: string, data: VitalSignPayload) {
  return prisma.vitalSign.update({ where: { id }, data });
}

export async function deleteVitalSign(id: string) {
  return prisma.vitalSign.delete({ where: { id } });
}
