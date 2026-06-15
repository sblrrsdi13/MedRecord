import { Prisma, VisitStatus } from "@prisma/client";
import { AppError } from "../utils/errors.js";

const visitStatusRank: Record<VisitStatus, number> = {
  registered: 10,
  waiting: 20,
  examined: 30,
  prescribed: 40,
  ready_to_pay: 50,
  paid: 60,
  completed: 70,
  cancelled: 99
};

const terminalStatuses = new Set<VisitStatus>(["paid", "completed", "cancelled"]);

export async function advanceVisitStatus(tx: Prisma.TransactionClient, visitId: string, nextStatus: VisitStatus) {
  const visit = await tx.visit.findUnique({
    where: { id: visitId },
    select: { id: true, status: true }
  });

  if (!visit) {
    throw new AppError(404, "Kunjungan tidak ditemukan.", "VISIT_NOT_FOUND");
  }

  if (visit.status === nextStatus || terminalStatuses.has(visit.status)) {
    return visit;
  }

  if (visitStatusRank[nextStatus] <= visitStatusRank[visit.status]) {
    return visit;
  }

  return tx.visit.update({
    where: { id: visitId },
    data: { status: nextStatus },
    select: { id: true, status: true }
  });
}
