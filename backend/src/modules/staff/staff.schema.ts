import { z } from "zod";

export const staffSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    position: z.string().min(2).max(80)
  })
});

export const createStaffSchema = staffSchema;

export type StaffPayload = z.infer<typeof staffSchema>["body"];
