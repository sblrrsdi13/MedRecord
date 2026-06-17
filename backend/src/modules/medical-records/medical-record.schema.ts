import { z } from "zod";

export const medicalRecordSchema = z.object({
  body: z.object({
    visitId: z.string().uuid(),
    patientId: z.string().uuid().optional(),
    doctorId: z.string().uuid().optional(),
    anamnesis: z.string().optional(),
    diagnosis: z.string().min(2),
    treatment: z.string().optional(),
    treatmentFee: z.coerce.number().nonnegative().default(0),
    notes: z.string().optional()
  })
});

export type MedicalRecordPayload = z.infer<typeof medicalRecordSchema>["body"];
