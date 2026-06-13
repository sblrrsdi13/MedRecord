import type { NextFunction, Request, Response } from "express";
import { sanitizeValue } from "../utils/sanitize.js";

export function sanitizeBody(req: Request, _res: Response, next: NextFunction) {
  if (req.body) req.body = sanitizeValue(req.body);
  next();
}
