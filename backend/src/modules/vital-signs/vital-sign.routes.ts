import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { writeAuditLog } from "../../middleware/audit.middleware.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { created, ok } from "../../utils/api-response.js";
import { OPERATIONAL_ROLES } from "../../constants/roles.js";
import { hasPaginationQuery, paginationMeta, parsePagination } from "../../utils/pagination.js";
import { emitResourceEvent } from "../../socket/socket.js";

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
vitalSignRoutes.get("/", async (req, res) => {
  const include = { patient: true, visit: true };

  if (!hasPaginationQuery(req.query)) {
    const vitalSigns = await prisma.vitalSign.findMany({
      include,
      orderBy: { createdAt: "desc" },
      take: 20
    });
    return ok(res, vitalSigns);
  }

  const paging = parsePagination(req.query);
  const where: Prisma.VitalSignWhereInput | undefined = paging.search
    ? {
        OR: [
          { bloodPressure: { contains: paging.search, mode: "insensitive" } },
          { notes: { contains: paging.search, mode: "insensitive" } },
          { patient: { name: { contains: paging.search, mode: "insensitive" } } },
          { patient: { patientCode: { contains: paging.search, mode: "insensitive" } } },
          { visit: { visitNo: { contains: paging.search, mode: "insensitive" } } }
        ]
      }
    : undefined;

  const [total, vitalSigns] = await Promise.all([
    prisma.vitalSign.count({ where }),
    prisma.vitalSign.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
      skip: (paging.page - 1) * paging.limit,
      take: paging.limit
    })
  ]);

  return ok(res, { items: vitalSigns, meta: paginationMeta(paging, total) });
});

async function assertVisitBelongsToPatient(visitId: string, patientId: string) {
  const visit = await prisma.visit.findFirst({ where: { id: visitId, patientId }, select: { id: true } });
  return Boolean(visit);
}

vitalSignRoutes.post("/", validate(createSchema), async (req, res) => {
  if (!(await assertVisitBelongsToPatient(req.body.visitId, req.body.patientId))) {
    return res.status(422).json({ success: false, message: "Kunjungan tidak sesuai dengan pasien yang dipilih", data: null });
  }

  const vitalSign = await prisma.vitalSign.create({ data: req.body });
  await writeAuditLog(req, "CREATE_VITAL_SIGN", "vital_signs", vitalSign.id, { visitId: vitalSign.visitId, patientId: vitalSign.patientId });
  emitResourceEvent("vital-signs", "create", { id: vitalSign.id, visitId: vitalSign.visitId, patientId: vitalSign.patientId });
  return created(res, vitalSign, "Vital sign berhasil dicatat");
});
vitalSignRoutes.put("/:id", validate(createSchema), async (req, res) => {
  if (!(await assertVisitBelongsToPatient(req.body.visitId, req.body.patientId))) {
    return res.status(422).json({ success: false, message: "Kunjungan tidak sesuai dengan pasien yang dipilih", data: null });
  }

  const vitalSign = await prisma.vitalSign.update({ where: { id: req.params.id }, data: req.body });
  await writeAuditLog(req, "UPDATE_VITAL_SIGN", "vital_signs", vitalSign.id, { visitId: vitalSign.visitId, patientId: vitalSign.patientId });
  emitResourceEvent("vital-signs", "update", { id: vitalSign.id, visitId: vitalSign.visitId, patientId: vitalSign.patientId });
  return ok(res, vitalSign, "Vital sign berhasil diperbarui");
});
vitalSignRoutes.delete("/:id", async (req, res) => {
  const vitalSign = await prisma.vitalSign.delete({ where: { id: req.params.id } });
  await writeAuditLog(req, "DELETE_VITAL_SIGN", "vital_signs", vitalSign.id, { visitId: vitalSign.visitId, patientId: vitalSign.patientId });
  emitResourceEvent("vital-signs", "delete", { id: vitalSign.id, visitId: vitalSign.visitId, patientId: vitalSign.patientId });
  return ok(res, vitalSign, "Vital sign berhasil dihapus");
});
