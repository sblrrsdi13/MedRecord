import { ModulePage } from "@/components/shared/module-page";
import { PolyclinicForm } from "@/components/forms/polyclinic-form";
import { FormActionModal } from "@/components/shared/form-action-modal";

export default function PolyclinicsPage() {
  return (
    <div className="space-y-6">
      <ModulePage
        title="Polyclinic Management"
        description="Kelola poli, kode, prefix antrian, dan status aktif."
        endpoint="/polyclinics"
        deleteEndpoint="/polyclinics"
        editEndpoint="/polyclinics"
        editFields={[
          { key: "name", label: "Nama Poli" },
          { key: "code", label: "Kode" },
          { key: "queuePrefix", label: "Prefix Antrian" },
          { key: "consultationFee", label: "Biaya Konsultasi", type: "number" },
          { key: "description", label: "Deskripsi" },
          { key: "isActive", label: "Status", type: "boolean" }
        ]}
        actionSlot={
          <FormActionModal title="Input Poli Baru" description="Prefix antrian menentukan nomor seperti A001, G001, atau O001." triggerLabel="Tambah Poli" className="max-w-4xl">
            <PolyclinicForm />
          </FormActionModal>
        }
        columns={[
          { key: "name", label: "Nama Poli" },
          { key: "code", label: "Kode" },
          { key: "queuePrefix", label: "Prefix" },
          { key: "consultationFee", label: "Biaya Konsultasi" },
          { key: "isActive", label: "Status" }
        ]}
      />
    </div>
  );
}



