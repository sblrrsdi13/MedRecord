"use client";

import { useEffect, useState } from "react";
import { Download, FileBarChart, FileSpreadsheet, Printer, RefreshCw } from "lucide-react";
import { api } from "@/services/api";
import type { ApiResponse } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ReportData = {
  period: { start: string; end: string };
  summary: {
    visits: number;
    newPatients: number;
    diagnosisTypes: number;
    treatments: number;
    medicineItems: number;
    revenue: number;
  };
  reports: Record<string, Array<Record<string, unknown>>>;
};

const reportTabs = [
  { key: "visits", label: "Kunjungan" },
  { key: "newPatients", label: "Pasien Baru" },
  { key: "diagnoses", label: "Diagnosis" },
  { key: "treatments", label: "Tindakan" },
  { key: "medicines", label: "Obat" },
  { key: "finance", label: "Keuangan" },
  { key: "bpjs", label: "BPJS" }
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number") return new Intl.NumberFormat("id-ID").format(value);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return new Date(value).toLocaleString("id-ID");
  return String(value);
}

export default function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const [start, setStart] = useState(firstDay);
  const [end, setEnd] = useState(today);
  const [active, setActive] = useState("visits");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse<ReportData>>("/reports/detailed", { params: { start, end } });
      setData(response.data.data);
    } catch {
      setError("Gagal memuat laporan. Pastikan login sebagai Admin dan backend aktif.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function exportCsv() {
    const response = await api.get("/reports/export.csv", { params: { start, end }, responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `laporan-klinik-${start}-${end}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function printReport() {
    window.print();
  }

  const rows = data?.reports[active] ?? [];
  const columns = rows[0] ? Object.keys(rows[0]) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#5f7974]">Laporan</p>
          <h1 className="mt-2 text-3xl font-black text-[#2a3234]">Pusat Laporan Klinik</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6a746f]">
            Laporan kunjungan, pasien baru, diagnosis, tindakan, obat, keuangan, BPJS, dan export PDF/Excel.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Muat Ulang</Button>
          <Button type="button" variant="outline" onClick={printReport}><Printer className="h-4 w-4" /> Export PDF</Button>
          <Button type="button" onClick={exportCsv}><Download className="h-4 w-4" /> Export Excel</Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-[1fr_1fr_auto]">
          <label className="grid gap-2 text-sm font-semibold">
            Tanggal Mulai
            <input type="date" value={start} onChange={(event) => setStart(event.target.value)} className="h-10 rounded-lg border bg-white px-3" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Tanggal Akhir
            <input type="date" value={end} onChange={(event) => setEnd(event.target.value)} className="h-10 rounded-lg border bg-white px-3" />
          </label>
          <Button type="button" className="self-end" onClick={load}>Terapkan Filter</Button>
        </CardContent>
      </Card>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {data && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Metric label="Kunjungan" value={data.summary.visits} />
          <Metric label="Pasien Baru" value={data.summary.newPatients} />
          <Metric label="Diagnosis" value={data.summary.diagnosisTypes} />
          <Metric label="Tindakan" value={data.summary.treatments} />
          <Metric label="Obat" value={data.summary.medicineItems} />
          <Metric label="Keuangan" value={formatCurrency(data.summary.revenue)} />
        </div>
      )}

      <Card className="print:shadow-none">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><FileBarChart className="h-5 w-5" /> Detail Laporan</CardTitle>
              <CardDescription>Gunakan tab untuk melihat laporan per kategori.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {reportTabs.map((tab) => (
                <button key={tab.key} type="button" onClick={() => setActive(tab.key)} className={`rounded-full px-3 py-2 text-xs font-bold transition ${active === tab.key ? "bg-[#5f7974] text-white" : "bg-[#eef1e8] text-[#4a5657] hover:bg-[#e6efe5]"}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto rounded-xl border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-[#eef1e8] text-left text-xs uppercase text-[#4a5657]">
                <tr>
                  {columns.length === 0 ? <th className="px-4 py-3">Data</th> : columns.map((column) => <th key={column} className="px-4 py-3">{column}</th>)}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="px-4 py-6 text-center">Memuat laporan...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td className="px-4 py-6 text-center" colSpan={Math.max(columns.length, 1)}>{active === "bpjs" ? "Fitur BPJS tidak digunakan pada sistem ini." : "Belum ada data laporan."}</td></tr>
                ) : rows.map((row, index) => (
                  <tr key={index} className="border-t">
                    {columns.map((column) => (
                      <td key={column} className="px-4 py-3">{formatValue(row[column])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-[#6a746f]">
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel memakai CSV agar ringan dan dapat dibuka di Excel/LibreOffice.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <Badge variant="secondary">{label}</Badge>
        <p className="mt-3 text-2xl font-black text-[#2a3234]">{value}</p>
      </CardContent>
    </Card>
  );
}
