import { ModulePage } from "@/components/shared/module-page";
import { VitalSignForm } from "@/features/vital-signs/components/vital-sign-form";
import { FormActionModal } from "@/components/shared/form-action-modal";

export default function VitalSignsPage() {
  return (
    <div className="space-y-6">
      <ModulePage
        title="Vital Signs"
        description="Pencatatan tekanan darah, suhu, nadi, respirasi, berat, dan tinggi badan."
        endpoint="/vital-signs"
        deleteEndpoint="/vital-signs"
        editEndpoint="/vital-signs"
        editFields={[
          { key: "visitId", label: "ID Kunjungan" },
          { key: "patientId", label: "ID Pasien" },
          { key: "temperature", label: "Suhu", type: "number" },
          { key: "bloodPressure", label: "Tekanan Darah" },
          { key: "pulse", label: "Nadi", type: "number" },
          { key: "respiration", label: "Respirasi", type: "number" },
          { key: "weight", label: "Berat", type: "number" },
          { key: "height", label: "Tinggi", type: "number" },
          { key: "notes", label: "Catatan" }
        ]}
        actionSlot={
          <FormActionModal title="Input Vital Sign" description="Catat pemeriksaan awal sebelum pasien masuk ruang dokter." triggerLabel="Tambah Vital Sign">
            <VitalSignForm />
          </FormActionModal>
        }
        columns={[
          { key: "patient.name", label: "Pasien" },
          { key: "temperature", label: "Suhu" },
          { key: "bloodPressure", label: "Tekanan Darah" },
          { key: "pulse", label: "Nadi" },
          { key: "notes", label: "Catatan" }
        ]}
      />
    </div>
  );
}



