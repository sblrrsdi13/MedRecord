import { Router } from "express";
import { OPERATIONAL_ROLES } from "../../constants/roles.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createPrescription, deletePrescription, listPrescriptions, updatePrescription } from "./prescription.controller.js";
import { createPrescriptionSchema, updatePrescriptionSchema } from "./prescription.schema.js";

export const prescriptionRoutes = Router();

prescriptionRoutes.use(authenticate, authorize(OPERATIONAL_ROLES));
prescriptionRoutes.get("/", listPrescriptions);
prescriptionRoutes.post("/", validate(createPrescriptionSchema), createPrescription);
prescriptionRoutes.put("/:id", validate(updatePrescriptionSchema), updatePrescription);
prescriptionRoutes.delete("/:id", deletePrescription);
