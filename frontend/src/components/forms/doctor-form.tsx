"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Badge, ClipboardList, Save, Stethoscope, UserRound, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createDoctor } from "@/features/doctors/services/doctor-service";
import { getPolyclinics, type Polyclinic } from "@/features/polyclinics/services/polyclinic-service";
import { getUsers, type UserRow } from "@/features/users/services/user-service";
import { sharedFormStyles, sharedInputClassName, sharedSelectTriggerClassName } from "@/components/forms/shared-form";
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

export function DoctorForm() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [polyclinics, setPolyclinics] = useState<Polyclinic[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getUsers().then((items) => setUsers(items.filter((user) => user.role.name === "DOCTOR"))).catch(() => setUsers([]));
    getPolyclinics({ page: 1 }).then((data) => setPolyclinics(data.items)).catch(() => setPolyclinics([]));
  }, []);

  async function onSubmit(formData: FormData) {
    setMessage(null);
    setError(null);
    try {
      await createDoctor({
        userId: String(formData.get("userId")),
        sipNumber: String(formData.get("sipNumber") || "") || undefined,
        specialization: String(formData.get("specialization") || "") || undefined,
        polyclinicId: String(formData.get("polyclinicId") || "") || undefined
      });
      emitResourceChanged("doctors");
      setMessage("Profil dokter berhasil dibuat.");
    } catch {
      setError("Gagal membuat dokter. Pastikan user role DOCTOR belum punya profil dokter.");
    }
  }

  return (
    <form action={onSubmit} className={sharedFormStyles.form}>
      <FormSection icon={UserRound} title="Akun Dokter">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="User Dokter">
            <select name="userId" className={sharedSelectTriggerClassName} required defaultValue="">
              <option value="">Pilih user dokter</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} - {user.email}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Penempatan Poli">
            <select name="polyclinicId" className={sharedSelectTriggerClassName} defaultValue="">
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

      <FormSection icon={Stethoscope} title="Informasi Profesional">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nomor SIP">
            <div className="relative">
              <Badge className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a827e]" />
              <Input name="sipNumber" placeholder="Nomor SIP" className={`${sharedInputClassName} pl-9`} />
            </div>
          </Field>

          <Field label="Spesialisasi">
            <div className="relative">
              <ClipboardList className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a827e]" />
              <Input name="specialization" placeholder="Contoh: Penyakit Dalam" className={`${sharedInputClassName} pl-9`} />
            </div>
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
          Simpan Dokter
        </Button>
      </div>
    </form>
  );
}


