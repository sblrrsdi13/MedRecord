import { Router } from "express";
import { ADMIN_ROLES } from "../../constants/roles.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createDoctor, deleteDoctor, listDoctors, updateDoctor } from "./doctor.controller.js";
import { createDoctorSchema, updateDoctorSchema } from "./doctor.schema.js";

export const doctorRoutes = Router();

doctorRoutes.use(authenticate);
doctorRoutes.get("/", listDoctors);
doctorRoutes.post("/", authorize(ADMIN_ROLES), validate(createDoctorSchema), createDoctor);
doctorRoutes.put("/:id", authorize(ADMIN_ROLES), validate(updateDoctorSchema), updateDoctor);
doctorRoutes.delete("/:id", authorize(ADMIN_ROLES), deleteDoctor);
