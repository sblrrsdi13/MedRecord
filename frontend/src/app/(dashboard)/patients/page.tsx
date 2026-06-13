import { PatientTable } from "@/components/patient/patient-table";
import { PatientForm } from "@/components/forms/patient-form";
import { FormActionModal } from "@/components/shared/form-action-modal";
import { UsersRound } from "lucide-react";

export default function PatientsPage() {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#5f7974] via-[#86a197] to-[#9aa9a2] p-6 text-white shadow-lg">
        <div className="absolute right-8 top-8 hidden h-36 w-36 rounded-full bg-white/10 blur-2xl md:block" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
              <UsersRound className="h-3.5 w-3.5" />
              Master pasien klinik
            </div>
            <h1 className="text-2xl font-bold md:text-3xl">Patient Management</h1>
            <p className="mt-2 text-sm leading-6 text-white/80">
              Data pasien menjadi titik awal semua proses: pendaftaran kunjungan, antrian, vital sign, rekam medis, resep, dan pembayaran.
            </p>
          </div>
        </div>
      </section>

      <PatientTable
        actionSlot={
          <FormActionModal
            title="Input Pasien Baru"
            description="Data pasien akan dipakai untuk kunjungan, antrian, vital sign, dan rekam medis."
            triggerLabel="Tambah Pasien"
            className="max-w-4xl"
          >
            <PatientForm />
          </FormActionModal>
        }
      />
    </div>
  );
}



