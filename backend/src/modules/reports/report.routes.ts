import { Router } from "express";
import { RoleName } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { ok } from "../../utils/api-response.js";

export const reportRoutes = Router();

reportRoutes.use(authenticate, authorize([RoleName.ADMIN]));
reportRoutes.get("/summary", async (_req, res) => {
  const [patients, visits, waitingQueues, medicinesLowStock] = await Promise.all([
    prisma.patient.count(),
    prisma.visit.count(),
    prisma.queue.count({ where: { status: "waiting" } }),
    prisma.medicine.count({ where: { stock: { lte: 5 } } })
  ]);

  return ok(res, { patients, visits, waitingQueues, medicinesLowStock });
});

reportRoutes.get("/detailed", async (_req, res) => {
  const start = typeof _req.query.start === "string" ? new Date(_req.query.start) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = typeof _req.query.end === "string" ? new Date(_req.query.end) : new Date();
  end.setHours(23, 59, 59, 999);

  const [
    visits,
    newPatients,
    diagnoses,
    treatments,
    medicines,
    payments
  ] = await Promise.all([
    prisma.visit.findMany({
      where: { visitDate: { gte: start, lte: end } },
      include: { patient: true, polyclinic: true, doctor: { include: { user: true } }, payment: true },
      orderBy: { visitDate: "desc" },
      take: 100
    }),
    prisma.patient.findMany({
      where: { createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: "desc" },
      take: 100
    }),
    prisma.medicalRecord.groupBy({
      by: ["diagnosis"],
      where: { createdAt: { gte: start, lte: end } },
      _count: { diagnosis: true },
      orderBy: { _count: { diagnosis: "desc" } },
      take: 20
    }),
    prisma.medicalRecord.findMany({
      where: { createdAt: { gte: start, lte: end }, treatment: { not: null } },
      include: { patient: true, doctor: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: 100
    }),
    prisma.prescriptionItem.findMany({
      include: { medicine: true, prescription: { include: { medicalRecord: { include: { patient: true } } } } },
      take: 150
    }),
    prisma.payment.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { visit: { include: { patient: true, polyclinic: true } }, details: true },
      orderBy: { createdAt: "desc" },
      take: 100
    })
  ]);

  const revenue = payments.reduce((total, payment) => total + Number(payment.total), 0);
  const medicineUsage = medicines.reduce<Record<string, { medicine: string; quantity: number; amount: number }>>((acc, item) => {
    const key = item.medicineId;
    acc[key] ??= { medicine: item.medicine.name, quantity: 0, amount: 0 };
    acc[key].quantity += item.quantity;
    acc[key].amount += item.quantity * Number(item.medicine.price);
    return acc;
  }, {});

  return ok(res, {
    period: { start, end },
    summary: {
      visits: visits.length,
      newPatients: newPatients.length,
      diagnosisTypes: diagnoses.length,
      treatments: treatments.length,
      medicineItems: medicines.length,
      revenue
    },
    reports: {
      visits: visits.map((visit) => ({
        no: visit.visitNo,
        date: visit.visitDate,
        patient: visit.patient.name,
        polyclinic: visit.polyclinic.name,
        doctor: visit.doctor?.user.name ?? "-",
        status: visit.status
      })),
      newPatients: newPatients.map((patient) => ({
        medicalRecordNo: patient.medicalRecordNo,
        name: patient.name,
        nik: patient.nik,
        createdAt: patient.createdAt
      })),
      diagnoses: diagnoses.map((item) => ({
        diagnosis: item.diagnosis,
        count: item._count.diagnosis
      })),
      treatments: treatments.map((record) => ({
        date: record.createdAt,
        patient: record.patient.name,
        doctor: record.doctor.user.name,
        diagnosis: record.diagnosis,
        treatment: record.treatment,
        fee: Number(record.treatmentFee)
      })),
      medicines: Object.values(medicineUsage),
      finance: payments.map((payment) => ({
        invoiceNo: payment.invoiceNo,
        date: payment.createdAt,
        patient: payment.visit.patient.name,
        polyclinic: payment.visit.polyclinic.name,
        method: payment.paymentMethod ?? "-",
        status: payment.status,
        total: Number(payment.total)
      })),
      bpjs: []
    }
  });
});

reportRoutes.get("/export.csv", async (req, res) => {
  const response = await fetchDetailedReport(req.query.start, req.query.end);
  const rows = [
    ["Kategori", "Item", "Nilai"],
    ["Kunjungan", "Total", response.summary.visits],
    ["Pasien Baru", "Total", response.summary.newPatients],
    ["Diagnosis", "Jenis", response.summary.diagnosisTypes],
    ["Tindakan", "Total", response.summary.treatments],
    ["Obat", "Item", response.summary.medicineItems],
    ["Keuangan", "Pendapatan", response.summary.revenue]
  ];

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="laporan-klinik-${Date.now()}.csv"`);
  res.send(rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n"));
});

async function fetchDetailedReport(startQuery: unknown, endQuery: unknown) {
  const start = typeof startQuery === "string" ? new Date(startQuery) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = typeof endQuery === "string" ? new Date(endQuery) : new Date();
  end.setHours(23, 59, 59, 999);

  const [visits, newPatients, diagnoses, treatments, medicines, payments] = await Promise.all([
    prisma.visit.count({ where: { visitDate: { gte: start, lte: end } } }),
    prisma.patient.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.medicalRecord.groupBy({ by: ["diagnosis"], where: { createdAt: { gte: start, lte: end } } }),
    prisma.medicalRecord.count({ where: { createdAt: { gte: start, lte: end }, treatment: { not: null } } }),
    prisma.prescriptionItem.count(),
    prisma.payment.aggregate({ where: { createdAt: { gte: start, lte: end } }, _sum: { total: true }, _count: true })
  ]);

  return {
    summary: {
      visits,
      newPatients,
      diagnosisTypes: diagnoses.length,
      treatments,
      medicineItems: medicines,
      revenue: Number(payments._sum.total ?? 0)
    }
  };
}
