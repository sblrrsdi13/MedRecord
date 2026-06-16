import { Router } from "express";
import { Prisma, RoleName } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { ok } from "../../utils/api-response.js";
import { hasPaginationQuery, paginationMeta, parsePagination } from "../../utils/pagination.js";

export const auditLogRoutes = Router();

auditLogRoutes.use(authenticate, authorize([RoleName.ADMIN]));
auditLogRoutes.get("/", async (req, res) => {
  const include = { user: { select: { id: true, name: true, email: true } } };

  if (!hasPaginationQuery(req.query)) {
    const logs = await prisma.auditLog.findMany({
      include,
      orderBy: { createdAt: "desc" },
      take: 20
    });
    return ok(res, logs);
  }

  const paging = parsePagination(req.query);
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
      include,
      orderBy: { createdAt: "desc" },
      skip: (paging.page - 1) * paging.limit,
      take: paging.limit
    })
  ]);

  return ok(res, { items: logs, meta: paginationMeta(paging, total) });
});
