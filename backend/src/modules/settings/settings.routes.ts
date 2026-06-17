import { Router } from "express";
import { RoleName } from "@prisma/client";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { getCms, getCmsMonitoring, getLegacySettings, getPublicSettings, updateCms } from "./settings.controller.js";

export const settingsRoutes = Router();

settingsRoutes.get("/public", getPublicSettings);
settingsRoutes.use(authenticate, authorize([RoleName.ADMIN]));
settingsRoutes.get("/", getLegacySettings);
settingsRoutes.get("/cms", getCms);
settingsRoutes.get("/monitoring", getCmsMonitoring);
settingsRoutes.put("/cms", updateCms);
