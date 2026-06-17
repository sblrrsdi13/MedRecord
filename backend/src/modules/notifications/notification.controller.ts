import type { Request, Response } from "express";
import { created, ok } from "../../utils/api-response.js";
import { emitNotificationEvent } from "../../socket/socket.js";
import * as notificationService from "./notification.service.js";

export async function listNotifications(req: Request, res: Response) {
  return ok(res, await notificationService.listNotifications(req.user!.id));
}

export async function sendNotification(req: Request, res: Response) {
  const { title, message, type } = req.body;
  const result = await notificationService.sendNotifications(req.user!, req.body);

  if (result.recipients.length === 0) {
    return ok(res, { sent: 0 }, "Tidak ada penerima aktif untuk notifikasi ini");
  }

  result.notifications.forEach((notification) => {
    emitNotificationEvent("notification:new", {
      recipientId: notification.recipientId,
      notification: {
        id: notification.id,
        title,
        message,
        type,
        readAt: null,
        createdAt: new Date().toISOString(),
        sender: {
          id: req.user!.id,
          name: req.user!.email,
          email: req.user!.email,
          role: req.user!.role
        }
      }
    });
  });

  return created(res, { sent: result.recipients.length }, "Notifikasi berhasil dikirim");
}

export async function markNotificationRead(req: Request, res: Response) {
  const notification = await notificationService.markNotificationRead(req.params.id, req.user!.id);
  return ok(res, notification, "Notifikasi ditandai sudah dibaca");
}

export async function clearNotifications(req: Request, res: Response) {
  const result = await notificationService.clearNotifications(req.user!.id);
  emitNotificationEvent("notification:cleared", { recipientId: req.user!.id });
  return ok(res, result, "Semua notifikasi berhasil dihapus");
}

export async function deleteNotification(req: Request, res: Response) {
  const result = await notificationService.deleteNotification(req.params.id, req.user!.id);
  emitNotificationEvent("notification:deleted", { recipientId: req.user!.id, id: req.params.id });
  return ok(res, result, "Notifikasi berhasil dihapus");
}
