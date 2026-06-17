import { Router } from "express";
import { RoleName } from "@prisma/client";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { exportReportCsv, getDetailedReport, getReportSummary } from "./report.controller.js";

export const reportRoutes = Router();

reportRoutes.use(authenticate, authorize([RoleName.ADMIN]));
reportRoutes.get("/summary", getReportSummary);
reportRoutes.get("/detailed", getDetailedReport);
reportRoutes.get("/export.csv", exportReportCsv);
