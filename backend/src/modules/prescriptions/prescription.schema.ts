import { z } from "zod";

const prescriptionItemSchema = z.object({
  medicineId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1),
  dosage: z.string().min(1),
  instruction: z.string().optional()
});

export const createPrescriptionSchema = z.object({
  body: z.object({
    medicalRecordId: z.string().uuid(),
    medicineId: z.string().uuid().optional(),
    quantity: z.coerce.number().int().min(1).optional(),
    dosage: z.string().min(1).optional(),
    instruction: z.string().optional(),
    items: z.array(prescriptionItemSchema).min(1).optional()
  }).refine((value) => value.items?.length || (value.medicineId && value.quantity && value.dosage), {
    message: "Minimal satu obat harus diisi",
    path: ["items"]
  })
});

export const updatePrescriptionSchema = z.object({
  body: z.object({
    status: z.enum(["draft", "issued", "dispensed", "cancelled"])
  })
});

export type CreatePrescriptionPayload = z.infer<typeof createPrescriptionSchema>["body"];
export type UpdatePrescriptionPayload = z.infer<typeof updatePrescriptionSchema>["body"];
