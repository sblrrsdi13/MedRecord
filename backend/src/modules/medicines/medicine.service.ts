import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { hasPaginationQuery, paginationMeta, parsePagination } from "../../utils/pagination.js";
import type { MedicinePayload } from "./medicine.schema.js";

export async function listMedicines(query: Record<string, unknown>) {
  if (!hasPaginationQuery(query)) {
    return prisma.medicine.findMany({ orderBy: { name: "asc" } });
  }

  const paging = parsePagination(query);
  const where: Prisma.MedicineWhereInput | undefined = paging.search
    ? {
        OR: [
          { code: { contains: paging.search, mode: "insensitive" } },
          { name: { contains: paging.search, mode: "insensitive" } },
          { unit: { contains: paging.search, mode: "insensitive" } }
        ]
      }
    : undefined;

  const [total, medicines] = await Promise.all([
    prisma.medicine.count({ where }),
    prisma.medicine.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (paging.page - 1) * paging.limit,
      take: paging.limit
    })
  ]);

  return { items: medicines, meta: paginationMeta(paging, total) };
}

export async function createMedicine(data: MedicinePayload) {
  return prisma.medicine.create({ data });
}

export async function updateMedicine(id: string, data: MedicinePayload) {
  return prisma.medicine.update({ where: { id }, data });
}

export async function deleteMedicine(id: string) {
  return prisma.medicine.delete({ where: { id } });
}
