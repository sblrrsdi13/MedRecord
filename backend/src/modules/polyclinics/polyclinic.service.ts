import { prisma } from "../../config/prisma.js";

export async function listPolyclinics(input: { page: number; limit: number; search?: string }) {
  const skip = (input.page - 1) * input.limit;
  const where = input.search
    ? {
        OR: [
          { name: { contains: input.search, mode: "insensitive" as const } },
          { code: { contains: input.search, mode: "insensitive" as const } }
        ]
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.polyclinic.findMany({ where, orderBy: { name: "asc" }, skip, take: input.limit }),
    prisma.polyclinic.count({ where })
  ]);

  return { items, meta: { page: input.page, limit: input.limit, total, totalPages: Math.ceil(total / input.limit) } };
}

export async function createPolyclinic(data: Parameters<typeof prisma.polyclinic.create>[0]["data"]) {
  return prisma.polyclinic.create({ data });
}

export async function updatePolyclinic(id: string, data: Parameters<typeof prisma.polyclinic.update>[0]["data"]) {
  return prisma.polyclinic.update({ where: { id }, data });
}
