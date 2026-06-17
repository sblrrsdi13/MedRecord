import { Router } from "express";
import { RoleName } from "@prisma/client";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { createManualBackup, downloadBackup, getMonitoring, getSecurityPolicy, listBackups, restoreBackup, updateAutoBackupPolicy, updateSecurityPolicy } from "./admin-system.controller.js";

export const adminSystemRoutes = Router();

adminSystemRoutes.use(authenticate, authorize([RoleName.ADMIN]));
adminSystemRoutes.get("/backups", listBackups);
adminSystemRoutes.post("/backups/manual", createManualBackup);
adminSystemRoutes.get("/backups/:file/download", downloadBackup);
adminSystemRoutes.post("/backups/:file/restore", restoreBackup);
adminSystemRoutes.get("/monitoring", getMonitoring);
adminSystemRoutes.get("/security-policy", getSecurityPolicy);
adminSystemRoutes.put("/security-policy", updateSecurityPolicy);
adminSystemRoutes.put("/auto-backup", updateAutoBackupPolicy);
