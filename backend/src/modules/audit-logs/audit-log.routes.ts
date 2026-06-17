import { Router } from "express";
import { RoleName } from "@prisma/client";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { listAuditLogs } from "./audit-log.controller.js";

export const auditLogRoutes = Router();

auditLogRoutes.use(authenticate, authorize([RoleName.ADMIN]));
auditLogRoutes.get("/", listAuditLogs);
