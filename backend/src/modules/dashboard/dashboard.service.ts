import { prisma } from "../../config/prisma.js";

export async function getDashboardSummary() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const [
    totalPatients,
    todayVisits,
    completedVisits,
    pendingVisits,
    waitingQueues,
    calledQueues,
    pendingPrescriptions,
    lowStockMedicines,
    unpaidPayments,
    todayPayments,
    recentVisits,
    queueSnapshot,
    lowStockList
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.visit.count({ where: { visitDate: { gte: startOfDay, lt: endOfDay } } }),
    prisma.visit.count({ where: { visitDate: { gte: startOfDay, lt: endOfDay }, status: { in: ["completed", "paid"] } } }),
    prisma.visit.count({ where: { visitDate: { gte: startOfDay, lt: endOfDay }, status: { notIn: ["completed", "cancelled"] } } }),
    prisma.queue.count({ where: { queueDate: { gte: startOfDay, lt: endOfDay }, status: "waiting" } }),
    prisma.queue.count({ where: { queueDate: { gte: startOfDay, lt: endOfDay }, status: "called" } }),
    prisma.prescription.count({ where: { status: { in: ["draft", "pending"] } } }),
    prisma.medicine.count({ where: { stock: { lte: 5 } } }),
    prisma.payment.count({ where: { status: { in: ["unpaid", "partial"] } } }),
    prisma.payment.aggregate({
      where: { createdAt: { gte: startOfDay, lt: endOfDay }, status: "paid" },
      _sum: { paidAmount: true, total: true }
    }),
    prisma.visit.findMany({
      where: { visitDate: { gte: startOfDay, lt: endOfDay } },
      include: { patient: true, polyclinic: true, queue: true, doctor: { include: { user: { select: { id: true, name: true, email: true } } } } },
      orderBy: { visitDate: "asc" },
      take: 8
    }),
    prisma.queue.findMany({
      where: { queueDate: { gte: startOfDay, lt: endOfDay } },
      include: { patient: true, polyclinic: true },
      orderBy: [{ status: "asc" }, { sequence: "asc" }],
      take: 8
    }),
    prisma.medicine.findMany({
      where: { stock: { lte: 5 } },
      orderBy: { stock: "asc" },
      take: 6
    })
  ]);

  return {
    totals: {
      totalPatients,
      todayVisits,
      completedVisits,
      pendingVisits,
      waitingQueues,
      calledQueues,
      pendingPrescriptions,
      lowStockMedicines,
      unpaidPayments,
      revenueToday: todayPayments._sum.paidAmount ?? todayPayments._sum.total ?? 0
    },
    recentVisits,
    queueSnapshot,
    lowStockList
  };
}
