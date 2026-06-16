import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { writeAuditLog } from "../../middleware/audit.middleware.js";
import { created, ok } from "../../utils/api-response.js";
import { OPERATIONAL_ROLES } from "../../constants/roles.js";
import { advanceVisitStatus } from "../../services/visit-workflow.service.js";
import { hasPaginationQuery, paginationMeta, parsePagination } from "../../utils/pagination.js";
import { emitResourceEvent } from "../../socket/socket.js";

export const prescriptionRoutes = Router();

const createSchema = z.object({
  body: z.object({
    medicalRecordId: z.string().uuid(),
    medicineId: z.string().uuid().optional(),
    quantity: z.coerce.number().int().min(1).optional(),
    dosage: z.string().min(1).optional(),
    instruction: z.string().optional(),
    items: z.array(z.object({
      medicineId: z.string().uuid(),
      quantity: z.coerce.number().int().min(1),
      dosage: z.string().min(1),
      instruction: z.string().optional()
    })).min(1).optional()
  }).refine((value) => value.items?.length || (value.medicineId && value.quantity && value.dosage), {
    message: "Minimal satu obat harus diisi",
    path: ["items"]
  })
});

const updateSchema = z.object({
  body: z.object({
    status: z.enum(["draft", "issued", "dispensed", "cancelled"])
  })
});

prescriptionRoutes.use(authenticate, authorize(OPERATIONAL_ROLES));
prescriptionRoutes.get("/", async (req, res) => {
  if (!hasPaginationQuery(req.query as Record<string, unknown>)) {
    const prescriptions = await prisma.prescription.findMany({
      include: { medicalRecord: { include: { patient: true, doctor: { include: { user: { select: { name: true } } } } } }, items: { include: { medicine: true } } },
      orderBy: { createdAt: "desc" },
      take: 20
    });
    return ok(res, prescriptions);
  }

  const paging = parsePagination(req.query as Record<string, unknown>, { limit: 20 });
  const where = paging.search
    ? {
        OR: [
          { status: { contains: paging.search, mode: "insensitive" as const } },
          { medicalRecord: { diagnosis: { contains: paging.search, mode: "insensitive" as const } } },
          { medicalRecord: { patient: { name: { contains: paging.search, mode: "insensitive" as const } } } },
          { medicalRecord: { patient: { patientCode: { contains: paging.search, mode: "insensitive" as const } } } },
          { medicalRecord: { patient: { medicalRecordNo: { contains: paging.search, mode: "insensitive" as const } } } },
          { medicalRecord: { doctor: { user: { name: { contains: paging.search, mode: "insensitive" as const } } } } },
          { items: { some: { medicine: { name: { contains: paging.search, mode: "insensitive" as const } } } } }
        ]
      }
    : {};

  const [prescriptions, total] = await Promise.all([
    prisma.prescription.findMany({
      where,
      include: { medicalRecord: { include: { patient: true, doctor: { include: { user: { select: { name: true } } } } } }, items: { include: { medicine: true } } },
      orderBy: { createdAt: "desc" },
      skip: (paging.page - 1) * paging.limit,
      take: paging.limit
    }),
    prisma.prescription.count({ where })
  ]);

  return ok(res, { items: prescriptions, meta: paginationMeta(paging, total) });
});
prescriptionRoutes.post("/", validate(createSchema), async (req, res) => {
  const items = req.body.items?.length
    ? req.body.items
    : [{
        medicineId: req.body.medicineId,
        quantity: req.body.quantity,
        dosage: req.body.dosage,
        instruction: req.body.instruction
      }];

  const prescription = await prisma.$transaction(async (tx) => {
    const createdPrescription = await tx.prescription.create({
      data: {
        medicalRecordId: req.body.medicalRecordId,
        status: "draft",
        items: {
          create: items.map((item: { medicineId: string; quantity: number; dosage: string; instruction?: string }) => ({
            medicineId: item.medicineId,
            quantity: item.quantity,
            dosage: item.dosage,
            instruction: item.instruction
          }))
        }
      },
      include: { items: { include: { medicine: true } } }
    });

    const record = await tx.medicalRecord.findUnique({
      where: { id: req.body.medicalRecordId },
      select: { visitId: true, patientId: true }
    });

    if (record) {
      await advanceVisitStatus(tx, record.visitId, "ready_to_pay");
    }

    return { ...createdPrescription, visitId: record?.visitId, patientId: record?.patientId };
  });
  await writeAuditLog(req, "create", "prescriptions", prescription.id, { medicalRecordId: req.body.medicalRecordId, visitId: prescription.visitId, patientId: prescription.patientId });
  emitResourceEvent("prescriptions", "create", { id: prescription.id, visitId: prescription.visitId, patientId: prescription.patientId });
  if (prescription.visitId) emitResourceEvent("visits", "update", { id: prescription.visitId });
  return created(res, prescription, "Resep berhasil dibuat");
});
prescriptionRoutes.put("/:id", validate(updateSchema), async (req, res) => {
  const prescription = await prisma.prescription.update({ where: { id: req.params.id }, data: req.body });
  await writeAuditLog(req, "update", "prescriptions", prescription.id, { status: prescription.status });
  emitResourceEvent("prescriptions", "update", { id: prescription.id, medicalRecordId: prescription.medicalRecordId });
  return ok(res, prescription, "Status resep berhasil diperbarui");
});
prescriptionRoutes.delete("/:id", async (req, res) => {
  const prescription = await prisma.prescription.delete({ where: { id: req.params.id } });
  await writeAuditLog(req, "delete", "prescriptions", prescription.id, { medicalRecordId: prescription.medicalRecordId });
  emitResourceEvent("prescriptions", "delete", { id: prescription.id, medicalRecordId: prescription.medicalRecordId });
  return ok(res, prescription, "Resep berhasil dihapus");
});
