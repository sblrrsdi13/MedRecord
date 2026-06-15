import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { created, ok } from "../../utils/api-response.js";
import { OPERATIONAL_ROLES } from "../../constants/roles.js";
import { hasPaginationQuery, paginationMeta, parsePagination } from "../../utils/pagination.js";
import { emitResourceEvent } from "../../socket/socket.js";

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
medicineRoutes.get("/", async (req, res) => {
  if (!hasPaginationQuery(req.query)) {
    return ok(res, await prisma.medicine.findMany({ orderBy: { name: "asc" } }));
  }

  const paging = parsePagination(req.query);
  const where: Prisma.MedicineWhereInput | undefined = paging.search
    ? {
        OR: [
          { code: { contains: paging.search, mode: "insensitive" } },
          { name: { contains: paging.search, mode: "insensitive" } },
          { unit: { contains: paging.search, mode: "insensitive" } }
        ]
      }
    : undefined;
  const [total, medicines] = await Promise.all([
    prisma.medicine.count({ where }),
    prisma.medicine.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (paging.page - 1) * paging.limit,
      take: paging.limit
    })
  ]);

  return ok(res, { items: medicines, meta: paginationMeta(paging, total) });
});
medicineRoutes.post("/", validate(schema), async (req, res) => {
  const medicine = await prisma.medicine.create({ data: req.body });
  emitResourceEvent("medicines", "create", { id: medicine.id });
  return created(res, medicine, "Obat berhasil dibuat");
});
medicineRoutes.put("/:id", validate(schema), async (req, res) => {
  const medicine = await prisma.medicine.update({ where: { id: req.params.id }, data: req.body });
  emitResourceEvent("medicines", "update", { id: medicine.id });
  return ok(res, medicine, "Obat berhasil diperbarui");
});
medicineRoutes.delete("/:id", async (req, res) => {
  const medicine = await prisma.medicine.delete({ where: { id: req.params.id } });
  emitResourceEvent("medicines", "delete", { id: medicine.id });
  return ok(res, medicine, "Obat berhasil dihapus");
});
