import { Router } from "express";
import { OPERATIONAL_ROLES } from "../../constants/roles.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { getDashboardSummary } from "./dashboard.controller.js";

export const dashboardRoutes = Router();

dashboardRoutes.use(authenticate, authorize(OPERATIONAL_ROLES));
dashboardRoutes.get("/summary", getDashboardSummary);
