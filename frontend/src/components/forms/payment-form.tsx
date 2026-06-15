"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Badge, ClipboardList, Save, ReceiptText, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  sharedFormStyles,
  sharedInputClassName,
  sharedSelectTriggerClassName
} from "./shared-form";
import { createPayment } from "@/services/payment-service";
import { getResource } from "@/services/resource-service";
import { emitResourceChanged } from "@/utils/resource-events";

type VisitRow = { id: string; visitNo: string; patient?: { name: string } };

function defaultInvoiceNo() {
  return `INV${new Date().getFullYear()}000001`;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={sharedFormStyles.field}>
      <span className={sharedFormStyles.label}>{label}</span>
      {children}
    </label>
  );
}

function FormSection({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <section className={sharedFormStyles.section}>
      <div className={sharedFormStyles.sectionHeader}>
        <Icon className="h-4 w-4 text-[#5f7974]" />
        <h3 className={sharedFormStyles.sectionTitle}>{title}</h3>
      </div>
      {children}
    </section>
  );
}

export function PaymentForm() {
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getResource<VisitRow[]>("/visits").then(setVisits).catch(() => setVisits([]));
  }, []);

  async function onSubmit(formData: FormData) {
    const subtotal = Number(formData.get("subtotal"));
    const discount = Number(formData.get("discount") || 0);
    const paidAmount = Number(formData.get("paidAmount") || 0);
    const total = Math.max(subtotal - discount, 0);
    setMessage(null);
    setError(null);
    try {
      await createPayment({
        invoiceNo: String(formData.get("invoiceNo") || "") || undefined,
        visitId: String(formData.get("visitId")),
        subtotal,
        discount,
        total,
        paidAmount,
        status: paidAmount >= total ? "paid" : paidAmount > 0 ? "partial" : "unpaid"
      });
      emitResourceChanged("payments");
      emitResourceChanged("visits");
      setMessage("Pembayaran berhasil dibuat.");
    } catch {
      setError("Gagal membuat pembayaran. Kunjungan mungkin sudah memiliki invoice.");
    }
  }

  return (
    <form action={onSubmit} className={sharedFormStyles.form}>
      <FormSection icon={ReceiptText} title="Invoice & Kunjungan">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nomor Invoice">
            <div className="relative">
              <Badge className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a827e]" />
              <Input name="invoiceNo" placeholder={defaultInvoiceNo()} className={`${sharedInputClassName} pl-9`} />
            </div>
            <p className="mt-1 text-xs text-[#6a746f]">Kosongkan untuk nomor otomatis, contoh {defaultInvoiceNo()}.</p>
          </Field>
          <Field label="Kunjungan">
            <select name="visitId" className={sharedSelectTriggerClassName} required defaultValue="">
              <option value="">Pilih kunjungan</option>
              {visits.map((visit) => (
                <option key={visit.id} value={visit.id}>
                  {visit.visitNo} - {visit.patient?.name ?? "Pasien"}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </FormSection>

      <FormSection icon={ClipboardList} title="Perhitungan Pembayaran">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Subtotal">
            <Input name="subtotal" type="number" min="0" placeholder="Subtotal" className={sharedInputClassName} required />
          </Field>
          <Field label="Diskon">
            <Input name="discount" type="number" min="0" placeholder="Diskon" defaultValue="0" className={sharedInputClassName} />
          </Field>
          <Field label="Jumlah Dibayar">
            <Input name="paidAmount" type="number" min="0" placeholder="Jumlah dibayar" defaultValue="0" className={sharedInputClassName} />
          </Field>
        </div>
      </FormSection>

      {(message || error) && (
        <div className="rounded-xl border bg-[#faf8ef] p-3">
          {message && <p className="text-sm text-[#5f7974]">{message}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}

      <div className={sharedFormStyles.actions}>
        <Button type="reset" variant="outline">
          Reset
        </Button>
        <Button type="submit" className="bg-[#5f7974] hover:bg-[#86a197]">
          <Save className="h-4 w-4" />
          Simpan Pembayaran
        </Button>
      </div>
    </form>
  );
}



