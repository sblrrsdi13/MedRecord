import type { Request, Response } from "express";
import { created, ok } from "../../utils/api-response.js";
import * as staffService from "./staff.service.js";

export async function listStaff(_req: Request, res: Response) {
  const staff = await staffService.listStaff();
  return ok(res, staff);
}

export async function createStaff(req: Request, res: Response) {
  const staff = await staffService.createStaff(req.body);
  return created(res, staff, "Staff berhasil dibuat");
}

export async function deleteStaff(req: Request, res: Response) {
  const staff = await staffService.deleteStaff(req.params.id);
  return ok(res, staff, "Staff berhasil dihapus");
}
