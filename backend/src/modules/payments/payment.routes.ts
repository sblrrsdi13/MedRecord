import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { created, ok } from "../../utils/api-response.js";
import { OPERATIONAL_ROLES } from "../../constants/roles.js";
import { generateInvoiceNo } from "../../utils/numbering.js";
import { writeAuditLog } from "../../middleware/audit.middleware.js";
import { AppError } from "../../utils/errors.js";
import { advanceVisitStatus } from "../../services/visit-workflow.service.js";
import { hasPaginationQuery, paginationMeta, parsePagination } from "../../utils/pagination.js";
import { emitResourceEvent } from "../../socket/socket.js";

export const paymentRoutes = Router();

const createSchema = z.object({
  body: z.object({
    invoiceNo: z.string().min(3).optional(),
    visitId: z.string().uuid(),
    subtotal: z.coerce.number().nonnegative(),
    discount: z.coerce.number().nonnegative().default(0),
    total: z.coerce.number().nonnegative(),
    paidAmount: z.coerce.number().nonnegative().default(0),
    paymentMethod: z.enum(["CASH", "TRANSFER"]).optional(),
    status: z.enum(["unpaid", "partial", "paid", "void"]).default("unpaid")
  })
});

paymentRoutes.use(authenticate, authorize(OPERATIONAL_ROLES));
// List pembayaran (legacy)
paymentRoutes.get("/", async (req, res) => {
  if (!hasPaginationQuery(req.query as Record<string, unknown>)) {
    const payments = await prisma.payment.findMany({
      include: { visit: { include: { patient: true } }, details: true },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    return ok(res, payments);
  }

  const paging = parsePagination(req.query as Record<string, unknown>, { limit: 25 });
  const statusSearch = ["unpaid", "partial", "paid", "void"].includes(String(paging.search)) ? paging.search as "unpaid" | "partial" | "paid" | "void" : undefined;
  const where = paging.search
    ? {
        OR: [
          { invoiceNo: { contains: paging.search, mode: "insensitive" as const } },
          ...(statusSearch ? [{ status: { equals: statusSearch } }] : []),
          { paymentMethod: { contains: paging.search, mode: "insensitive" as const } },
          { visit: { visitNo: { contains: paging.search, mode: "insensitive" as const } } },
          { visit: { patient: { name: { contains: paging.search, mode: "insensitive" as const } } } },
          { visit: { patient: { patientCode: { contains: paging.search, mode: "insensitive" as const } } } },
          { visit: { patient: { medicalRecordNo: { contains: paging.search, mode: "insensitive" as const } } } },
          { details: { some: { itemName: { contains: paging.search, mode: "insensitive" as const } } } }
        ]
      }
    : {};

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { visit: { include: { patient: true } }, details: true },
      orderBy: { createdAt: "desc" },
      skip: (paging.page - 1) * paging.limit,
      take: paging.limit
    }),
    prisma.payment.count({ where })
  ]);

  return ok(res, { items: payments, meta: paginationMeta(paging, total) });
});

// Kasir: daftar kunjungan siap bayar
paymentRoutes.get("/ready", async (_req, res) => {
  const readyVisits = await prisma.visit.findMany({
    where: { status: "ready_to_pay" },
    include: {
      patient: true,
      polyclinic: true,
      medicalRecord: {
        include: {
          prescription: { include: { items: { include: { medicine: true } } } }
        }
      },
      payment: true
    },
    orderBy: { visitDate: "desc" },
    take: 50
  });

  const filtered = readyVisits.filter((visit) => !visit.payment);
  return ok(res, filtered.map((visit) => {
    const consultationFee = Number(visit.polyclinic.consultationFee ?? 0);
    const treatmentFee = Number(visit.medicalRecord?.treatmentFee ?? 0);
    const medicines = visit.medicalRecord?.prescription?.items ?? [];
    const medicineTotal = medicines.reduce((sum, item) => sum + Number(item.medicine.price) * item.quantity, 0);
    const subtotal = consultationFee + treatmentFee + medicineTotal;

    return {
      ...visit,
      billing: {
        consultationFee,
        treatmentFee,
        medicineTotal,
        subtotal,
        items: [
          { itemName: `Biaya konsultasi - ${visit.polyclinic.name}`, quantity: 1, price: consultationFee, total: consultationFee },
          ...(treatmentFee > 0 ? [{ itemName: `Biaya tindakan - ${visit.medicalRecord?.treatment ?? "Tindakan medis"}`, quantity: 1, price: treatmentFee, total: treatmentFee }] : []),
          ...medicines.map((item) => ({
            itemName: `${item.medicine.name} (${item.dosage})`,
            quantity: item.quantity,
            price: Number(item.medicine.price),
            total: Number(item.medicine.price) * item.quantity
          }))
        ]
      }
    };
  }));
});
paymentRoutes.post("/", validate(createSchema), async (req, res) => {
  const payment = await prisma.$transaction(async (tx) => {
    const invoiceNo = req.body.invoiceNo || await generateInvoiceNo(tx);
    return tx.payment.create({ data: { ...req.body, invoiceNo } });
  });
  await writeAuditLog(req, "create", "payments", payment.id, { visitId: payment.visitId, invoiceNo: payment.invoiceNo, status: payment.status });
  emitResourceEvent("payments", "create", { id: payment.id, visitId: payment.visitId });
  return created(res, payment, "Pembayaran berhasil dibuat");
});

const payReadySchema = z.object({
  body: z.object({
    visitId: z.string().uuid(),
    discount: z.coerce.number().nonnegative().default(0),
    paymentMethod: z.enum(["CASH", "TRANSFER", "BPJS"]),
    paidAmount: z.coerce.number().nonnegative().optional()
  })
});

// Kasir: proses pembayaran untuk kunjungan yang sudah siap bayar
paymentRoutes.patch("/ready/pay", validate(payReadySchema), async (req, res) => {
  const { visitId, discount, paymentMethod } = req.body;

  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    include: {
      patient: true,
      polyclinic: true,
      payment: true,
      medicalRecord: {
        include: {
          prescription: { include: { items: { include: { medicine: true } } } }
        }
      }
    }
  });
  if (!visit) throw new AppError(404, "Kunjungan tidak ditemukan", "VISIT_NOT_FOUND");
  if (visit.status !== "ready_to_pay") throw new AppError(422, "Kunjungan belum siap bayar", "VISIT_NOT_READY_TO_PAY");
  if (visit.payment) throw new AppError(409, "Invoice untuk kunjungan ini sudah ada", "PAYMENT_ALREADY_EXISTS");

  const consultationFee = Number(visit.polyclinic.consultationFee ?? 0);
  const treatmentFee = Number(visit.medicalRecord?.treatmentFee ?? 0);
  const medicines = visit.medicalRecord?.prescription?.items ?? [];
  const details = [
    { itemName: `Biaya konsultasi - ${visit.polyclinic.name}`, quantity: 1, price: consultationFee, total: consultationFee },
    ...(treatmentFee > 0 ? [{ itemName: `Biaya tindakan - ${visit.medicalRecord?.treatment ?? "Tindakan medis"}`, quantity: 1, price: treatmentFee, total: treatmentFee }] : []),
    ...medicines.map((item) => ({
      itemName: `${item.medicine.name} (${item.dosage})`,
      quantity: item.quantity,
      price: Number(item.medicine.price),
      total: Number(item.medicine.price) * item.quantity
    }))
  ];
  const subtotal = details.reduce((sum, item) => sum + item.total, 0);
  const total = Math.max(subtotal - discount, 0);
  const paidAmount = paymentMethod === "CASH" ? Number(req.body.paidAmount ?? 0) : total;
  const paymentStatus = paidAmount >= total ? "paid" : "partial";

  const { payment, updatedVisit } = await prisma.$transaction(async (tx) => {
    const invoiceNo = await generateInvoiceNo(tx);
    const payment = await tx.payment.create({
      data: {
        invoiceNo,
        visitId: visit.id,
        subtotal,
        discount,
        total,
        paidAmount,
        paymentMethod,
        status: paymentStatus,
        details: {
          create: details.map((item) => ({
            itemName: item.itemName,
            quantity: item.quantity,
            price: item.price,
            total: item.total
          }))
        }
      },
      include: { details: true, visit: { include: { patient: true, polyclinic: true } } }
    });

    const updatedVisit = payment.status === "paid"
      ? await advanceVisitStatus(tx, visit.id, "paid")
      : await tx.visit.findUniqueOrThrow({ where: { id: visit.id }, select: { id: true, status: true } });

    return { payment, updatedVisit };
  });

  await writeAuditLog(req, "process", "payments", payment.id, {
    visitId,
    invoiceNo: payment.invoiceNo,
    status: payment.status,
    paymentMethod,
    total,
    paidAmount
  });
  emitResourceEvent("payments", "create", { id: payment.id, visitId });
  emitResourceEvent("visits", "update", { id: visitId });
  return ok(res, { payment, visit: updatedVisit }, "Pembayaran siap bayar diproses");
});
paymentRoutes.put("/:id", validate(createSchema), async (req, res) => {
  const payment = await prisma.payment.update({ where: { id: req.params.id }, data: req.body });
  await writeAuditLog(req, "update", "payments", payment.id, { visitId: payment.visitId, invoiceNo: payment.invoiceNo, status: payment.status });
  emitResourceEvent("payments", "update", { id: payment.id, visitId: payment.visitId });
  return ok(res, payment, "Invoice berhasil diperbarui");
});
paymentRoutes.patch("/:id/pay", async (req, res) => {
  const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
  if (!payment) throw new AppError(404, "Invoice tidak ditemukan", "PAYMENT_NOT_FOUND");

  const paidAmount = req.body?.paidAmount === undefined ? payment.total : req.body.paidAmount;
  const updated = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: req.params.id },
      data: {
        paidAmount,
        paymentMethod: req.body?.paymentMethod ?? payment.paymentMethod,
        status: Number(paidAmount) >= Number(payment.total) ? "paid" : "partial"
      }
    });

    if (updatedPayment.status === "paid") {
      await advanceVisitStatus(tx, updatedPayment.visitId, "paid");
    }

    return updatedPayment;
  });
  await writeAuditLog(req, "pay", "payments", updated.id, { visitId: updated.visitId, invoiceNo: updated.invoiceNo, status: updated.status });
  emitResourceEvent("payments", "update", { id: updated.id, visitId: updated.visitId });
  emitResourceEvent("visits", "update", { id: updated.visitId });
  return ok(res, updated, "Pembayaran invoice berhasil dicatat");
});
paymentRoutes.delete("/:id", async (req, res) => {
  const payment = await prisma.payment.delete({ where: { id: req.params.id } });
  await writeAuditLog(req, "delete", "payments", payment.id, { visitId: payment.visitId, invoiceNo: payment.invoiceNo, status: payment.status });
  emitResourceEvent("payments", "delete", { id: payment.id, visitId: payment.visitId });
  return ok(res, payment, "Pembayaran berhasil dihapus");
});
