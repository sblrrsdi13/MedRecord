import { z } from "zod";
import { idParams, paginationQuery } from "../../validations/common.schema.js";

const body = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(20),
  queuePrefix: z.string().min(1).max(3),
  consultationFee: z.coerce.number().nonnegative().default(50000),
  description: z.string().max(255).optional(),
  isActive: z.boolean().default(true)
});

export const listPolyclinicsSchema = z.object({ query: paginationQuery });
export const createPolyclinicSchema = z.object({ body });
export const updatePolyclinicSchema = z.object({ params: idParams, body: body.partial() });
