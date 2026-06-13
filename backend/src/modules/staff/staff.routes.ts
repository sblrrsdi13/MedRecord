import { Router } from "express";
import { RoleName } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { created, ok } from "../../utils/api-response.js";

export const staffRoutes = Router();

const createSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    position: z.string().min(2).max(80)
  })
});

staffRoutes.use(authenticate, authorize([RoleName.ADMIN]));
staffRoutes.get("/", async (_req, res) => {
  const staff = await prisma.staff.findMany({
    include: { user: { select: { id: true, name: true, email: true, phone: true, isActive: true } } },
    orderBy: { createdAt: "desc" }
  });
  return ok(res, staff);
});
staffRoutes.post("/", validate(createSchema), async (req, res) => created(res, await prisma.staff.create({ data: req.body }), "Staff berhasil dibuat"));
staffRoutes.delete("/:id", async (req, res) => ok(res, await prisma.staff.delete({ where: { id: req.params.id } }), "Staff berhasil dihapus"));
