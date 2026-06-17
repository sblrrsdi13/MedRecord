import { Router } from "express";
import { RoleName } from "@prisma/client";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { getPatientPortalMe, payPatientInvoice, updatePatientProfile } from "./patient-portal.controller.js";

export const patientPortalRoutes = Router();

patientPortalRoutes.use(authenticate, authorize([RoleName.PATIENT]));
patientPortalRoutes.get("/me", getPatientPortalMe);
patientPortalRoutes.patch("/payments/:id/pay", payPatientInvoice);
patientPortalRoutes.patch("/profile", updatePatientProfile);
