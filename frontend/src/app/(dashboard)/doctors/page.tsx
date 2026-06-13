import { ModulePage } from "@/components/shared/module-page";
import { DoctorForm } from "@/components/forms/doctor-form";
import { FormActionModal } from "@/components/shared/form-action-modal";

export default function DoctorsPage() {
  return (
    <div className="space-y-6">
      <ModulePage
        title="Doctor Management"
        description="Kelola data dokter, spesialisasi, dan relasi poli."
        endpoint="/doctors"
        deleteEndpoint="/doctors"
        editEndpoint="/doctors"
        editFields={[
          { key: "userId", label: "ID User Dokter" },
          { key: "sipNumber", label: "Nomor SIP" },
          { key: "specialization", label: "Spesialisasi" },
          { key: "polyclinicId", label: "ID Poli" }
        ]}
        actionSlot={
          <FormActionModal title="Input Profil Dokter" description="Buat user role DOCTOR terlebih dahulu dari User & Role Management." triggerLabel="Tambah Dokter" className="max-w-4xl">
            <DoctorForm />
          </FormActionModal>
        }
        columns={[
          { key: "user.name", label: "Nama" },
          { key: "user.email", label: "Email" },
          { key: "specialization", label: "Spesialisasi" },
          { key: "polyclinic.name", label: "Poli" }
        ]}
        notes={["Dokter dibuat dari user dengan role DOCTOR.", "Data dokter dan relasi poli dikelola oleh Admin sebagai data master.", "Operasional hanya memakai data dokter ini saat membuat kunjungan atau rekam medis."]}
      />
    </div>
  );
}



