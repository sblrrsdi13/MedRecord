"use client";

import { useEffect, useState } from "react";
import { ListOrdered, Save, UserRound } from "lucide-react";
import { createQueue } from "@/services/queue-service";
import { getPolyclinics, type Polyclinic } from "@/services/polyclinic-service";
import { getPatients } from "@/services/patient-service";
import type { Patient } from "@/types/api";
import { FormField, FormMessage, FormSection, sharedFormStyles, sharedSelectTriggerClassName } from "@/components/forms/shared-form";

export function QueueCreateForm({ onCreated }: { onCreated?: () => void }) {
  const [polyclinics, setPolyclinics] = useState<Polyclinic[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPolyclinics({ page: 1 }).then((data) => setPolyclinics(data.items)).catch(() => setPolyclinics([]));
    getPatients({ page: 1 }).then((data) => setPatients(data.items)).catch(() => setPatients([]));
  }, []);

  async function onSubmit(formData: FormData) {
    setMessage(null);
    setError(null);
    try {
      const patientId = String(formData.get("patientId") || "");
      const queue = await createQueue({
        polyclinicId: String(formData.get("polyclinicId")),
        patientId: patientId || undefined
      });
      setMessage(`Antrian ${queue.queueNumber} berhasil dibuat.`);
      onCreated?.();
    } catch {
      setError("Gagal membuat antrian. Pastikan poli dipilih dan Anda login sebagai Admin/Receptionist.");
    }
  }

  return (
    <form action={onSubmit} className={sharedFormStyles.form}>
      <FormSection icon={ListOrdered} title="Tujuan Antrian">
        <FormField label="Poli">
          <select name="polyclinicId" className={sharedSelectTriggerClassName} required defaultValue="">
            <option value="">Pilih poli</option>
            {polyclinics.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.queuePrefix})</option>)}
          </select>
        </FormField>
      </FormSection>

      <FormSection icon={UserRound} title="Pasien">
        <FormField label="Pasien">
          <select name="patientId" className={sharedSelectTriggerClassName} defaultValue="">
            <option value="">Pasien walk-in</option>
            {patients.map((item) => <option key={item.id} value={item.id}>{item.patientCode ?? item.id} - {item.name}</option>)}
          </select>
        </FormField>
      </FormSection>

      <FormMessage message={message} error={error} />
      <div className={sharedFormStyles.actions}>
        <button type="reset" className="inline-flex h-10 items-center justify-center rounded-md border border-[#c7c1b5] px-4 text-sm font-medium">Reset</button>
        <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#5f7974] px-4 text-sm font-medium text-white hover:bg-[#86a197]">
          <Save className="h-4 w-4" />
          Buat Antrian
        </button>
      </div>
    </form>
  );
}



