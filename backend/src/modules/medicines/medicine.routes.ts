import { Router } from "express";
import { OPERATIONAL_ROLES } from "../../constants/roles.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createMedicine, deleteMedicine, listMedicines, updateMedicine } from "./medicine.controller.js";
import { createMedicineSchema, updateMedicineSchema } from "./medicine.schema.js";

export const medicineRoutes = Router();

medicineRoutes.use(authenticate, authorize(OPERATIONAL_ROLES));
medicineRoutes.get("/", listMedicines);
medicineRoutes.post("/", validate(createMedicineSchema), createMedicine);
medicineRoutes.put("/:id", validate(updateMedicineSchema), updateMedicine);
medicineRoutes.delete("/:id", deleteMedicine);
