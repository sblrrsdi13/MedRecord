import { Router } from "express";
import { RoleName } from "@prisma/client";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { changePasswordSchema, loginSchema, patientRegisterSchema, registerSchema, updateProfileSchema } from "./auth.schema.js";
import * as controller from "./auth.controller.js";

export const authRoutes = Router();

authRoutes.post("/login", validate(loginSchema), controller.login);
authRoutes.post("/refresh", controller.refresh);
authRoutes.post("/logout", controller.logout);
authRoutes.post("/patient-register", validate(patientRegisterSchema), controller.registerPatient);
authRoutes.post("/register", authenticate, authorize([RoleName.ADMIN]), validate(registerSchema), controller.register);
authRoutes.get("/me", authenticate, controller.me);
authRoutes.put("/profile", authenticate, validate(updateProfileSchema), controller.updateProfile);
authRoutes.put("/change-password", authenticate, validate(changePasswordSchema), controller.changePassword);
