import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { generateInvoiceNo } from "../../utils/numbering.js";
import { AppError } from "../../utils/errors.js";
import { hasPaginationQuery, paginationMeta, parsePagination } from "../../utils/pagination.js";
import { advanceVisitStatus } from "../visits/visit.service.js";
import type { CreatePaymentPayload, PayReadyPayload } from "./payment.schema.js";

const paymentInclude = { visit: { include: { patient: true } }, details: true } satisfies Prisma.PaymentInclude;

export async function listPayments(query: Record<string, unknown>) {
  if (!hasPaginationQuery(query)) {
    return prisma.payment.findMany({
      include: paymentInclude,
      orderBy: { createdAt: "desc" },
      take: 20
    });
  }

  const paging = parsePagination(query, { limit: 20 });
  const statusSearch = ["unpaid", "partial", "paid", "void"].includes(String(paging.search))
    ? paging.search as "unpaid" | "partial" | "paid" | "void"
    : undefined;
  const where: Prisma.PaymentWhereInput = paging.search
    ? {
        OR: [
          { invoiceNo: { contains: paging.search, mode: "insensitive" } },
          ...(statusSearch ? [{ status: { equals: statusSearch } }] : []),
          { paymentMethod: { contains: paging.search, mode: "insensitive" } },
          { visit: { visitNo: { contains: paging.search, mode: "insensitive" } } },
          { visit: { patient: { name: { contains: paging.search, mode: "insensitive" } } } },
          { visit: { patient: { patientCode: { contains: paging.search, mode: "insensitive" } } } },
          { visit: { patient: { medicalRecordNo: { contains: paging.search, mode: "insensitive" } } } },
          { details: { some: { itemName: { contains: paging.search, mode: "insensitive" } } } }
        ]
      }
    : {};

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: paymentInclude,
      orderBy: { createdAt: "desc" },
      skip: (paging.page - 1) * paging.limit,
      take: paging.limit
    }),
    prisma.payment.count({ where })
  ]);

  return { items: payments, meta: paginationMeta(paging, total) };
}

export async function listReadyPayments() {
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
    take: 20
  });

  const filtered = readyVisits.filter((visit) => !visit.payment);
  return filtered.map((visit) => {
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
  });
}

export async function createPayment(data: CreatePaymentPayload) {
  return prisma.$transaction(async (tx) => {
    const invoiceNo = data.invoiceNo || await generateInvoiceNo(tx);
    return tx.payment.create({ data: { ...data, invoiceNo } });
  });
}

export async function payReadyVisit(data: PayReadyPayload) {
  const { visitId, discount, paymentMethod } = data;

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
  const paidAmount = paymentMethod === "CASH" ? Number(data.paidAmount ?? 0) : total;
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

  return { payment, updatedVisit, total, paidAmount };
}

export async function updatePayment(id: string, data: CreatePaymentPayload) {
  return prisma.payment.update({ where: { id }, data });
}

export async function payInvoice(id: string, data: { paidAmount?: number; paymentMethod?: string }) {
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) throw new AppError(404, "Invoice tidak ditemukan", "PAYMENT_NOT_FOUND");

  const paidAmount = data?.paidAmount === undefined ? payment.total : data.paidAmount;
  return prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id },
      data: {
        paidAmount,
        paymentMethod: data?.paymentMethod ?? payment.paymentMethod,
        status: Number(paidAmount) >= Number(payment.total) ? "paid" : "partial"
      }
    });

    if (updatedPayment.status === "paid") {
      await advanceVisitStatus(tx, updatedPayment.visitId, "paid");
    }

    return updatedPayment;
  });
}

export async function deletePayment(id: string) {
  return prisma.payment.delete({ where: { id } });
}
