import type { Request, Response } from "express";
import { writeAuditLog } from "../../middleware/audit.middleware.js";
import { ok } from "../../utils/api-response.js";
import { emitResourceEvent } from "../../socket/socket.js";
import * as userService from "./user.service.js";

export async function listUsers(req: Request, res: Response) {
  const result = await userService.listUsers(req.query as Record<string, unknown>);
  return ok(res, result);
}

export async function updateUser(req: Request, res: Response) {
  const user = await userService.updateUser(req.params.id, req.body);
  await writeAuditLog(req, "UPDATE_USER", "users", user.id, { email: user.email, isActive: user.isActive });
  emitResourceEvent("users", "update", { id: user.id });
  return ok(res, user, "User berhasil diperbarui");
}

export async function deactivateUser(req: Request, res: Response) {
  const user = await userService.deactivateUser(req.params.id);
  await writeAuditLog(req, "DEACTIVATE_USER", "users", user.id, { email: user.email });
  emitResourceEvent("users", "update", { id: user.id });
  return ok(res, user, "User berhasil dinonaktifkan");
}

export async function deleteUserPermanent(req: Request, res: Response) {
  if (req.user?.id === req.params.id) {
    return res.status(400).json({ success: false, message: "Tidak bisa menghapus permanen akun yang sedang digunakan" });
  }

  const user = await userService.deleteUserPermanent(req.params.id);
  await writeAuditLog(req, "DELETE_USER_PERMANENT", "users", user.id, { email: user.email });
  emitResourceEvent("users", "delete", { id: user.id });
  return ok(res, user, "User berhasil dihapus permanen");
}
