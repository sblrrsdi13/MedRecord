"use client";

import { useEffect, useMemo, useState } from "react";
import { Banknote, CreditCard, Printer, ReceiptText, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPayments, getReadyPayments, processReadyPayment, type PaymentRow, type ReadyPaymentVisit } from "@/services/payment-service";

type PaymentMethod = "CASH" | "TRANSFER" | "BPJS";

function currency(value: unknown) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value ?? 0));
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function statusLabel(status: string) {
  if (status === "ready_to_pay") return "READY_TO_PAY";
  if (status === "paid") return "PAID";
  if (status === "partial") return "PARTIAL";
  return status.toUpperCase();
}

function printInvoice(payment: PaymentRow) {
  const rows = payment.details.map((item) => `
    <tr>
      <td>${item.itemName}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">${currency(item.price)}</td>
      <td style="text-align:right">${currency(item.total)}</td>
    </tr>
  `).join("");
  const html = `
    <!doctype html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>Invoice ${payment.invoiceNo}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
          .head { display: flex; justify-content: space-between; border-bottom: 2px solid #5f7974; padding-bottom: 16px; margin-bottom: 24px; }
          .brand { font-size: 22px; font-weight: 800; color: #5f7974; }
          .muted { color: #64748b; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border-bottom: 1px solid #cbd5e1; padding: 10px; font-size: 13px; }
          th { text-align: left; background: #f1f5f9; }
          .totals { margin-left: auto; width: 320px; margin-top: 20px; }
          .line { display: flex; justify-content: space-between; padding: 8px 0; }
          .grand { font-size: 18px; font-weight: 800; color: #5f7974; border-top: 2px solid #5f7974; }
          @media print { body { margin: 18mm; } }
        </style>
      </head>
      <body>
        <div class="head">
          <div>
            <div class="brand">Klinik Utama</div>
            <div class="muted">Invoice pembayaran layanan klinik</div>
          </div>
          <div style="text-align:right">
            <h2>${payment.invoiceNo}</h2>
            <div class="muted">${dateTime(payment.createdAt)}</div>
          </div>
        </div>
        <div><strong>Pasien:</strong> ${payment.visit?.patient?.name ?? "-"}</div>
        <div class="muted">${payment.visit?.patient?.medicalRecordNo ? `No. RM ${payment.visit.patient.medicalRecordNo} - ` : ""}${payment.visit?.polyclinic?.name ?? "-"}</div>
        <table>
          <thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Harga</th><th style="text-align:right">Total</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="totals">
          <div class="line"><span>Subtotal</span><strong>${currency(payment.subtotal)}</strong></div>
          <div class="line"><span>Diskon</span><strong>${currency(payment.discount)}</strong></div>
          <div class="line grand"><span>Total</span><span>${currency(payment.total)}</span></div>
          <div class="line"><span>Dibayar</span><strong>${currency(payment.paidAmount)}</strong></div>
          <div class="line"><span>Metode</span><strong>${payment.paymentMethod ?? "-"}</strong></div>
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

export default function PaymentsPage() {
  const [readyVisits, setReadyVisits] = useState<ReadyPaymentVisit[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [ready, history] = await Promise.all([getReadyPayments(), getPayments()]);
      setReadyVisits(ready);
      setPayments(history);
      setSelectedId((current) => current ?? ready[0]?.id ?? null);
    } catch {
      setError("Data kasir belum dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const selected = readyVisits.find((visit) => visit.id === selectedId) ?? null;
  const filteredReady = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return readyVisits;
    return readyVisits.filter((visit) => [visit.visitNo, visit.patient.name, visit.patient.medicalRecordNo, visit.polyclinic.name].filter(Boolean).some((value) => String(value).toLowerCase().includes(keyword)));
  }, [query, readyVisits]);

  const total = Math.max((selected?.billing.subtotal ?? 0) - discount, 0);
  const effectivePaid = method === "CASH" ? paidAmount : total;
  const change = method === "CASH" ? Math.max(effectivePaid - total, 0) : 0;

  async function handleProcess() {
    if (!selected) return;
    setMessage(null);
    setError(null);
    try {
      await processReadyPayment({
        visitId: selected.id,
        discount,
        paymentMethod: method,
        paidAmount: method === "CASH" ? paidAmount : undefined
      });
      setMessage("Pembayaran berhasil diproses. Invoice otomatis dibuat dan status kunjungan menjadi PAID bila lunas.");
      setDiscount(0);
      setPaidAmount(0);
      setSelectedId(null);
      await load();
    } catch {
      setError("Gagal memproses pembayaran. Pastikan kunjungan masih READY_TO_PAY.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#5f7974] via-[#86a197] to-[#9bb8a5] p-6 text-white shadow-lg">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
              <ReceiptText className="h-3.5 w-3.5" />
              Cashier workflow
            </div>
            <h1 className="text-2xl font-bold md:text-3xl">Kasir & Invoice</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">Kunjungan yang sudah selesai rekam medis dan resep otomatis masuk ke READY_TO_PAY. Kasir cukup pilih pasien, cek rincian otomatis, lalu proses pembayaran.</p>
          </div>
          <Button type="button" variant="outline" onClick={load} className="w-fit bg-white text-[#5f7974] hover:bg-[#e6efe5]">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </section>

      {(message || error) && (
        <div className="rounded-xl border bg-white p-4">
          {message && <p className="text-sm font-medium text-[#5f7974]">{message}</p>}
          {error && <p className="text-sm font-medium text-red-700">{error}</p>}
        </div>
      )}

      <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <div className="rounded-2xl border border-[#c7c1b5] bg-white shadow-sm">
          <div className="border-b border-[#c7c1b5] p-4">
            <h2 className="font-semibold text-[#2a3234]">Antrian Siap Bayar</h2>
            <p className="text-sm text-[#6a746f]">Hanya menampilkan kunjungan status READY_TO_PAY.</p>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a827e]" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 w-full rounded-md border border-[#c7c1b5] pl-9 pr-3 text-sm outline-none focus:border-[#5f7974]" placeholder="Cari pasien / No. RM..." />
            </div>
          </div>
          <div className="max-h-[620px] overflow-y-auto p-3">
            {loading ? (
              <p className="p-4 text-sm text-[#6a746f]">Memuat data kasir...</p>
            ) : filteredReady.length === 0 ? (
              <p className="p-4 text-sm text-[#6a746f]">Belum ada kunjungan READY_TO_PAY.</p>
            ) : (
              filteredReady.map((visit) => (
                <button key={visit.id} type="button" onClick={() => setSelectedId(visit.id)} className={`mb-2 block w-full rounded-xl border p-4 text-left transition hover:border-[#5f7974] ${selectedId === visit.id ? "border-[#5f7974] bg-[#faf8ef]" : "border-[#c7c1b5] bg-white"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#2a3234]">{visit.patient.name}</p>
                      <p className="mt-1 text-xs text-[#6a746f]">{visit.visitNo}{visit.patient.medicalRecordNo ? ` - ${visit.patient.medicalRecordNo}` : ""}</p>
                    </div>
                    <Badge variant="warning">{statusLabel(visit.status)}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-[#6a746f]">{visit.polyclinic.name}</span>
                    <strong className="text-[#5f7974]">{currency(visit.billing.subtotal)}</strong>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#c7c1b5] bg-white shadow-sm">
          <div className="border-b border-[#c7c1b5] p-5">
            <h2 className="font-semibold text-[#2a3234]">Detail Tagihan Otomatis</h2>
            <p className="text-sm text-[#6a746f]">Biaya konsultasi dari poli, tindakan dari rekam medis, obat dari resep.</p>
          </div>
          {!selected ? (
            <div className="grid min-h-[420px] place-items-center p-8 text-center text-sm text-[#6a746f]">Pilih pasien READY_TO_PAY di sisi kiri.</div>
          ) : (
            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_320px]">
              <div>
                <div className="mb-4 rounded-xl bg-[#faf8ef] p-4">
                  <p className="font-semibold text-[#2a3234]">{selected.patient.name}</p>
                  <p className="text-sm text-[#6a746f]">{selected.visitNo} - {selected.polyclinic.name} - {dateTime(selected.visitDate)}</p>
                </div>
                <div className="overflow-hidden rounded-xl border border-[#c7c1b5]">
                  <table className="w-full text-sm">
                    <thead className="bg-[#faf8ef] text-left text-[#4a5657]">
                      <tr>
                        <th className="p-3">Item</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Harga</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.billing.items.map((item) => (
                        <tr key={item.itemName} className="border-t border-[#c7c1b5]">
                          <td className="p-3 font-medium text-[#2a3234]">{item.itemName}</td>
                          <td className="p-3 text-center">{item.quantity}</td>
                          <td className="p-3 text-right">{currency(item.price)}</td>
                          <td className="p-3 text-right font-semibold">{currency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl border border-[#c7c1b5] bg-[#faf8ef] p-4">
                <div className="mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#5f7974]" />
                  <h3 className="font-semibold">Proses Pembayaran</h3>
                </div>
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-xs font-semibold text-[#4a5657]">Diskon</span>
                    <input type="number" min="0" value={discount} onChange={(event) => setDiscount(Number(event.target.value || 0))} className="mt-1 h-10 w-full rounded-md border border-[#c7c1b5] px-3 text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-[#4a5657]">Metode Bayar</span>
                    <select value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)} className="mt-1 h-10 w-full rounded-md border border-[#c7c1b5] px-3 text-sm">
                      <option value="CASH">Cash</option>
                      <option value="TRANSFER">Transfer</option>
                      <option value="BPJS">BPJS</option>
                    </select>
                  </label>
                  {method === "CASH" && (
                    <label className="block">
                      <span className="text-xs font-semibold text-[#4a5657]">Jumlah Dibayar</span>
                      <input type="number" min="0" value={paidAmount} onChange={(event) => setPaidAmount(Number(event.target.value || 0))} className="mt-1 h-10 w-full rounded-md border border-[#c7c1b5] px-3 text-sm" />
                    </label>
                  )}
                  <div className="space-y-2 rounded-xl bg-white p-4 text-sm">
                    <div className="flex justify-between"><span>Subtotal</span><strong>{currency(selected.billing.subtotal)}</strong></div>
                    <div className="flex justify-between"><span>Diskon</span><strong>{currency(discount)}</strong></div>
                    <div className="flex justify-between border-t pt-2 text-base text-[#5f7974]"><span>Total</span><strong>{currency(total)}</strong></div>
                    <div className="flex justify-between"><span>Dibayar</span><strong>{currency(effectivePaid)}</strong></div>
                    {method === "CASH" && <div className="flex justify-between"><span>Kembalian</span><strong>{currency(change)}</strong></div>}
                  </div>
                  <Button type="button" onClick={handleProcess} className="w-full bg-[#5f7974] hover:bg-[#86a197]" disabled={method === "CASH" && paidAmount <= 0}>
                    <Banknote className="h-4 w-4" />
                    Proses Pembayaran
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-[#c7c1b5] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c7c1b5] p-5">
          <div>
            <h2 className="font-semibold text-[#2a3234]">Riwayat Invoice</h2>
            <p className="text-sm text-[#6a746f]">Invoice resmi yang sudah dibuat kasir.</p>
          </div>
          <Badge variant="secondary">{payments.length} invoice</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-[#faf8ef] text-left text-[#4a5657]">
              <tr>
                <th className="p-3">Invoice</th>
                <th className="p-3">Pasien</th>
                <th className="p-3">Metode</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-right">Dibayar</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-t border-[#c7c1b5]">
                  <td className="p-3 font-mono font-semibold text-[#5f7974]">{payment.invoiceNo}</td>
                  <td className="p-3">{payment.visit?.patient?.name ?? "-"}</td>
                  <td className="p-3">{payment.paymentMethod ?? "-"}</td>
                  <td className="p-3 text-right font-semibold">{currency(payment.total)}</td>
                  <td className="p-3 text-right">{currency(payment.paidAmount)}</td>
                  <td className="p-3"><Badge variant={payment.status === "paid" ? "success" : "warning"}>{statusLabel(payment.status)}</Badge></td>
                  <td className="p-3 text-right">
                    <Button type="button" variant="outline" size="sm" onClick={() => printInvoice(payment)}>
                      <Printer className="h-4 w-4" />
                      Print
                    </Button>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-[#6a746f]">Belum ada invoice.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}



