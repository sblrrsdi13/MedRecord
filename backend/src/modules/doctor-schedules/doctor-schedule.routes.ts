import { Router } from "express";
import { RoleName } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { OPERATIONAL_ROLES, STAFF_ROLES } from "../../constants/roles.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { created, ok } from "../../utils/api-response.js";

export const doctorScheduleRoutes = Router();

const createSchema = z.object({
  body: z.object({
    doctorId: z.string().uuid(),
    polyclinicId: z.string().uuid(),
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    quota: z.coerce.number().int().min(1).max(300).default(30),
    isActive: z.boolean().default(true)
  })
});

doctorScheduleRoutes.use(authenticate);
doctorScheduleRoutes.get("/", authorize(STAFF_ROLES), async (req, res) => {
  const schedules = await prisma.doctorSchedule.findMany({
    where: req.user?.role === RoleName.DOCTOR ? { doctor: { userId: req.user.id } } : undefined,
    include: { doctor: { include: { user: { select: { id: true, name: true, email: true } } } }, polyclinic: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
  });
  return ok(res, schedules);
});
doctorScheduleRoutes.post("/", authorize(OPERATIONAL_ROLES), validate(createSchema), async (req, res) => {
  const schedule = await prisma.doctorSchedule.create({ data: req.body });
  return created(res, schedule, "Jadwal dokter berhasil dibuat");
});
doctorScheduleRoutes.put("/:id", authorize(OPERATIONAL_ROLES), validate(createSchema), async (req, res) => {
  const schedule = await prisma.doctorSchedule.update({ where: { id: req.params.id }, data: req.body });
  return ok(res, schedule, "Jadwal dokter berhasil diperbarui");
});
doctorScheduleRoutes.delete("/:id", authorize(OPERATIONAL_ROLES), async (req, res) => ok(res, await prisma.doctorSchedule.delete({ where: { id: req.params.id } }), "Jadwal dokter berhasil dihapus"));
