"use client";

import { useState } from "react";
import { BadgeDollarSign, Building2, ListOrdered, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { createPolyclinic } from "@/services/polyclinic-service";
import { FormField, FormMessage, FormSection, sharedFormStyles, sharedInputClassName } from "@/components/forms/shared-form";
import { emitResourceChanged } from "@/utils/resource-events";

export function PolyclinicForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setMessage(null);
    setError(null);
    try {
      await createPolyclinic({
        name: String(formData.get("name")),
        code: String(formData.get("code")).toUpperCase(),
        queuePrefix: String(formData.get("queuePrefix")).toUpperCase(),
        consultationFee: Number(formData.get("consultationFee") || 50000),
        description: String(formData.get("description") || "") || undefined,
        isActive: true
      });
      emitResourceChanged("polyclinics");
      setMessage("Poli berhasil disimpan.");
    } catch {
      setError("Gagal menyimpan poli. Pastikan kode dan prefix belum dipakai.");
    }
  }

  return (
    <form action={onSubmit} className={sharedFormStyles.form}>
      <FormSection icon={Building2} title="Informasi Poli">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Nama Poli">
            <Input name="name" placeholder="Contoh: Poli Umum" className={sharedInputClassName} required />
          </FormField>
          <FormField label="Kode Poli">
            <Input name="code" placeholder="Contoh: UMUM" className={sharedInputClassName} required />
          </FormField>
        </div>
      </FormSection>

      <FormSection icon={ListOrdered} title="Antrian & Biaya">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Prefix Antrian">
            <Input name="queuePrefix" placeholder="Contoh: A" maxLength={3} className={sharedInputClassName} required />
          </FormField>
          <FormField label="Biaya Konsultasi">
            <Input name="consultationFee" type="number" min="0" defaultValue="50000" placeholder="Biaya konsultasi" className={sharedInputClassName} required />
          </FormField>
        </div>
      </FormSection>

      <FormSection icon={BadgeDollarSign} title="Keterangan">
        <FormField label="Deskripsi">
          <Input name="description" placeholder="Deskripsi singkat poli" className={sharedInputClassName} />
        </FormField>
      </FormSection>

      <FormMessage message={message} error={error} />
      <div className={sharedFormStyles.actions}>
        <button type="reset" className="inline-flex h-10 items-center justify-center rounded-md border border-[#c7c1b5] px-4 text-sm font-medium">Reset</button>
        <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#5f7974] px-4 text-sm font-medium text-white hover:bg-[#86a197]">
          <Save className="h-4 w-4" />
          Simpan Poli
        </button>
      </div>
    </form>
  );
}



