import type { Request, Response } from "express";
import { ok } from "../../utils/api-response.js";
import * as reportService from "./report.service.js";

export async function getReportSummary(_req: Request, res: Response) {
  const summary = await reportService.getReportSummary();
  return ok(res, summary);
}

export async function getDetailedReport(req: Request, res: Response) {
  const report = await reportService.getDetailedReport(req.query.start, req.query.end);
  return ok(res, report);
}

export async function exportReportCsv(req: Request, res: Response) {
  const response = await reportService.getExportSummary(req.query.start, req.query.end);
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
}
