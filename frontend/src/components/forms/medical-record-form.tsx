"use client";

import { useEffect, useState } from "react";
import { ClipboardList, FileText, IdCard, Save, Stethoscope } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FormField, FormMessage, FormSection, sharedFormStyles, sharedInputClassName, sharedSelectTriggerClassName } from "@/components/forms/shared-form";
import { createMedicalRecord } from "@/services/clinical-service";
import { getResource } from "@/services/resource-service";
import { useAuthStore } from "@/store/auth-store";
import type { Patient, RoleName } from "@/types/api";

type VisitRow = { id: string; visitNo: string; patientId: string; visitDate?: string; complaint?: string; patient?: Patient };
type DoctorRow = { id: string; user?: { name: string } };
const OPERATIONAL_ROLES: RoleName[] = ["RECEPTIONIST", "NURSE", "DOCTOR", "PHARMACY", "CASHIER"];

export function MedicalRecordForm() {
  const role = useAuthStore((state) => state.user?.role);
  const user = useAuthStore((state) => state.user);
  const canManageMedicalRecords = Boolean(role && OPERATIONAL_ROLES.includes(role));
  const isDoctorAccount = role === "DOCTOR";
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [selectedVisitId, setSelectedVisitId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selectedVisit = visits.find((item) => item.id === selectedVisitId);
  const selectedPatient = selectedVisit?.patient;

  useEffect(() => {
    if (!canManageMedicalRecords) return;
    getResource<VisitRow[]>("/visits").then(setVisits).catch(() => setVisits([]));
    if (!isDoctorAccount) getResource<DoctorRow[]>("/doctors").then(setDoctors).catch(() => setDoctors([]));
  }, [canManageMedicalRecords, isDoctorAccount]);

  async function onSubmit(formData: FormData) {
    if (!canManageMedicalRecords) {
      setError("Role Anda tidak memiliki akses menyimpan rekam medis.");
      return;
    }
    const visit = visits.find((item) => item.id === String(formData.get("visitId")));
    if (!visit) return setError("Pilih kunjungan terlebih dahulu.");
    setMessage(null);
    setError(null);
    try {
      await createMedicalRecord({
        visitId: visit.id,
        doctorId: isDoctorAccount ? undefined : String(formData.get("doctorId")),
        anamnesis: String(formData.get("anamnesis") || "") || undefined,
        diagnosis: String(formData.get("diagnosis")),
        treatment: String(formData.get("treatment") || "") || undefined,
        treatmentFee: Number(formData.get("treatmentFee") || 0),
        notes: String(formData.get("notes") || "") || undefined
      });
      setMessage("Rekam medis berhasil disimpan.");
    } catch {
      setError("Gagal menyimpan rekam medis. Pastikan data lengkap dan role Anda memiliki akses operasional.");
    }
  }

  if (!canManageMedicalRecords) {
    return (
      <div className="rounded-2xl border border-[#d9d5c9] bg-stone-50 p-4 text-sm text-[#4a5657]">
        Form rekam medis hanya tersedia untuk akun operasional klinik.
      </div>
    );
  }

  return (
    <form action={onSubmit} className={sharedFormStyles.form}>
      <FormSection icon={ClipboardList} title="Kunjungan & Dokter">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Kunjungan">
            <select name="visitId" className={sharedSelectTriggerClassName} required value={selectedVisitId} onChange={(event) => setSelectedVisitId(event.target.value)}>
              <option value="">Pilih kunjungan</option>
              {visits.map((visit) => <option key={visit.id} value={visit.id}>{visit.visitNo} - {visit.patient?.name ?? "Pasien"}</option>)}
            </select>
          </FormField>
          {isDoctorAccount ? (
            <FormField label="Dokter">
              <div className="flex h-10 items-center rounded-md border border-[#c7c1b5] bg-[#faf8ef] px-3 text-sm font-medium text-[#5f7974]">
                {user?.name ?? "Dokter login"} otomatis dari akun login
              </div>
            </FormField>
          ) : (
            <FormField label="Dokter">
              <select name="doctorId" className={sharedSelectTriggerClassName} required defaultValue="">
                <option value="">Pilih dokter</option>
                {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.user?.name ?? doctor.id}</option>)}
              </select>
            </FormField>
          )}
        </div>
        {selectedPatient && (
          <div className="mt-4 rounded-2xl border border-[#c7c1b5] bg-[#faf8ef] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#5f7974]">
              <IdCard className="h-4 w-4" />
              Data pasien diambil otomatis dari master data pasien
            </div>
            <div className="grid gap-3 text-sm text-[#4a5657] md:grid-cols-2">
              <Info label="Nama" value={selectedPatient.name} />
              <Info label="ID Pasien" value={selectedPatient.patientCode ?? selectedPatient.id} mono />
              <Info label="No. RM" value={selectedPatient.medicalRecordNo ?? "Belum ada RM"} />
              <Info label="NIK" value={selectedPatient.nik ?? "-"} />
              <Info label="Jenis Kelamin" value={selectedPatient.gender === "FEMALE" ? "Perempuan" : "Laki-laki"} />
              <Info label="Telepon" value={selectedPatient.phone ?? "-"} />
              <Info label="Gol. Darah" value={selectedPatient.bloodType ?? "-"} />
              <Info label="Alergi/Penyakit Khusus" value={selectedPatient.allergyNotes ?? "-"} />
              <div className="md:col-span-2">
                <Info label="Alamat" value={selectedPatient.address ?? "-"} />
              </div>
            </div>
          </div>
        )}
      </FormSection>

      <FormSection icon={Stethoscope} title="Catatan Klinis">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Anamnesis">
            <Input name="anamnesis" placeholder="Anamnesis" className={sharedInputClassName} />
          </FormField>
          <FormField label="Diagnosis">
            <Input name="diagnosis" placeholder="Diagnosis" className={sharedInputClassName} required />
          </FormField>
        </div>
      </FormSection>

      <FormSection icon={FileText} title="Tindakan & Biaya">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Tindakan / Terapi">
            <Input name="treatment" placeholder="Tindakan/terapi" className={sharedInputClassName} />
          </FormField>
          <FormField label="Biaya Tindakan">
            <Input name="treatmentFee" type="number" min="0" defaultValue="0" placeholder="Biaya tindakan" className={sharedInputClassName} />
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Catatan">
              <Input name="notes" placeholder="Catatan tambahan" className={sharedInputClassName} />
            </FormField>
          </div>
        </div>
      </FormSection>

      <FormMessage message={message} error={error} />
      <div className={sharedFormStyles.actions}>
        <button type="reset" className="inline-flex h-10 items-center justify-center rounded-md border border-[#c7c1b5] px-4 text-sm font-medium">Reset</button>
        <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#5f7974] px-4 text-sm font-medium text-white hover:bg-[#86a197]">
          <Save className="h-4 w-4" />
          Simpan Rekam Medis
        </button>
      </div>
    </form>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl bg-white/70 px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#7a827e]">{label}</p>
      <p className={`mt-1 font-semibold text-[#2a3234] ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
    </div>
  );
}



