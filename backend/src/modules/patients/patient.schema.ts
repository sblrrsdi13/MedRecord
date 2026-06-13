import { z } from "zod";
import { idParams, paginationQuery } from "../../validations/common.schema.js";

const patientBody = z.object({
  medicalRecordNo: z.string().min(3).max(40).optional().or(z.literal("")),
  userId: z.string().uuid().optional(),
  name: z.string().min(2).max(120),
  nik: z.string().min(8).max(32).optional(),
  gender: z.enum(["MALE", "FEMALE"]),
  birthDate: z.coerce.date(),
  phone: z.string().max(30).optional(),
  address: z.string().max(255).optional(),
  bloodType: z.string().max(4).optional(),
  allergyNotes: z.string().max(500).optional()
});

export const listPatientsSchema = z.object({ query: paginationQuery });
export const createPatientSchema = z.object({ body: patientBody });
export const updatePatientSchema = z.object({ params: idParams, body: patientBody.partial() });
