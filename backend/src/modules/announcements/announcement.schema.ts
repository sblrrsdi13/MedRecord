import { z } from "zod";

export const announcementSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(140),
    content: z.string().min(5).max(2000),
    category: z.enum(["info", "education", "warning", "promo"]).default("info"),
    isActive: z.boolean().default(true)
  })
});

export type AnnouncementPayload = z.infer<typeof announcementSchema>["body"];
