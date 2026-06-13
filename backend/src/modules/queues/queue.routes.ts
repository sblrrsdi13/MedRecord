import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createQueueSchema, listQueuesSchema, queueActionSchema } from "./queue.schema.js";
import * as controller from "./queue.controller.js";
import { OPERATIONAL_ROLES } from "../../constants/roles.js";

export const queueRoutes = Router();

queueRoutes.use(authenticate);
queueRoutes.get("/", validate(listQueuesSchema), controller.index);
queueRoutes.post("/", authorize(OPERATIONAL_ROLES), validate(createQueueSchema), controller.store);
queueRoutes.patch("/:id/call", authorize(OPERATIONAL_ROLES), validate(queueActionSchema), controller.call);
queueRoutes.patch("/:id/recall", authorize(OPERATIONAL_ROLES), validate(queueActionSchema), controller.recall);
queueRoutes.patch("/:id/skip", authorize(OPERATIONAL_ROLES), validate(queueActionSchema), controller.skip);
queueRoutes.patch("/:id/complete", authorize(OPERATIONAL_ROLES), validate(queueActionSchema), controller.complete);
queueRoutes.patch("/:id/cancel", authorize(OPERATIONAL_ROLES), validate(queueActionSchema), controller.cancel);
