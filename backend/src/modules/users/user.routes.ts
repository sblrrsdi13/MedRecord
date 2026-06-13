import { Router } from "express";
import { RoleName } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { STAFF_ROLES } from "../../constants/roles.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { ok } from "../../utils/api-response.js";

export const userRoutes = Router();

const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    phone: z.string().max(30).optional().or(z.literal("")),
    isActive: z.boolean()
  })
});

userRoutes.use(authenticate);
userRoutes.get("/", authorize(STAFF_ROLES), async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, phone: true, isActive: true, role: { select: { name: true } }, createdAt: true },
    orderBy: { createdAt: "desc" }
  });
  return ok(res, users);
});

userRoutes.put("/:id", authorize([RoleName.ADMIN]), validate(updateUserSchema), async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone || null,
      isActive: req.body.isActive
    },
    select: { id: true, name: true, email: true, phone: true, isActive: true, role: { select: { name: true } }, createdAt: true }
  });
  return ok(res, user, "User berhasil diperbarui");
});

userRoutes.delete("/:id", authorize([RoleName.ADMIN]), async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: false },
    select: { id: true, name: true, email: true, isActive: true }
  });
  return ok(res, user, "User berhasil dinonaktifkan");
});

userRoutes.delete("/:id/permanent", authorize([RoleName.ADMIN]), async (req, res) => {
  if (req.user?.id === req.params.id) {
    return res.status(400).json({ success: false, message: "Tidak bisa menghapus permanen akun yang sedang digunakan" });
  }

  await prisma.refreshToken.deleteMany({ where: { userId: req.params.id } });
  const user = await prisma.user.delete({
    where: { id: req.params.id },
    select: { id: true, name: true, email: true }
  });

  return ok(res, user, "User berhasil dihapus permanen");
});
