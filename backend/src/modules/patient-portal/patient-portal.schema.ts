import { z } from "zod";

export const patientProfileSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(8).max(30).optional().or(z.literal("")),
  nik: z.string().min(8).max(32),
  birthDate: z.coerce.date(),
  gender: z.enum(["MALE", "FEMALE"]),
  bloodType: z.string().max(5).optional().or(z.literal("")),
  address: z.string().min(5).max(500),
  allergyNotes: z.string().max(500).optional().or(z.literal(""))
});

export type PatientProfilePayload = z.infer<typeof patientProfileSchema>;
