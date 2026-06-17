import type { Request, Response } from "express";
import { created, ok } from "../../utils/api-response.js";
import * as announcementService from "./announcement.service.js";

export async function listAnnouncements(req: Request, res: Response) {
  const announcements = await announcementService.listAnnouncements(req.user!.role);
  return ok(res, announcements);
}

export async function createAnnouncement(req: Request, res: Response) {
  const announcement = await announcementService.createAnnouncement(req.body, req.user!.id);
  return created(res, announcement, "Konten portal pasien berhasil dibuat");
}

export async function updateAnnouncement(req: Request, res: Response) {
  const announcement = await announcementService.updateAnnouncement(req.params.id, req.body);
  return ok(res, announcement, "Konten portal pasien berhasil diperbarui");
}

export async function deleteAnnouncement(req: Request, res: Response) {
  const result = await announcementService.deleteAnnouncement(req.params.id);
  return ok(res, result, "Konten portal pasien berhasil dihapus");
}
