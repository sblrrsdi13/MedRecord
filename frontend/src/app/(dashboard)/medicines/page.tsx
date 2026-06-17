import { ModulePage } from "@/components/shared/module-page";
import { MedicineForm } from "@/features/medicines/components/medicine-form";
import { FormActionModal } from "@/components/shared/form-action-modal";

export default function MedicinesPage() {
  return (
    <div className="space-y-6">
      <ModulePage
        title="Medicine Stock"
        description="Kelola master obat, harga, stok, dan batas minimum."
        endpoint="/medicines"
        deleteEndpoint="/medicines"
        editEndpoint="/medicines"
        editFields={[
          { key: "code", label: "Kode" },
          { key: "name", label: "Nama Obat" },
          { key: "unit", label: "Satuan" },
          { key: "price", label: "Harga", type: "number" },
          { key: "stock", label: "Stok", type: "number" },
          { key: "minStock", label: "Minimum", type: "number" }
        ]}
        actionSlot={
          <FormActionModal title="Input Obat Baru" description="Data obat dipakai untuk resep, farmasi, dan stok." triggerLabel="Tambah Obat" className="max-w-4xl">
            <MedicineForm />
          </FormActionModal>
        }
        columns={[
          { key: "code", label: "Kode" },
          { key: "name", label: "Nama Obat" },
          { key: "unit", label: "Satuan" },
          { key: "stock", label: "Stok" },
          { key: "minStock", label: "Minimum" }
        ]}
      />
    </div>
  );
}



