import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { OPERATIONAL_ROLES } from "../../constants/roles.js";
import { createVisit, deleteVisit, listVisits, updateVisit } from "./visit.controller.js";
import { createVisitSchema, updateVisitSchema } from "./visit.schema.js";

export const visitRoutes = Router();

visitRoutes.use(authenticate);
visitRoutes.get("/", authorize(OPERATIONAL_ROLES), listVisits);
visitRoutes.post("/", authorize(OPERATIONAL_ROLES), validate(createVisitSchema), createVisit);
visitRoutes.put("/:id", authorize(OPERATIONAL_ROLES), validate(updateVisitSchema), updateVisit);
visitRoutes.delete("/:id", authorize(OPERATIONAL_ROLES), deleteVisit);
