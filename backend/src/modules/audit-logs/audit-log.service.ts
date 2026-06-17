import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { hasPaginationQuery, paginationMeta, parsePagination } from "../../utils/pagination.js";

const auditLogInclude = {
  user: { select: { id: true, name: true, email: true } }
};

export async function listAuditLogs(query: Record<string, unknown>) {
  if (!hasPaginationQuery(query)) {
    return prisma.auditLog.findMany({
      include: auditLogInclude,
      orderBy: { createdAt: "desc" },
      take: 20
    });
  }

  const paging = parsePagination(query);
  const where: Prisma.AuditLogWhereInput | undefined = paging.search
    ? {
        OR: [
          { action: { contains: paging.search, mode: "insensitive" } },
          { resource: { contains: paging.search, mode: "insensitive" } },
          { ipAddress: { contains: paging.search, mode: "insensitive" } },
          { user: { name: { contains: paging.search, mode: "insensitive" } } },
          { user: { email: { contains: paging.search, mode: "insensitive" } } }
        ]
      }
    : undefined;

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: auditLogInclude,
      orderBy: { createdAt: "desc" },
      skip: (paging.page - 1) * paging.limit,
      take: paging.limit
    })
  ]);

  return { items: logs, meta: paginationMeta(paging, total) };
}
