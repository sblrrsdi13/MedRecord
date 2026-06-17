import { z } from "zod";

export const doctorSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    sipNumber: z.string().optional(),
    specialization: z.string().optional(),
    polyclinicId: z.string().uuid().optional()
  })
});

export const createDoctorSchema = doctorSchema;
export const updateDoctorSchema = doctorSchema;

export type DoctorPayload = z.infer<typeof doctorSchema>["body"];
