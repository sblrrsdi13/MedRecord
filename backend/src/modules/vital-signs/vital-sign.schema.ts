import { z } from "zod";

export const vitalSignSchema = z.object({
  body: z.object({
    visitId: z.string().uuid(),
    patientId: z.string().uuid(),
    temperature: z.coerce.number().optional(),
    bloodPressure: z.string().max(20).optional(),
    pulse: z.coerce.number().int().optional(),
    respiration: z.coerce.number().int().optional(),
    weight: z.coerce.number().optional(),
    height: z.coerce.number().optional(),
    notes: z.string().max(500).optional()
  })
});

export const createVitalSignSchema = vitalSignSchema;
export const updateVitalSignSchema = vitalSignSchema;

export type VitalSignPayload = z.infer<typeof vitalSignSchema>["body"];
