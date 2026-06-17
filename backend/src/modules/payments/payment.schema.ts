import { z } from "zod";

export const createPaymentSchema = z.object({
  body: z.object({
    invoiceNo: z.string().min(3).optional(),
    visitId: z.string().uuid(),
    subtotal: z.coerce.number().nonnegative(),
    discount: z.coerce.number().nonnegative().default(0),
    total: z.coerce.number().nonnegative(),
    paidAmount: z.coerce.number().nonnegative().default(0),
    paymentMethod: z.enum(["CASH", "TRANSFER"]).optional(),
    status: z.enum(["unpaid", "partial", "paid", "void"]).default("unpaid")
  })
});

export const payReadySchema = z.object({
  body: z.object({
    visitId: z.string().uuid(),
    discount: z.coerce.number().nonnegative().default(0),
    paymentMethod: z.enum(["CASH", "TRANSFER", "BPJS"]),
    paidAmount: z.coerce.number().nonnegative().optional()
  })
});

export type CreatePaymentPayload = z.infer<typeof createPaymentSchema>["body"];
export type PayReadyPayload = z.infer<typeof payReadySchema>["body"];
