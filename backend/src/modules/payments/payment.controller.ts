import type { Request, Response } from "express";
import { OPERATIONAL_ROLES } from "../../constants/roles.js";
import { writeAuditLog } from "../../middleware/audit.middleware.js";
import { created, ok } from "../../utils/api-response.js";
import { emitResourceEvent } from "../../socket/socket.js";
import * as paymentService from "./payment.service.js";

export { OPERATIONAL_ROLES };

export async function listPayments(req: Request, res: Response) {
  const result = await paymentService.listPayments(req.query as Record<string, unknown>);
  return ok(res, result);
}

export async function listReadyPayments(_req: Request, res: Response) {
  const result = await paymentService.listReadyPayments();
  return ok(res, result);
}

export async function createPayment(req: Request, res: Response) {
  const payment = await paymentService.createPayment(req.body);
  await writeAuditLog(req, "create", "payments", payment.id, { visitId: payment.visitId, invoiceNo: payment.invoiceNo, status: payment.status });
  emitResourceEvent("payments", "create", { id: payment.id, visitId: payment.visitId });
  return created(res, payment, "Pembayaran berhasil dibuat");
}

export async function payReadyVisit(req: Request, res: Response) {
  const { payment, updatedVisit, total, paidAmount } = await paymentService.payReadyVisit(req.body);
  await writeAuditLog(req, "process", "payments", payment.id, {
    visitId: req.body.visitId,
    invoiceNo: payment.invoiceNo,
    status: payment.status,
    paymentMethod: req.body.paymentMethod,
    total,
    paidAmount
  });
  emitResourceEvent("payments", "create", { id: payment.id, visitId: req.body.visitId });
  emitResourceEvent("visits", "update", { id: req.body.visitId });
  return ok(res, { payment, visit: updatedVisit }, "Pembayaran siap bayar diproses");
}

export async function updatePayment(req: Request, res: Response) {
  const payment = await paymentService.updatePayment(req.params.id, req.body);
  await writeAuditLog(req, "update", "payments", payment.id, { visitId: payment.visitId, invoiceNo: payment.invoiceNo, status: payment.status });
  emitResourceEvent("payments", "update", { id: payment.id, visitId: payment.visitId });
  return ok(res, payment, "Invoice berhasil diperbarui");
}

export async function payInvoice(req: Request, res: Response) {
  const updated = await paymentService.payInvoice(req.params.id, req.body);
  await writeAuditLog(req, "pay", "payments", updated.id, { visitId: updated.visitId, invoiceNo: updated.invoiceNo, status: updated.status });
  emitResourceEvent("payments", "update", { id: updated.id, visitId: updated.visitId });
  emitResourceEvent("visits", "update", { id: updated.visitId });
  return ok(res, updated, "Pembayaran invoice berhasil dicatat");
}

export async function deletePayment(req: Request, res: Response) {
  const payment = await paymentService.deletePayment(req.params.id);
  await writeAuditLog(req, "delete", "payments", payment.id, { visitId: payment.visitId, invoiceNo: payment.invoiceNo, status: payment.status });
  emitResourceEvent("payments", "delete", { id: payment.id, visitId: payment.visitId });
  return ok(res, payment, "Pembayaran berhasil dihapus");
}
