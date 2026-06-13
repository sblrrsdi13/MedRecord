import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { created, ok } from "../../utils/api-response.js";
import { OPERATIONAL_ROLES } from "../../constants/roles.js";

export const vitalSignRoutes = Router();

const createSchema = z.object({
  body: z.object({
    visitId: z.string().uuid(),
    patientId: z.string().uuid(),
    temperature: z.coerce.number().optional(),
    bloodPressure: z.string().max(20).optional(),
    pulse: z.coerce.number().int().optional(),
    respiration: z.coerce.number().int().optional(),
    weight: z.coerce.number().optional(),
    height: z.coerce.number().optional(),
    notes: z.string().max(500).optional()
  })
});

vitalSignRoutes.use(authenticate, authorize(OPERATIONAL_ROLES));
vitalSignRoutes.get("/", async (_req, res) => {
  const vitalSigns = await prisma.vitalSign.findMany({
    include: { patient: true, visit: true },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  return ok(res, vitalSigns);
});
vitalSignRoutes.post("/", validate(createSchema), async (req, res) => {
  const vitalSign = await prisma.vitalSign.create({ data: req.body });
  return created(res, vitalSign, "Vital sign berhasil dicatat");
});
vitalSignRoutes.put("/:id", validate(createSchema), async (req, res) => {
  const vitalSign = await prisma.vitalSign.update({ where: { id: req.params.id }, data: req.body });
  return ok(res, vitalSign, "Vital sign berhasil diperbarui");
});
vitalSignRoutes.delete("/:id", async (req, res) => ok(res, await prisma.vitalSign.delete({ where: { id: req.params.id } }), "Vital sign berhasil dihapus"));
