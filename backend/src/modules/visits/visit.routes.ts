import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { created, ok } from "../../utils/api-response.js";
import { OPERATIONAL_ROLES } from "../../constants/roles.js";
import { generateVisitNo } from "../../utils/numbering.js";

export const visitRoutes = Router();

const createVisitSchema = z.object({
  body: z.object({
    visitNo: z.string().min(3).optional(),
    patientId: z.string().uuid(),
    polyclinicId: z.string().uuid(),
    doctorId: z.string().uuid().optional(),
    complaint: z.string().optional()
  })
});

visitRoutes.use(authenticate);
visitRoutes.get("/", async (_req, res) => {
  const visits = await prisma.visit.findMany({
    include: { patient: true, doctor: { include: { user: true } }, polyclinic: true, queue: true, payment: true },
    orderBy: { visitDate: "desc" },
    take: 50
  });
  return ok(res, visits);
});

visitRoutes.post("/", authorize(OPERATIONAL_ROLES), validate(createVisitSchema), async (req, res) => {
  const visit = await prisma.$transaction(async (tx) => {
    const visitNo = req.body.visitNo || await generateVisitNo(tx);
    return tx.visit.create({ data: { ...req.body, visitNo } });
  });
  return created(res, visit, "Kunjungan berhasil dibuat");
});

visitRoutes.put("/:id", authorize(OPERATIONAL_ROLES), validate(createVisitSchema), async (req, res) => {
  const visit = await prisma.visit.update({ where: { id: req.params.id }, data: req.body });
  return ok(res, visit, "Kunjungan berhasil diperbarui");
});

visitRoutes.delete("/:id", authorize(OPERATIONAL_ROLES), async (req, res) => ok(res, await prisma.visit.delete({ where: { id: req.params.id } }), "Kunjungan berhasil dihapus"));
