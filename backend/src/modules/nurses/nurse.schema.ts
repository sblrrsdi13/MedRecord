import { z } from "zod";

export const nurseSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    polyclinicId: z.string().uuid().optional()
  })
});

export const createNurseSchema = nurseSchema;

export type NursePayload = z.infer<typeof nurseSchema>["body"];
