import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { writeAuditLog } from "../../middleware/audit.middleware.js";
import { created, ok } from "../../utils/api-response.js";
import { AppError } from "../../utils/errors.js";
import { OPERATIONAL_ROLES } from "../../constants/roles.js";
import { generateVisitNo } from "../../utils/numbering.js";
import { hasPaginationQuery, paginationMeta, parsePagination } from "../../utils/pagination.js";
import { emitResourceEvent } from "../../socket/socket.js";

export const visitRoutes = Router();

const visitListInclude = {
  patient: {
    select: {
      id: true,
      patientCode: true,
      medicalRecordNo: true,
      userId: true,
      name: true,
      nik: true,
      gender: true,
      birthDate: true,
      phone: true,
      address: true,
      bloodType: true,
      allergyNotes: true,
      createdAt: true,
      updatedAt: true
    }
  },
  doctor: { include: { user: { select: { id: true, name: true, email: true } } } },
  polyclinic: {
    select: {
      id: true,
      name: true,
      code: true,
      queuePrefix: true,
      consultationFee: true,
      description: true,
      isActive: true
    }
  },
  queue: { select: { id: true, queueNumber: true, status: true, calledAt: true, completedAt: true } },
  payment: { select: { id: true, invoiceNo: true, status: true, total: true, paidAmount: true, paymentMethod: true } }
};

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
visitRoutes.get("/", authorize(OPERATIONAL_ROLES), async (req, res) => {
  if (!hasPaginationQuery(req.query as Record<string, unknown>)) {
    const visits = await prisma.visit.findMany({
      include: visitListInclude,
      orderBy: { visitDate: "desc" },
      take: 20
    });
    return ok(res, visits);
  }

  const paging = parsePagination(req.query as Record<string, unknown>, { limit: 20 });
  const where = paging.search
    ? {
        OR: [
          { visitNo: { contains: paging.search, mode: "insensitive" as const } },
          { complaint: { contains: paging.search, mode: "insensitive" as const } },
          { patient: { name: { contains: paging.search, mode: "insensitive" as const } } },
          { patient: { patientCode: { contains: paging.search, mode: "insensitive" as const } } },
          { patient: { medicalRecordNo: { contains: paging.search, mode: "insensitive" as const } } },
          { patient: { nik: { contains: paging.search, mode: "insensitive" as const } } },
          { polyclinic: { name: { contains: paging.search, mode: "insensitive" as const } } }
        ]
      }
    : {};

  const [visits, total] = await Promise.all([
    prisma.visit.findMany({
      where,
      include: visitListInclude,
      orderBy: { visitDate: "desc" },
      skip: (paging.page - 1) * paging.limit,
      take: paging.limit
    }),
    prisma.visit.count({ where })
  ]);

  return ok(res, { items: visits, meta: paginationMeta(paging, total) });
});

visitRoutes.post("/", authorize(OPERATIONAL_ROLES), validate(createVisitSchema), async (req, res) => {
  const visit = await prisma.$transaction(async (tx) => {
    const [patient, polyclinic] = await Promise.all([
      tx.patient.findUnique({ where: { id: req.body.patientId }, select: { id: true } }),
      tx.polyclinic.findUnique({ where: { id: req.body.polyclinicId }, select: { id: true, isActive: true } })
    ]);

    if (!patient) throw new AppError(404, "Pasien tidak ditemukan.", "PATIENT_NOT_FOUND");
    if (!polyclinic || !polyclinic.isActive) throw new AppError(404, "Poli tidak ditemukan atau tidak aktif.", "POLYCLINIC_NOT_FOUND");

    const visitNo = req.body.visitNo || await generateVisitNo(tx);
    return tx.visit.create({ data: { ...req.body, visitNo } });
  });
  await writeAuditLog(req, "create", "visits", visit.id, { visitNo: visit.visitNo, patientId: visit.patientId, polyclinicId: visit.polyclinicId });
  emitResourceEvent("visits", "create", { id: visit.id, patientId: visit.patientId, polyclinicId: visit.polyclinicId });
  return created(res, visit, "Kunjungan berhasil dibuat");
});

visitRoutes.put("/:id", authorize(OPERATIONAL_ROLES), validate(createVisitSchema), async (req, res) => {
  const visit = await prisma.visit.update({ where: { id: req.params.id }, data: req.body });
  await writeAuditLog(req, "update", "visits", visit.id, { visitNo: visit.visitNo, patientId: visit.patientId, polyclinicId: visit.polyclinicId });
  emitResourceEvent("visits", "update", { id: visit.id, patientId: visit.patientId, polyclinicId: visit.polyclinicId });
  return ok(res, visit, "Kunjungan berhasil diperbarui");
});

visitRoutes.delete("/:id", authorize(OPERATIONAL_ROLES), async (req, res) => {
  const visit = await prisma.visit.delete({ where: { id: req.params.id } });
  await writeAuditLog(req, "delete", "visits", visit.id, { visitNo: visit.visitNo, patientId: visit.patientId, polyclinicId: visit.polyclinicId });
  emitResourceEvent("visits", "delete", { id: visit.id, patientId: visit.patientId, polyclinicId: visit.polyclinicId });
  return ok(res, visit, "Kunjungan berhasil dihapus");
});
