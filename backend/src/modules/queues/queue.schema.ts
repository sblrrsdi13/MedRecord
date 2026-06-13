import { z } from "zod";
import { idParams, paginationQuery } from "../../validations/common.schema.js";

export const listQueuesSchema = z.object({
  query: paginationQuery.extend({
    polyclinicId: z.string().uuid().optional(),
    status: z.enum(["waiting", "called", "in_progress", "skipped", "completed", "cancelled"]).optional()
  })
});

export const createQueueSchema = z.object({
  body: z.object({
    polyclinicId: z.string().uuid(),
    patientId: z.string().uuid().optional(),
    visitId: z.string().uuid().optional()
  })
});

export const queueActionSchema = z.object({ params: idParams });
