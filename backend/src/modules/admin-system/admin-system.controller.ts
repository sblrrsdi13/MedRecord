import { createReadStream } from "node:fs";
import type { Request, Response } from "express";
import { ok } from "../../utils/api-response.js";
import { autoBackupSchema, securityPolicySchema } from "./admin-system.schema.js";
import * as adminSystemService from "./admin-system.service.js";

export async function listBackups(_req: Request, res: Response) {
  return ok(res, await adminSystemService.listBackups());
}

export async function createManualBackup(req: Request, res: Response) {
  const backup = await adminSystemService.createManualBackup(req.user?.id);
  return ok(res, backup, "Backup database berhasil dibuat");
}

export async function downloadBackup(req: Request, res: Response) {
  const { safeFile, filePath } = await adminSystemService.getBackupFilePath(req.params.file);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="${safeFile}"`);
  createReadStream(filePath).pipe(res);
}

export async function restoreBackup(req: Request, res: Response) {
  const restored = await adminSystemService.restoreBackup(req.params.file, req.user?.id);
  return ok(res, restored, "Restore backup selesai");
}

export async function getMonitoring(_req: Request, res: Response) {
  return ok(res, await adminSystemService.getMonitoring());
}

export async function getSecurityPolicy(_req: Request, res: Response) {
  return ok(res, await adminSystemService.getSecurityPolicy());
}

export async function updateSecurityPolicy(req: Request, res: Response) {
  const payload = securityPolicySchema.parse(req.body);
  const policy = await adminSystemService.updateSecurityPolicy(req.user?.id, payload);
  return ok(res, policy, "Security policy berhasil disimpan");
}

export async function updateAutoBackupPolicy(req: Request, res: Response) {
  const payload = autoBackupSchema.parse(req.body);
  const policy = await adminSystemService.updateAutoBackupPolicy(req.user?.id, payload);
  return ok(res, policy, "Pengaturan backup otomatis berhasil disimpan");
}
