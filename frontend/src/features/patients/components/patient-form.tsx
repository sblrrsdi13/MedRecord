"use client";

import axios from "axios";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AlertTriangle, Badge, ClipboardList, MapPin, Phone, Save, UserRound, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateChooser } from "@/components/ui/date-chooser";
import { Input } from "@/components/ui/input";
import {
  sharedFormStyles,
  sharedInputClassName,
  sharedSelectTriggerClassName,
  sharedTextareaClassName
} from "@/components/forms/shared-form";
import { createPatient, updatePatient } from "@/features/patients/services/patient-service";
import { getUsers, type UserRow } from "@/features/users/services/user-service";
import { useAuthStore } from "@/store/auth-store";
import type { Patient, RoleName } from "@/types/api";
import { emitResourceChanged } from "@/utils/resource-events";

const STAFF_ROLES: RoleName[] = ["ADMIN", "RECEPTIONIST", "NURSE", "DOCTOR", "PHARMACY", "CASHIER"];

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

function formatDateInput(value?: string) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export function PatientForm({ initialPatient, onSaved }: { initialPatient?: Patient; onSaved?: () => void } = {}) {
  const role = useAuthStore((state) => state.user?.role);
  const [patientUsers, setPatientUsers] = useState<UserRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canLinkPatientAccount = Boolean(role && STAFF_ROLES.includes(role));

  useEffect(() => {
    if (!canLinkPatientAccount) return;
    getUsers()
      .then((users) => setPatientUsers(users.filter((user) => user.role.name === "PATIENT" && user.isActive)))
      .catch(() => setPatientUsers([]));
  }, [canLinkPatientAccount]);

  async function onSubmit(formData: FormData) {
    setMessage(null);
    setError(null);
    const payload = {
      medicalRecordNo: String(formData.get("medicalRecordNo") || "") || undefined,
      userId: String(formData.get("userId") || "") || undefined,
      name: String(formData.get("name")),
      nik: String(formData.get("nik") || "") || undefined,
      gender: String(formData.get("gender")) as "MALE" | "FEMALE",
      birthDate: String(formData.get("birthDate")),
      phone: String(formData.get("phone") || "") || undefined,
      address: String(formData.get("address") || "") || undefined,
      bloodType: String(formData.get("bloodType") || "") || undefined,
      allergyNotes: String(formData.get("allergyNotes") || "") || undefined
    };

    try {
      if (initialPatient) {
        await updatePatient(initialPatient.id, payload);
      } else {
        await createPatient(payload);
      }
      emitResourceChanged("patients");
      setMessage(initialPatient ? "Data pasien berhasil diperbarui." : "Pasien berhasil disimpan.");
      onSaved?.();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message;
        const errors = err.response?.data?.errors;
        setError(typeof message === "string" ? message : `Gagal menyimpan pasien. ${errors ? "Periksa kembali format data yang diisi." : "Pastikan NIK belum dipakai."}`);
        return;
      }
      setError("Gagal menyimpan pasien. Pastikan NIK belum dipakai dan role Anda memiliki akses input pasien.");
    }
  }

  return (
    <form action={onSubmit} className={sharedFormStyles.form}>
      <FormSection icon={UserRound} title="Informasi Personal">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nama Lengkap">
            <Input name="name" defaultValue={initialPatient?.name ?? ""} placeholder="Contoh: Tata Rukmana" className={sharedInputClassName} required />
          </Field>
          <Field label="NIK">
            <Input name="nik" defaultValue={initialPatient?.nik ?? ""} placeholder="NIK minimal 8 digit, boleh dikosongkan" className={sharedInputClassName} />
          </Field>
          <Field label="Tanggal Lahir">
            <DateChooser name="birthDate" defaultValue={formatDateInput(initialPatient?.birthDate)} placeholder="Pilih tanggal lahir" required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Jenis Kelamin">
              <select name="gender" className={sharedSelectTriggerClassName} defaultValue={initialPatient?.gender ?? "MALE"} required>
                <option value="MALE">Laki-laki</option>
                <option value="FEMALE">Perempuan</option>
              </select>
            </Field>
            <Field label="Golongan Darah">
              <select name="bloodType" className={sharedSelectTriggerClassName} defaultValue={initialPatient?.bloodType ?? ""}>
                <option value="">Tidak diketahui</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
            </Field>
          </div>
        </div>
      </FormSection>

      <FormSection icon={Phone} title="Kontak & Alamat">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nomor Telepon">
            <Input name="phone" defaultValue={initialPatient?.phone ?? ""} placeholder="Contoh: 081234567890" className={sharedInputClassName} />
          </Field>
          <Field label="Alamat">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a827e]" />
              <Input name="address" defaultValue={initialPatient?.address ?? ""} placeholder="Alamat lengkap pasien" className={`${sharedInputClassName} pl-9`} />
            </div>
          </Field>
        </div>
      </FormSection>

      <FormSection icon={AlertTriangle} title="Riwayat Medis">
        <Field label="Alergi / Catatan Klinis Penting">
          <textarea
            name="allergyNotes"
            defaultValue={initialPatient?.allergyNotes ?? ""}
            placeholder="Contoh: alergi debu, penisilin, seafood, atau catatan klinis penting lain"
            className={sharedTextareaClassName}
          />
        </Field>
      </FormSection>

      <FormSection icon={ClipboardList} title="Administratif">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="No. Rekam Medis">
            <div className="relative">
              <Badge className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a827e]" />
              <Input name="medicalRecordNo" defaultValue={initialPatient?.medicalRecordNo ?? ""} placeholder="Otomatis saat rekam medis pertama dibuat" className={`${sharedInputClassName} pl-9`} />
            </div>
          </Field>
          <Field label="Akun Portal Pasien">
            {canLinkPatientAccount ? (
              <select name="userId" className={sharedSelectTriggerClassName} defaultValue={initialPatient?.userId ?? ""}>
                <option value="">Tidak dihubungkan ke akun pasien (opsional)</option>
                {patientUsers.map((user) => (
                  <option key={user.id} value={user.id}>{user.name} - {user.email}</option>
                ))}
              </select>
            ) : (
              <div className="flex h-10 items-center rounded-md border border-[#c7c1b5] bg-[#faf8ef] px-3 text-sm text-[#4a5657]">
                Akun login pasien opsional dan dapat dihubungkan oleh petugas klinik.
              </div>
            )}
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
        <Button type="reset" variant="outline">Reset</Button>
        <Button type="submit" className="bg-[#5f7974] hover:bg-[#86a197]">
          <Save className="h-4 w-4" />
          {initialPatient ? "Update Pasien" : "Simpan Pasien"}
        </Button>
      </div>
    </form>
  );
}



