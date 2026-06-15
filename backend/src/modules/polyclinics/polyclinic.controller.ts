import type { Request, Response } from "express";
import { created, ok } from "../../utils/api-response.js";
import { writeAuditLog } from "../../middleware/audit.middleware.js";
import { emitResourceEvent } from "../../socket/socket.js";
import * as service from "./polyclinic.service.js";

export async function index(req: Request, res: Response) {
  return ok(res, await service.listPolyclinics(req.query as unknown as { page: number; limit: number; search?: string }));
}

export async function store(req: Request, res: Response) {
  const item = await service.createPolyclinic(req.body);
  await writeAuditLog(req, "create", "polyclinics", item.id);
  emitResourceEvent("polyclinics", "create", { id: item.id });
  return created(res, item, "Poli berhasil dibuat");
}

export async function update(req: Request, res: Response) {
  const item = await service.updatePolyclinic(req.params.id, req.body);
  await writeAuditLog(req, "update", "polyclinics", item.id);
  emitResourceEvent("polyclinics", "update", { id: item.id });
  return ok(res, item, "Poli berhasil diperbarui");
}
