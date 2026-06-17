import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { hasPaginationQuery, paginationMeta, parsePagination } from "../../utils/pagination.js";
import type { UpdateUserPayload } from "./user.schema.js";

const userSelect = { id: true, name: true, email: true, phone: true, isActive: true, role: { select: { name: true } }, createdAt: true };

export async function listUsers(query: Record<string, unknown>) {
  if (!hasPaginationQuery(query)) {
    return prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: "desc" }
    });
  }

  const paging = parsePagination(query);
  const where: Prisma.UserWhereInput | undefined = paging.search
    ? {
        OR: [
          { name: { contains: paging.search, mode: "insensitive" } },
          { email: { contains: paging.search, mode: "insensitive" } },
          { phone: { contains: paging.search, mode: "insensitive" } }
        ]
      }
    : undefined;

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { createdAt: "desc" },
      skip: (paging.page - 1) * paging.limit,
      take: paging.limit
    })
  ]);

  return { items: users, meta: paginationMeta(paging, total) };
}

export async function updateUser(id: string, data: UpdateUserPayload) {
  return prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      isActive: data.isActive
    },
    select: userSelect
  });
}

export async function deactivateUser(id: string) {
  return prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: { id: true, name: true, email: true, isActive: true }
  });
}

export async function deleteUserPermanent(id: string) {
  await prisma.refreshToken.deleteMany({ where: { userId: id } });
  return prisma.user.delete({
    where: { id },
    select: { id: true, name: true, email: true }
  });
}
