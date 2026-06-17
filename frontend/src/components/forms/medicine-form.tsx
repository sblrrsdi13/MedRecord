"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { ClipboardList, Package, Save, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createMedicine } from "@/features/medicines/services/medicine-service";
import { sharedFormStyles, sharedInputClassName } from "@/components/forms/shared-form";
import { emitResourceChanged } from "@/utils/resource-events";

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

export function MedicineForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setMessage(null);
    setError(null);
    try {
      await createMedicine({
        code: String(formData.get("code")).toUpperCase(),
        name: String(formData.get("name")),
        unit: String(formData.get("unit")),
        price: Number(formData.get("price")),
        stock: Number(formData.get("stock")),
        minStock: Number(formData.get("minStock"))
      });
      emitResourceChanged("medicines");
      setMessage("Obat berhasil disimpan.");
    } catch {
      setError("Gagal menyimpan obat. Pastikan kode obat belum dipakai.");
    }
  }

  return (
    <form action={onSubmit} className={sharedFormStyles.form}>
      <FormSection icon={Package} title="Informasi Obat">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Kode Obat">
            <Input name="code" placeholder="Contoh: OBT001" className={sharedInputClassName} required />
          </Field>
          <Field label="Nama Obat">
            <Input name="name" placeholder="Nama obat" className={sharedInputClassName} required />
          </Field>
          <Field label="Satuan">
            <Input name="unit" placeholder="Contoh: tablet" className={sharedInputClassName} required />
          </Field>
        </div>
      </FormSection>

      <FormSection icon={ClipboardList} title="Persediaan & Harga">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Harga">
            <Input name="price" type="number" min="0" placeholder="Harga" className={sharedInputClassName} required />
          </Field>
          <Field label="Stok Awal">
            <Input
              name="stock"
              type="number"
              min="0"
              placeholder="Stok awal"
              defaultValue="0"
              className={sharedInputClassName}
              required
            />
          </Field>
          <Field label="Stok Minimum">
            <Input
              name="minStock"
              type="number"
              min="0"
              placeholder="Stok minimum"
              defaultValue="5"
              className={sharedInputClassName}
              required
            />
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
          Simpan Obat
        </Button>
      </div>
    </form>
  );
}


