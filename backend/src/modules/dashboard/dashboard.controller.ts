import type { Request, Response } from "express";
import { ok } from "../../utils/api-response.js";
import * as dashboardService from "./dashboard.service.js";

export async function getDashboardSummary(_req: Request, res: Response) {
  const summary = await dashboardService.getDashboardSummary();
  return ok(res, summary);
}
