import { randomUUID } from "node:crypto";
import { prisma } from "../../config/prisma.js";
import type { SendNotificationPayload, NotificationRow } from "./notification.schema.js";

function mapNotification(row: NotificationRow) {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    readAt: row.readAt,
    createdAt: row.createdAt,
    sender: row.senderId ? { id: row.senderId, name: row.senderName, email: row.senderEmail, role: row.senderRole } : null
  };
}

export async function listNotifications(userId: string) {
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
    where n.recipient_id = ${userId}
    order by n.created_at desc
    limit 30
  `;

  return rows.map(mapNotification);
}

export async function sendNotifications(sender: NonNullable<Express.Request["user"]>, input: SendNotificationPayload) {
  const recipients = input.recipientId
    ? await prisma.user.findMany({ where: { id: input.recipientId, isActive: true }, select: { id: true } })
    : await prisma.user.findMany({
        where: { isActive: true, ...(input.targetRole ? { role: { name: input.targetRole } } : {}) },
        select: { id: true }
      });

  if (recipients.length === 0) {
    return { recipients, notifications: [] };
  }

  const notifications = recipients.map((recipient) => ({
    id: randomUUID(),
    recipientId: recipient.id
  }));

  await prisma.$transaction(
    notifications.map((notification) =>
      prisma.$executeRaw`
        insert into notifications (id, title, message, type, sender_id, recipient_id, created_at)
        values (${notification.id}, ${input.title}, ${input.message}, ${input.type}, ${sender.id}, ${notification.recipientId}, now())
      `
    )
  );

  await prisma.auditLog.create({
    data: {
      userId: sender.id,
      action: "SEND_NOTIFICATION",
      resource: "notifications",
      metadata: { title: input.title, type: input.type, recipientId: input.recipientId, targetRole: input.targetRole, sent: recipients.length }
    }
  });

  return { recipients, notifications };
}

export async function markNotificationRead(id: string, userId: string) {
  const rows = await prisma.$queryRaw<NotificationRow[]>`
    update notifications
    set read_at = now()
    where id = ${id} and recipient_id = ${userId}
    returning id, title, message, type, read_at as "readAt", created_at as "createdAt", sender_id as "senderId", null as "senderName", null as "senderEmail", null as "senderRole"
  `;

  return rows[0] ?? null;
}

export async function clearNotifications(userId: string) {
  await prisma.$executeRaw`
    delete from notifications
    where recipient_id = ${userId}
  `;
  return { cleared: true };
}

export async function deleteNotification(id: string, userId: string) {
  await prisma.$executeRaw`
    delete from notifications
    where id = ${id} and recipient_id = ${userId}
  `;
  return { deleted: true };
}
