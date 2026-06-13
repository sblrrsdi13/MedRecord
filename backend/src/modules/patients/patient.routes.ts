import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createPatientSchema, listPatientsSchema, updatePatientSchema } from "./patient.schema.js";
import * as controller from "./patient.controller.js";
import { OPERATIONAL_ROLES } from "../../constants/roles.js";

export const patientRoutes = Router();

patientRoutes.use(authenticate);
patientRoutes.get("/", authorize(OPERATIONAL_ROLES), validate(listPatientsSchema), controller.index);
patientRoutes.post("/", authorize(OPERATIONAL_ROLES), validate(createPatientSchema), controller.store);
patientRoutes.put("/:id", authorize(OPERATIONAL_ROLES), validate(updatePatientSchema), controller.update);
patientRoutes.delete("/:id", authorize(OPERATIONAL_ROLES), async (req, res) => {
  const patient = await import("../../config/prisma.js").then(({ prisma }) => prisma.patient.delete({ where: { id: req.params.id } }));
  return res.json({ success: true, message: "Pasien berhasil dihapus", data: patient });
});
