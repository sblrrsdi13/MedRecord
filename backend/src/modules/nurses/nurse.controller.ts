import type { Request, Response } from "express";
import { created, ok } from "../../utils/api-response.js";
import * as nurseService from "./nurse.service.js";

export async function listNurses(_req: Request, res: Response) {
  const nurses = await nurseService.listNurses();
  return ok(res, nurses);
}

export async function createNurse(req: Request, res: Response) {
  const nurse = await nurseService.createNurse(req.body);
  return created(res, nurse, "Perawat berhasil dibuat");
}

export async function deleteNurse(req: Request, res: Response) {
  const nurse = await nurseService.deleteNurse(req.params.id);
  return ok(res, nurse, "Perawat berhasil dihapus");
}
