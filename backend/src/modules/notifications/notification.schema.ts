import { RoleName } from "@prisma/client";
import { z } from "zod";

export const sendNotificationSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(120),
    message: z.string().min(3).max(1000),
    type: z.enum(["info", "success", "warning", "danger"]).default("info"),
    recipientId: z.string().uuid().optional(),
    targetRole: z.nativeEnum(RoleName).optional()
  })
});

export type SendNotificationPayload = z.infer<typeof sendNotificationSchema>["body"];

export type NotificationRow = {
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
