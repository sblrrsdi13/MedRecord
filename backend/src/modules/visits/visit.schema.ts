import { z } from "zod";

export const visitSchema = z.object({
  body: z.object({
    visitNo: z.string().min(3).optional(),
    patientId: z.string().uuid(),
    polyclinicId: z.string().uuid(),
    doctorId: z.string().uuid().optional(),
    complaint: z.string().optional()
  })
});

export const createVisitSchema = visitSchema;
export const updateVisitSchema = visitSchema;

export type VisitPayload = z.infer<typeof visitSchema>["body"];
