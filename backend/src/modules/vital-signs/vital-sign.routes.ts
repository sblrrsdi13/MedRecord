import { Router } from "express";
import { OPERATIONAL_ROLES } from "../../constants/roles.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createVitalSign, deleteVitalSign, listVitalSigns, updateVitalSign } from "./vital-sign.controller.js";
import { createVitalSignSchema, updateVitalSignSchema } from "./vital-sign.schema.js";

export const vitalSignRoutes = Router();

vitalSignRoutes.use(authenticate, authorize(OPERATIONAL_ROLES));
vitalSignRoutes.get("/", listVitalSigns);
vitalSignRoutes.post("/", validate(createVitalSignSchema), createVitalSign);
vitalSignRoutes.put("/:id", validate(updateVitalSignSchema), updateVitalSign);
vitalSignRoutes.delete("/:id", deleteVitalSign);
