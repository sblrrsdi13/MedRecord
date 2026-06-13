import type { Request } from "express";
import { prisma } from "../config/prisma.js";

export async function writeAuditLog(req: Request, action: string, resource: string, resourceId?: string, metadata?: unknown) {
  await prisma.auditLog.create({
    data: {
      userId: req.user?.id,
      action,
      resource,
      resourceId,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      metadata: metadata === undefined ? undefined : (metadata as object)
    }
  });
}
