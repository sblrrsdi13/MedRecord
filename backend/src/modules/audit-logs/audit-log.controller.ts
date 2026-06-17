import type { Request, Response } from "express";
import { ok } from "../../utils/api-response.js";
import * as auditLogService from "./audit-log.service.js";

export async function listAuditLogs(req: Request, res: Response) {
  const result = await auditLogService.listAuditLogs(req.query as Record<string, unknown>);
  return ok(res, result);
}
