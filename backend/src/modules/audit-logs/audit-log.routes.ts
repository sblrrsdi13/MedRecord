import { Router } from "express";
import { RoleName } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { ok } from "../../utils/api-response.js";

export const auditLogRoutes = Router();

auditLogRoutes.use(authenticate, authorize([RoleName.ADMIN]));
auditLogRoutes.get("/", async (_req, res) => {
  const logs = await prisma.auditLog.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  return ok(res, logs);
});
