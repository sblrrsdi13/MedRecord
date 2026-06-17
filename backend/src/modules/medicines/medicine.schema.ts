import { z } from "zod";

export const medicineSchema = z.object({
  body: z.object({
    code: z.string().min(2),
    name: z.string().min(2),
    unit: z.string().min(1),
    price: z.coerce.number().nonnegative(),
    stock: z.coerce.number().int().nonnegative().default(0),
    minStock: z.coerce.number().int().nonnegative().default(5)
  })
});

export const createMedicineSchema = medicineSchema;
export const updateMedicineSchema = medicineSchema;

export type MedicinePayload = z.infer<typeof medicineSchema>["body"];
