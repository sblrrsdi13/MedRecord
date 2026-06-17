import type { Request, Response } from "express";
import { emitCmsEvent } from "../../socket/socket.js";
import { ok } from "../../utils/api-response.js";
import { cmsSchema } from "./settings.schema.js";
import * as settingsService from "./settings.service.js";

export async function getPublicSettings(_req: Request, res: Response) {
  return ok(res, await settingsService.getCms());
}

export async function getLegacySettings(_req: Request, res: Response) {
  return ok(res, settingsService.getLegacySettings());
}

export async function getCms(_req: Request, res: Response) {
  return ok(res, await settingsService.getCms());
}

export async function getCmsMonitoring(_req: Request, res: Response) {
  return ok(res, await settingsService.getCmsMonitoring());
}

export async function updateCms(req: Request, res: Response) {
  const payload = cmsSchema.parse(req.body);
  const settings = await settingsService.updateCms(payload);
  emitCmsEvent({ settings });
  return ok(res, settings, "CMS settings saved");
}
