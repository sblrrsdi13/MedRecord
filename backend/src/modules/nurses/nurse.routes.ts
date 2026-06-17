import { Router } from "express";
import { RoleName } from "@prisma/client";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createNurse, deleteNurse, listNurses } from "./nurse.controller.js";
import { createNurseSchema } from "./nurse.schema.js";

export const nurseRoutes = Router();

nurseRoutes.use(authenticate, authorize([RoleName.ADMIN]));
nurseRoutes.get("/", listNurses);
nurseRoutes.post("/", validate(createNurseSchema), createNurse);
nurseRoutes.delete("/:id", deleteNurse);
