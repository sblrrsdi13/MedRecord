import { z } from "zod";

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    phone: z.string().max(30).optional().or(z.literal("")),
    isActive: z.boolean()
  })
});

export type UpdateUserPayload = z.infer<typeof updateUserSchema>["body"];
