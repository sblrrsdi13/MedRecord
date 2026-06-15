import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { ADMIN_ROLES } from "../../constants/roles.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { created, ok } from "../../utils/api-response.js";
import { emitResourceEvent } from "../../socket/socket.js";

export const doctorRoutes = Router();

const createSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    sipNumber: z.string().optional(),
    specialization: z.string().optional(),
    polyclinicId: z.string().uuid().optional()
  })
});

doctorRoutes.use(authenticate);
doctorRoutes.get("/", async (_req, res) => {
  const doctors = await prisma.doctor.findMany({
    include: { user: { select: { id: true, name: true, email: true, phone: true } }, polyclinic: true },
    orderBy: { createdAt: "desc" }
  });
  return ok(res, doctors);
});
doctorRoutes.post("/", authorize(ADMIN_ROLES), validate(createSchema), async (req, res) => {
  const doctor = await prisma.doctor.create({ data: req.body });
  emitResourceEvent("doctors", "create", { id: doctor.id });
  return created(res, doctor, "Dokter berhasil dibuat");
});
doctorRoutes.put("/:id", authorize(ADMIN_ROLES), validate(createSchema), async (req, res) => {
  const doctor = await prisma.doctor.update({ where: { id: req.params.id }, data: req.body });
  emitResourceEvent("doctors", "update", { id: doctor.id });
  return ok(res, doctor, "Dokter berhasil diperbarui");
});
doctorRoutes.delete("/:id", authorize(ADMIN_ROLES), async (req, res) => {
  const doctor = await prisma.doctor.delete({ where: { id: req.params.id } });
  emitResourceEvent("doctors", "delete", { id: doctor.id });
  return ok(res, doctor, "Dokter berhasil dihapus");
});
