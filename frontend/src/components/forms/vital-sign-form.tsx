"use client";

import { useEffect, useState } from "react";
import { Activity, ClipboardList, HeartPulse, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FormField, FormMessage, FormSection, sharedFormStyles, sharedInputClassName, sharedSelectTriggerClassName } from "@/components/forms/shared-form";
import { createVitalSign } from "@/services/clinical-service";
import { getResource } from "@/services/resource-service";

type VisitRow = { id: string; visitNo: string; patientId: string; patient?: { name: string } };

export function VitalSignForm() {
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getResource<VisitRow[]>("/visits").then(setVisits).catch(() => setVisits([]));
  }, []);

  async function onSubmit(formData: FormData) {
    const visit = visits.find((item) => item.id === String(formData.get("visitId")));
    if (!visit) return setError("Pilih kunjungan terlebih dahulu.");
    setMessage(null);
    setError(null);
    try {
      await createVitalSign({
        visitId: visit.id,
        patientId: visit.patientId,
        temperature: Number(formData.get("temperature") || undefined),
        bloodPressure: String(formData.get("bloodPressure") || "") || undefined,
        pulse: Number(formData.get("pulse") || undefined),
        respiration: Number(formData.get("respiration") || undefined),
        weight: Number(formData.get("weight") || undefined),
        height: Number(formData.get("height") || undefined),
        notes: String(formData.get("notes") || "") || undefined
      });
      setMessage("Vital sign berhasil dicatat.");
    } catch {
      setError("Gagal mencatat vital sign. Kunjungan mungkin sudah memiliki vital sign.");
    }
  }

  return (
    <form action={onSubmit} className={sharedFormStyles.form}>
      <FormSection icon={ClipboardList} title="Kunjungan Pasien">
        <FormField label="Pilih Kunjungan">
          <select name="visitId" className={sharedSelectTriggerClassName} required defaultValue="">
            <option value="">Pilih kunjungan</option>
            {visits.map((visit) => <option key={visit.id} value={visit.id}>{visit.visitNo} - {visit.patient?.name ?? "Pasien"}</option>)}
          </select>
        </FormField>
      </FormSection>

      <FormSection icon={HeartPulse} title="Pemeriksaan Vital">
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Suhu">
            <Input name="temperature" type="number" step="0.1" placeholder="36.5" className={sharedInputClassName} />
          </FormField>
          <FormField label="Tekanan Darah">
            <Input name="bloodPressure" placeholder="120/80" className={sharedInputClassName} />
          </FormField>
          <FormField label="Nadi">
            <Input name="pulse" type="number" placeholder="80" className={sharedInputClassName} />
          </FormField>
          <FormField label="Respirasi">
            <Input name="respiration" type="number" placeholder="20" className={sharedInputClassName} />
          </FormField>
          <FormField label="Berat Badan">
            <Input name="weight" type="number" step="0.1" placeholder="60" className={sharedInputClassName} />
          </FormField>
          <FormField label="Tinggi Badan">
            <Input name="height" type="number" step="0.1" placeholder="170" className={sharedInputClassName} />
          </FormField>
        </div>
      </FormSection>

      <FormSection icon={Activity} title="Catatan Pemeriksaan">
        <FormField label="Catatan">
          <Input name="notes" placeholder="Catatan tambahan" className={sharedInputClassName} />
        </FormField>
      </FormSection>

      <FormMessage message={message} error={error} />
      <div className={sharedFormStyles.actions}>
        <button type="reset" className="inline-flex h-10 items-center justify-center rounded-md border border-[#c7c1b5] px-4 text-sm font-medium">Reset</button>
        <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#5f7974] px-4 text-sm font-medium text-white hover:bg-[#86a197]">
          <Save className="h-4 w-4" />
          Simpan Vital Sign
        </button>
      </div>
    </form>
  );
}



