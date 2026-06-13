import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { created, ok } from "../../utils/api-response.js";
import { OPERATIONAL_ROLES } from "../../constants/roles.js";

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
prescriptionRoutes.get("/", async (_req, res) => {
  const prescriptions = await prisma.prescription.findMany({
    include: { medicalRecord: { include: { patient: true, doctor: { include: { user: { select: { name: true } } } } } }, items: { include: { medicine: true } } },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  return ok(res, prescriptions);
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

  const prescription = await prisma.prescription.create({
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
  const record = await prisma.medicalRecord.findUnique({
    where: { id: req.body.medicalRecordId },
    select: { visitId: true }
  });
  if (record) {
    await prisma.visit.update({ where: { id: record.visitId }, data: { status: "ready_to_pay" } });
  }
  return created(res, prescription, "Resep berhasil dibuat");
});
prescriptionRoutes.put("/:id", validate(updateSchema), async (req, res) => {
  const prescription = await prisma.prescription.update({ where: { id: req.params.id }, data: req.body });
  return ok(res, prescription, "Status resep berhasil diperbarui");
});
prescriptionRoutes.delete("/:id", async (req, res) => ok(res, await prisma.prescription.delete({ where: { id: req.params.id } }), "Resep berhasil dihapus"));
