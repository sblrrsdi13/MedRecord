import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { RoleName } from "@prisma/client";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

type AccessPayload = {
  sub: string;
  email: string;
  role: RoleName;
};

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return next(new AppError(401, "Authentication required", "UNAUTHENTICATED"));

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    return next();
  } catch {
    return next(new AppError(401, "Invalid or expired token", "INVALID_TOKEN"));
  }
}

export function authorize(roles: RoleName[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError(401, "Authentication required", "UNAUTHENTICATED"));
    if (!roles.includes(req.user.role)) return next(new AppError(403, "Forbidden access", "FORBIDDEN"));
    next();
  };
}
