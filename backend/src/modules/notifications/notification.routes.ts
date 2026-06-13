import { randomUUID } from "node:crypto";
import { Router } from "express";
import { RoleName } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { STAFF_ROLES } from "../../constants/roles.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { created, ok } from "../../utils/api-response.js";
import { emitNotificationEvent } from "../../socket/socket.js";

export const notificationRoutes = Router();

const sendNotificationSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(120),
    message: z.string().min(3).max(1000),
    type: z.enum(["info", "success", "warning", "danger"]).default("info"),
    recipientId: z.string().uuid().optional(),
    targetRole: z.nativeEnum(RoleName).optional()
  })
});

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "danger";
  readAt: Date | null;
  createdAt: Date;
  senderId: string | null;
  senderName: string | null;
  senderEmail: string | null;
  senderRole: RoleName | null;
};

notificationRoutes.use(authenticate);

notificationRoutes.get("/", async (req, res) => {
  const rows = await prisma.$queryRaw<NotificationRow[]>`
    select
      n.id,
      n.title,
      n.message,
      n.type,
      n.read_at as "readAt",
      n.created_at as "createdAt",
      u.id as "senderId",
      u.name as "senderName",
      u.email as "senderEmail",
      r.name as "senderRole"
    from notifications n
    left join users u on u.id = n.sender_id
    left join roles r on r.id = u.role_id
    where n.recipient_id = ${req.user!.id}
    order by n.created_at desc
    limit 30
  `;

  return ok(res, rows.map((row) => ({
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    readAt: row.readAt,
    createdAt: row.createdAt,
    sender: row.senderId ? { id: row.senderId, name: row.senderName, email: row.senderEmail, role: row.senderRole } : null
  })));
});

notificationRoutes.post(
  "/",
  authorize(STAFF_ROLES),
  validate(sendNotificationSchema),
  async (req, res) => {
    const { title, message, type, recipientId, targetRole } = req.body as z.infer<typeof sendNotificationSchema>["body"];

    const recipients = recipientId
      ? await prisma.user.findMany({ where: { id: recipientId, isActive: true }, select: { id: true } })
      : await prisma.user.findMany({
          where: { isActive: true, ...(targetRole ? { role: { name: targetRole } } : {}) },
          select: { id: true }
        });

    if (recipients.length === 0) {
      return ok(res, { sent: 0 }, "Tidak ada penerima aktif untuk notifikasi ini");
    }

    const notifications = recipients.map((recipient) => ({
      id: randomUUID(),
      recipientId: recipient.id
    }));

    await prisma.$transaction(
      notifications.map((notification) =>
        prisma.$executeRaw`
          insert into notifications (id, title, message, type, sender_id, recipient_id, created_at)
          values (${notification.id}, ${title}, ${message}, ${type}, ${req.user!.id}, ${notification.recipientId}, now())
        `
      )
    );

    notifications.forEach((notification) => {
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

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: "SEND_NOTIFICATION",
        resource: "notifications",
        metadata: { title, type, recipientId, targetRole, sent: recipients.length }
      }
    });

    return created(res, { sent: recipients.length }, "Notifikasi berhasil dikirim");
  }
);

notificationRoutes.patch("/:id/read", async (req, res) => {
  const rows = await prisma.$queryRaw<NotificationRow[]>`
    update notifications
    set read_at = now()
    where id = ${req.params.id} and recipient_id = ${req.user!.id}
    returning id, title, message, type, read_at as "readAt", created_at as "createdAt", sender_id as "senderId", null as "senderName", null as "senderEmail", null as "senderRole"
  `;

  return ok(res, rows[0] ?? null, "Notifikasi ditandai sudah dibaca");
});

notificationRoutes.delete("/", async (req, res) => {
  await prisma.$executeRaw`
    delete from notifications
    where recipient_id = ${req.user!.id}
  `;
  emitNotificationEvent("notification:cleared", { recipientId: req.user!.id });
  return ok(res, { cleared: true }, "Semua notifikasi berhasil dihapus");
});

notificationRoutes.delete("/:id", async (req, res) => {
  await prisma.$executeRaw`
    delete from notifications
    where id = ${req.params.id} and recipient_id = ${req.user!.id}
  `;
  emitNotificationEvent("notification:deleted", { recipientId: req.user!.id, id: req.params.id });
  return ok(res, { deleted: true }, "Notifikasi berhasil dihapus");
});
