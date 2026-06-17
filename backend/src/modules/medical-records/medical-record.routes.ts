import { Router } from "express";
import { OPERATIONAL_ROLES } from "../../constants/roles.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createMedicalRecord, deleteMedicalRecord, listMedicalRecords, updateMedicalRecord } from "./medical-record.controller.js";
import { medicalRecordSchema } from "./medical-record.schema.js";

export const medicalRecordRoutes = Router();

medicalRecordRoutes.use(authenticate);
medicalRecordRoutes.get("/", authorize(OPERATIONAL_ROLES), listMedicalRecords);
medicalRecordRoutes.post("/", authorize(OPERATIONAL_ROLES), validate(medicalRecordSchema), createMedicalRecord);
medicalRecordRoutes.put("/:id", authorize(OPERATIONAL_ROLES), validate(medicalRecordSchema), updateMedicalRecord);
medicalRecordRoutes.delete("/:id", authorize(OPERATIONAL_ROLES), deleteMedicalRecord);
