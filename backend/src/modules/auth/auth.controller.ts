import type { Request, Response } from "express";
import { isProduction } from "../../config/env.js";
import { created, ok } from "../../utils/api-response.js";
import * as authService from "./auth.service.js";

const cookieName = "clinic_refresh_token";

function setRefreshCookie(res: Response, token: string) {
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/api/v1/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.body.email, req.body.password);
  setRefreshCookie(res, result.refreshToken);
  return ok(res, { accessToken: result.accessToken, user: result.user }, "Login berhasil");
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[cookieName];
  const result = await authService.refresh(token);
  return ok(res, result, "Token diperbarui");
}

export async function logout(req: Request, res: Response) {
  await authService.logout(req.cookies?.[cookieName]);
  res.clearCookie(cookieName, { path: "/api/v1/auth" });
  return ok(res, null, "Logout berhasil");
}

export async function register(req: Request, res: Response) {
  const user = await authService.registerUser(req.body);
  return created(res, user, "User berhasil dibuat");
}

export async function registerPatient(req: Request, res: Response) {
  const user = await authService.registerPatient(req.body);
  return created(res, user, "Akun dan data pasien berhasil dibuat. Silakan login ke portal pasien.");
}

export async function me(req: Request, res: Response) {
  const user = await authService.getMe(req.user!.id);
  return ok(res, user);
}

export async function updateProfile(req: Request, res: Response) {
  const user = await authService.updateProfile(req.user!.id, req.body);
  return ok(res, user, "Profile berhasil diperbarui");
}

export async function changePassword(req: Request, res: Response) {
  const result = await authService.changePassword(req.user!.id, req.body);
  res.clearCookie(cookieName, { path: "/api/v1/auth" });
  return ok(res, result, "Password berhasil diganti. Silakan login ulang.");
}
