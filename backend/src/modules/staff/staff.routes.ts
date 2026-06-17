import { Router } from "express";
import { RoleName } from "@prisma/client";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createStaff, deleteStaff, listStaff } from "./staff.controller.js";
import { createStaffSchema } from "./staff.schema.js";

export const staffRoutes = Router();

staffRoutes.use(authenticate, authorize([RoleName.ADMIN]));
staffRoutes.get("/", listStaff);
staffRoutes.post("/", validate(createStaffSchema), createStaff);
staffRoutes.delete("/:id", deleteStaff);
