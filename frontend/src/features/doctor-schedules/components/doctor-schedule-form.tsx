"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Clock, Users, Save, Stethoscope, Hospital, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createDoctorSchedule } from "@/features/doctors/services/doctor-service";
import { getPolyclinics, type Polyclinic } from "@/features/polyclinics/services/polyclinic-service";
import { getCachedResource } from "@/features/resources/services/resource-service";
import { sharedFormStyles, sharedInputClassName, sharedSelectTriggerClassName } from "@/components/forms/shared-form";
import { emitResourceChanged } from "@/utils/resource-events";

type DoctorRow = { id: string; user?: { name: string } };

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

export function DoctorScheduleForm() {
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [polyclinics, setPolyclinics] = useState<Polyclinic[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCachedResource<DoctorRow[]>("/doctors").then(setDoctors).catch(() => setDoctors([]));
    getPolyclinics({ page: 1 }).then((data) => setPolyclinics(data.items)).catch(() => setPolyclinics([]));
  }, []);

  async function onSubmit(formData: FormData) {
    setMessage(null);
    setError(null);
    try {
      await createDoctorSchedule({
        doctorId: String(formData.get("doctorId")),
        polyclinicId: String(formData.get("polyclinicId")),
        dayOfWeek: Number(formData.get("dayOfWeek")),
        startTime: String(formData.get("startTime")),
        endTime: String(formData.get("endTime")),
        quota: Number(formData.get("quota")),
        isActive: true
      });
      emitResourceChanged("doctor-schedules");
      setMessage("Jadwal dokter berhasil dibuat.");
    } catch {
      setError("Gagal membuat jadwal dokter.");
    }
  }

  return (
    <form action={onSubmit} className={sharedFormStyles.form}>
      <FormSection icon={Stethoscope} title="Pilihan Dokter & Poli">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Dokter">
            <select name="doctorId" className={sharedSelectTriggerClassName} required defaultValue="">
              <option value="">Pilih dokter</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.user?.name ?? doctor.id}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Poli / Unit">
            <select name="polyclinicId" className={sharedSelectTriggerClassName} required defaultValue="">
              <option value="">Pilih poli</option>
              {polyclinics.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </FormSection>

      <FormSection icon={Clock} title="Jadwal Praktik">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Hari">
            <select name="dayOfWeek" className={sharedSelectTriggerClassName} required defaultValue="">
              <option value="">Pilih hari</option>
              <option value="1">Senin</option>
              <option value="2">Selasa</option>
              <option value="3">Rabu</option>
              <option value="4">Kamis</option>
              <option value="5">Jumat</option>
              <option value="6">Sabtu</option>
              <option value="0">Minggu</option>
            </select>
          </Field>
          <Field label="Jam Mulai">
            <Input name="startTime" type="time" className={sharedInputClassName} required />
          </Field>
          <Field label="Jam Selesai">
            <Input name="endTime" type="time" className={sharedInputClassName} required />
          </Field>
        </div>
      </FormSection>

      <FormSection icon={Users} title="Kapasitas Pasien">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Kuota Pasien Per Sesi">
            <Input name="quota" type="number" min="1" defaultValue="30" placeholder="Jumlah pasien" className={sharedInputClassName} required />
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
          Simpan Jadwal
        </Button>
      </div>
    </form>
  );
}
