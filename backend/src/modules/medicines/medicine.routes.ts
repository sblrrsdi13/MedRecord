import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { created, ok } from "../../utils/api-response.js";
import { OPERATIONAL_ROLES } from "../../constants/roles.js";

export const medicineRoutes = Router();

const schema = z.object({
  body: z.object({
    code: z.string().min(2),
    name: z.string().min(2),
    unit: z.string().min(1),
    price: z.coerce.number().nonnegative(),
    stock: z.coerce.number().int().nonnegative().default(0),
    minStock: z.coerce.number().int().nonnegative().default(5)
  })
});

medicineRoutes.use(authenticate, authorize(OPERATIONAL_ROLES));
medicineRoutes.get("/", async (_req, res) => ok(res, await prisma.medicine.findMany({ orderBy: { name: "asc" } })));
medicineRoutes.post("/", validate(schema), async (req, res) => created(res, await prisma.medicine.create({ data: req.body }), "Obat berhasil dibuat"));
medicineRoutes.put("/:id", validate(schema), async (req, res) => ok(res, await prisma.medicine.update({ where: { id: req.params.id }, data: req.body }), "Obat berhasil diperbarui"));
medicineRoutes.delete("/:id", async (req, res) => ok(res, await prisma.medicine.delete({ where: { id: req.params.id } }), "Obat berhasil dihapus"));
