import { Router } from "express";
import { Prisma, RoleName } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { STAFF_ROLES } from "../../constants/roles.js";
import { writeAuditLog } from "../../middleware/audit.middleware.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { ok } from "../../utils/api-response.js";
import { hasPaginationQuery, paginationMeta, parsePagination } from "../../utils/pagination.js";
import { emitResourceEvent } from "../../socket/socket.js";

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
userRoutes.get("/", authorize(STAFF_ROLES), async (req, res) => {
  const select = { id: true, name: true, email: true, phone: true, isActive: true, role: { select: { name: true } }, createdAt: true };

  if (!hasPaginationQuery(req.query)) {
    const users = await prisma.user.findMany({
      select,
      orderBy: { createdAt: "desc" }
    });
    return ok(res, users);
  }

  const paging = parsePagination(req.query);
  const where: Prisma.UserWhereInput | undefined = paging.search
    ? {
        OR: [
          { name: { contains: paging.search, mode: "insensitive" } },
          { email: { contains: paging.search, mode: "insensitive" } },
          { phone: { contains: paging.search, mode: "insensitive" } }
        ]
      }
    : undefined;
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select,
      orderBy: { createdAt: "desc" },
      skip: (paging.page - 1) * paging.limit,
      take: paging.limit
    })
  ]);

  return ok(res, { items: users, meta: paginationMeta(paging, total) });
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
  await writeAuditLog(req, "UPDATE_USER", "users", user.id, { email: user.email, isActive: user.isActive });
  emitResourceEvent("users", "update", { id: user.id });
  return ok(res, user, "User berhasil diperbarui");
});

userRoutes.delete("/:id", authorize([RoleName.ADMIN]), async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: false },
    select: { id: true, name: true, email: true, isActive: true }
  });
  await writeAuditLog(req, "DEACTIVATE_USER", "users", user.id, { email: user.email });
  emitResourceEvent("users", "update", { id: user.id });
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

  await writeAuditLog(req, "DELETE_USER_PERMANENT", "users", user.id, { email: user.email });
  emitResourceEvent("users", "delete", { id: user.id });
  return ok(res, user, "User berhasil dihapus permanen");
});
