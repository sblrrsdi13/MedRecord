import { Router } from "express";
import { RoleName } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { created, ok } from "../../utils/api-response.js";

export const nurseRoutes = Router();

const createSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    polyclinicId: z.string().uuid().optional()
  })
});

nurseRoutes.use(authenticate, authorize([RoleName.ADMIN]));
nurseRoutes.get("/", async (_req, res) => {
  const nurses = await prisma.nurse.findMany({
    include: { user: { select: { id: true, name: true, email: true, phone: true, isActive: true } } },
    orderBy: { createdAt: "desc" }
  });
  return ok(res, nurses);
});
nurseRoutes.post("/", validate(createSchema), async (req, res) => created(res, await prisma.nurse.create({ data: req.body }), "Perawat berhasil dibuat"));
nurseRoutes.delete("/:id", async (req, res) => ok(res, await prisma.nurse.delete({ where: { id: req.params.id } }), "Perawat berhasil dihapus"));
