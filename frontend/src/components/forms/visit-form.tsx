"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { ClipboardList, Save, Stethoscope } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FormField, FormMessage, FormSection, sharedFormStyles, sharedInputClassName, sharedSelectTriggerClassName } from "@/components/forms/shared-form";
import { getPatients } from "@/services/patient-service";
import { getPolyclinics, type Polyclinic } from "@/services/polyclinic-service";
import { createVisit } from "@/services/visit-service";
import type { Patient } from "@/types/api";
import { emitResourceChanged } from "@/utils/resource-events";

function defaultVisitNo() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `V${y}${m}0001`;
}

export function VisitForm({ onCreated }: { onCreated?: () => void } = {}) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [polyclinics, setPolyclinics] = useState<Polyclinic[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPatients({ page: 1 }).then((data) => setPatients(data.items)).catch(() => setPatients([]));
    getPolyclinics({ page: 1 }).then((data) => setPolyclinics(data.items)).catch(() => setPolyclinics([]));
  }, []);

  async function onSubmit(formData: FormData) {
    setMessage(null);
    setError(null);
    const patientId = String(formData.get("patientId") || "");
    const polyclinicId = String(formData.get("polyclinicId") || "");

    if (!patientId || !polyclinicId) {
      setError("Pilih pasien dan poli terlebih dahulu.");
      return;
    }

    try {
      await createVisit({
        visitNo: String(formData.get("visitNo") || "") || undefined,
        patientId,
        polyclinicId,
        complaint: String(formData.get("complaint") || "") || undefined
      });
      emitResourceChanged("visits");
      setMessage("Kunjungan berhasil dibuat. Lanjutkan dengan membuat antrian.");
      onCreated?.();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const message = err.response?.data?.message;
        const fieldErrors = err.response?.data?.errors?.fieldErrors;
        if (status === 403) {
          setError("Role Anda belum memiliki akses membuat kunjungan.");
          return;
        }
        if (status === 422 && fieldErrors) {
          setError("Data kunjungan belum valid. Pastikan pasien dan poli dipilih dari daftar.");
          return;
        }
        setError(typeof message === "string" ? message : "Gagal membuat kunjungan. Pastikan pasien dan poli dipilih.");
        return;
      }
      setError("Gagal membuat kunjungan. Pastikan pasien dan poli dipilih.");
    }
  }

  return (
    <form action={onSubmit} className={sharedFormStyles.form}>
      <FormSection icon={ClipboardList} title="Data Pendaftaran">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="No. Kunjungan">
            <Input name="visitNo" placeholder={defaultVisitNo()} className={sharedInputClassName} />
            <p className="mt-1 text-xs text-[#6a746f]">Kosongkan untuk nomor otomatis, contoh {defaultVisitNo()}.</p>
          </FormField>
          <FormField label="Pasien">
            <select name="patientId" className={sharedSelectTriggerClassName} required defaultValue="">
              <option value="">Pilih pasien</option>
              {patients.map((item) => <option key={item.id} value={item.id}>{item.patientCode ?? item.id} - {item.name}</option>)}
            </select>
          </FormField>
        </div>
      </FormSection>

      <FormSection icon={Stethoscope} title="Tujuan Layanan">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Poli Tujuan">
            <select name="polyclinicId" className={sharedSelectTriggerClassName} required defaultValue="">
              <option value="">Pilih poli</option>
              {polyclinics.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </FormField>
          <FormField label="Keluhan Utama">
            <Input name="complaint" placeholder="Keluhan utama pasien" className={sharedInputClassName} />
          </FormField>
        </div>
      </FormSection>

      <FormMessage message={message} error={error} />
      <div className={sharedFormStyles.actions}>
        <button type="reset" className="inline-flex h-10 items-center justify-center rounded-md border border-[#c7c1b5] px-4 text-sm font-medium">Reset</button>
        <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#5f7974] px-4 text-sm font-medium text-white hover:bg-[#86a197]">
          <Save className="h-4 w-4" />
          Simpan Kunjungan
        </button>
      </div>
    </form>
  );
}



