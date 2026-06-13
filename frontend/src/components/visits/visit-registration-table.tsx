"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CalendarClock, ClipboardList, CreditCard, FileDown, IdCard, MoreHorizontal, Printer, RefreshCw, Search, Trash2, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteResource } from "@/services/resource-service";
import { getVisits, type VisitRegistrationRow } from "@/services/visit-service";
import { useAuthStore } from "@/store/auth-store";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function getAge(value: string) {
  const birth = new Date(value);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const month = now.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) years -= 1;
  return `${years} Th`;
}

function paymentLabel(row: VisitRegistrationRow) {
  if (!row.payment) return "Belum bayar";
  if (row.payment.status === "paid") return "Sudah bayar";
  if (row.payment.status === "partial") return "Sebagian";
  if (row.payment.status === "void") return "Dibatalkan";
  return "Belum bayar";
}

function statusVariant(status: string): "success" | "warning" | "secondary" | "destructive" {
  if (status === "completed" || status === "paid") return "success";
  if (status === "cancelled") return "destructive";
  if (status === "registered" || status === "ready_to_pay") return "warning";
  return "secondary";
}

function visitStatusLabel(status: string) {
  if (status === "ready_to_pay") return "READY_TO_PAY";
  if (status === "paid") return "PAID";
  return status;
}

function formatCurrency(value?: string) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value ?? 0));
}

function escapeHtml(value: unknown) {
  return String(value ?? "-")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function printVisit(row: VisitRegistrationRow) {
  const html = `
    <!doctype html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>Bukti Pendaftaran ${row.visitNo}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; margin: 32px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #5f7974; padding-bottom: 16px; margin-bottom: 24px; }
          .brand { font-size: 22px; font-weight: 700; color: #5f7974; }
          .muted { color: #64748b; font-size: 12px; }
          .title { font-size: 18px; font-weight: 700; margin: 0 0 8px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; margin-top: 18px; }
          .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; }
          .label { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 4px; }
          .value { font-size: 14px; font-weight: 600; }
          .queue { font-size: 42px; color: #5f7974; font-weight: 800; letter-spacing: .08em; }
          .footer { margin-top: 42px; display: flex; justify-content: space-between; gap: 32px; }
          .sign { width: 220px; text-align: center; border-top: 1px solid #94a3b8; padding-top: 8px; margin-top: 64px; }
          @media print { button { display: none; } body { margin: 18mm; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">Klinik Utama</div>
            <div class="muted">Bukti pendaftaran kunjungan pasien</div>
          </div>
          <div style="text-align:right">
            <div class="title">${escapeHtml(row.visitNo)}</div>
            <div class="muted">${formatDate(row.visitDate)}</div>
          </div>
        </div>
        <div class="grid">
          <div class="box"><div class="label">Nama Pasien</div><div class="value">${escapeHtml(row.patient.name)}</div></div>
          <div class="box"><div class="label">ID Pasien</div><div class="value">${escapeHtml(row.patient.patientCode ?? row.patient.id)}</div></div>
          ${row.patient.medicalRecordNo ? `<div class="box"><div class="label">No. Rekam Medis</div><div class="value">${escapeHtml(row.patient.medicalRecordNo)}</div></div>` : ""}
          <div class="box"><div class="label">NIK</div><div class="value">${escapeHtml(row.patient.nik)}</div></div>
          <div class="box"><div class="label">Jenis Kelamin</div><div class="value">${row.patient.gender === "MALE" ? "Laki-laki" : "Perempuan"}</div></div>
          <div class="box"><div class="label">Poli Tujuan</div><div class="value">${escapeHtml(row.polyclinic.name)}</div></div>
          <div class="box"><div class="label">Status Pembayaran</div><div class="value">${escapeHtml(paymentLabel(row))}</div></div>
          <div class="box"><div class="label">Keluhan</div><div class="value">${escapeHtml(row.complaint || "-")}</div></div>
          <div class="box"><div class="label">Nomor Antrian</div><div class="queue">${escapeHtml(row.queue?.queueNumber)}</div></div>
        </div>
        <div class="footer">
          <div class="muted">Dicetak otomatis dari Sistem Rekam Medis Klinik.</div>
          <div class="sign">Petugas Pendaftaran</div>
        </div>
        <script>window.print(); window.onafterprint = () => window.close();</script>
      </body>
    </html>
  `;
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
}

export function VisitRegistrationTable({ refreshKey = 0, actionSlot }: { refreshKey?: number; actionSlot?: ReactNode }) {
  const role = useAuthStore((state) => state.user?.role);
  const canDelete = role === "RECEPTIONIST" || role === "NURSE" || role === "DOCTOR" || role === "PHARMACY" || role === "CASHIER";
  const [rows, setRows] = useState<VisitRegistrationRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRows(await getVisits());
    } catch {
      setError("Data pendaftaran belum dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [refreshKey]);

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return rows;
    return rows.filter((row) => {
      const patient = row.patient;
      return [row.visitNo, patient.name, patient.patientCode, patient.medicalRecordNo, patient.nik, row.polyclinic.name, row.complaint]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [query, rows]);

  async function handleDelete(id: string) {
    if (!window.confirm("Hapus data pendaftaran ini?")) return;
    try {
      await deleteResource(`/visits/${id}`);
      await load();
    } catch {
      setError("Gagal menghapus pendaftaran. Data mungkin masih dipakai modul lain atau role Anda tidak memiliki akses.");
    }
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-[#c7c1b5] bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-[#c7c1b5] bg-[#faf8ef]/70 p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-[#2a3234]">Pendaftaran Pasien</h2>
          <p className="text-sm text-[#6a746f]">Data kunjungan dengan alur pasien, poli, antrian, pembayaran, dan status pelayanan.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={load}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button type="button" variant="outline" onClick={() => filteredRows[0] && printVisit(filteredRows[0])}>
            <Printer className="h-4 w-4" />
            Print Teratas
          </Button>
          <Button type="button" variant="outline">
            <FileDown className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid min-w-0 gap-3 border-b border-[#c7c1b5] p-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,520px)] xl:items-center">
        <div className="grid min-w-0 gap-3 sm:grid-cols-3">
          <VisitMetric icon={ClipboardList} label="Total" value={String(filteredRows.length)} />
          <VisitMetric icon={CalendarClock} label="Aktif" value={String(filteredRows.filter((row) => row.status !== "completed").length)} />
          <VisitMetric icon={CreditCard} label="Belum Bayar" value={String(filteredRows.filter((row) => row.payment?.status !== "paid").length)} />
        </div>
        <div className="flex min-w-0 w-full flex-col gap-2 sm:flex-row sm:flex-wrap xl:flex-nowrap">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a827e]" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari pasien, No. RM, NIK, poli..." className="pl-9" />
          </div>
          {actionSlot && <div className="min-w-0 shrink-0 sm:[&>*]:w-auto [&>*]:w-full">{actionSlot}</div>}
        </div>
      </div>

      {error && <p className="mx-4 mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="max-h-[680px] max-w-full overflow-auto">
        <Table className="min-w-[1280px] text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">No</TableHead>
              <TableHead className="min-w-[170px]">Pendaftaran</TableHead>
              <TableHead className="min-w-[320px]">Pasien</TableHead>
              <TableHead className="min-w-[190px]">Tujuan Layanan</TableHead>
              <TableHead className="min-w-[160px]">Antrian</TableHead>
              <TableHead className="min-w-[170px]">Pembayaran</TableHead>
              <TableHead className="min-w-[170px]">Status Pelayanan</TableHead>
              <TableHead className="w-32 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8}>Memuat data pendaftaran...</TableCell></TableRow>
            ) : filteredRows.length === 0 ? (
              <TableRow><TableCell colSpan={8}>Belum ada data pendaftaran.</TableCell></TableRow>
            ) : (
              filteredRows.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell className="text-center">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#faf8ef] text-xs font-bold text-[#5f7974]">
                      {index + 1}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <p className="font-mono text-sm font-bold text-[#5f7974]">{row.visitNo}</p>
                      <p className="text-xs text-[#6a746f]">{formatDate(row.visitDate)}</p>
                      <span className="inline-flex rounded-full bg-[#faf8ef] px-2 py-1 text-[11px] font-semibold text-[#4a5657]">
                        ID {row.id.slice(0, 6).toUpperCase()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e6efe5] text-sm font-bold text-[#5f7974]">
                        {row.patient.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 space-y-2">
                        <p className="truncate font-semibold text-[#2a3234]">{row.patient.name}</p>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#e6efe5] px-2 py-1 font-mono text-[11px] font-semibold text-[#5f7974]">
                            <IdCard className="h-3 w-3" />
                            {row.patient.patientCode ?? row.patient.id}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#faf8ef] px-2 py-1 font-mono text-[11px] text-[#4a5657]">
                            <IdCard className="h-3 w-3" />
                            {row.patient.medicalRecordNo ?? "Belum ada RM"}
                          </span>
                          <Badge variant="secondary">{row.patient.gender === "MALE" ? "Laki-laki" : "Perempuan"}</Badge>
                          <span className="rounded-full bg-[#faf8ef] px-2 py-1 text-[11px] text-[#4a5657]">{getAge(row.patient.birthDate)}</span>
                        </div>
                        <p className="line-clamp-1 text-xs text-[#6a746f]">NIK {row.patient.nik ?? "-"} - {row.patient.address ?? "Alamat belum diisi"}</p>
                        {row.patient.allergyNotes && <Badge variant="warning">{row.patient.allergyNotes}</Badge>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <p className="font-semibold text-[#2a3234]">{row.polyclinic.name}</p>
                      <p className="line-clamp-2 text-xs text-[#6a746f]">{row.complaint || "Keluhan belum diisi"}</p>
                      <Badge variant="secondary">Berobat Jalan</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.queue ? (
                      <div className="space-y-2">
                        <p className="font-mono text-xl font-bold text-[#5f7974]">{row.queue.queueNumber}</p>
                        <Badge variant={row.queue.status === "completed" ? "success" : row.queue.status === "called" ? "warning" : "secondary"}>{row.queue.status}</Badge>
                      </div>
                    ) : (
                      <span className="text-xs text-[#6a746f]">Belum dibuat</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Badge variant={row.payment?.status === "paid" ? "success" : "warning"}>{paymentLabel(row)}</Badge>
                      <p className="font-semibold text-[#2a3234]">{formatCurrency(row.payment?.total)}</p>
                      {row.payment && <p className="text-xs text-[#6a746f]">Dibayar {formatCurrency(row.payment.paidAmount)}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Badge variant={statusVariant(row.status)}>{visitStatusLabel(row.status)}</Badge>
                      <p className="text-xs text-[#6a746f]">{row.status === "ready_to_pay" ? "Menunggu pembayaran kasir" : row.status === "completed" ? "Pelayanan selesai" : "Masih dalam alur klinik"}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1 rounded-lg border border-[#c7c1b5] bg-white p-1 shadow-sm">
                      <Button type="button" variant="ghost" size="icon" aria-label="Detail kunjungan">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="outline" size="icon" aria-label="Cetak kunjungan" onClick={() => printVisit(row)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                      {canDelete && (
                      <Button type="button" size="icon" variant="destructive" aria-label="Hapus kunjungan" onClick={() => handleDelete(row.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function VisitMetric({ icon: Icon, label, value }: { icon: typeof ClipboardList; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#c7c1b5] bg-white p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e6efe5] text-[#5f7974]">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#6a746f]">{label}</p>
        <p className="text-lg font-bold leading-tight text-[#2a3234]">{value}</p>
      </div>
    </div>
  );
}



