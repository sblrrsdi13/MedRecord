"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Pill, Plus, Save, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FormField, FormMessage, FormSection, sharedFormStyles, sharedInputClassName, sharedSelectTriggerClassName } from "@/components/forms/shared-form";
import { createPrescription } from "@/services/prescription-service";
import { getResource } from "@/services/resource-service";
import type { Medicine } from "@/services/medicine-service";

type MedicalRecordRow = { id: string; patient?: { name: string }; diagnosis: string };
type PrescriptionDraftItem = {
  id: string;
  medicineId: string;
  quantity: number;
  dosage: string;
  instruction: string;
};

function newItem(): PrescriptionDraftItem {
  return {
    id: crypto.randomUUID(),
    medicineId: "",
    quantity: 1,
    dosage: "",
    instruction: ""
  };
}

export function PrescriptionForm() {
  const [records, setRecords] = useState<MedicalRecordRow[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [items, setItems] = useState<PrescriptionDraftItem[]>([newItem()]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getResource<MedicalRecordRow[]>("/medical-records").then(setRecords).catch(() => setRecords([]));
    getResource<Medicine[]>("/medicines").then(setMedicines).catch(() => setMedicines([]));
  }, []);

  async function onSubmit(formData: FormData) {
    setMessage(null);
    setError(null);
    const validItems = items
      .map((item) => ({
        medicineId: item.medicineId,
        quantity: Number(item.quantity || 0),
        dosage: item.dosage.trim(),
        instruction: item.instruction.trim() || undefined
      }))
      .filter((item) => item.medicineId && item.quantity > 0 && item.dosage);

    if (validItems.length === 0) {
      setError("Isi minimal satu obat lengkap dengan jumlah dan dosis.");
      return;
    }

    try {
      await createPrescription({
        medicalRecordId: String(formData.get("medicalRecordId")),
        items: validItems
      });
      setMessage("Resep berhasil dibuat.");
      setItems([newItem()]);
    } catch {
      setError("Gagal membuat resep. Rekam medis mungkin sudah punya resep.");
    }
  }

  function updateItem(id: string, patch: Partial<PrescriptionDraftItem>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function removeItem(id: string) {
    setItems((current) => current.length === 1 ? current : current.filter((item) => item.id !== id));
  }

  return (
    <form action={onSubmit} className={sharedFormStyles.form}>
      <FormSection icon={ClipboardList} title="Sumber Rekam Medis">
        <FormField label="Rekam Medis">
          <select name="medicalRecordId" className={sharedSelectTriggerClassName} required defaultValue="">
            <option value="">Pilih rekam medis</option>
            {records.map((record) => <option key={record.id} value={record.id}>{record.patient?.name ?? "Pasien"} - {record.diagnosis}</option>)}
          </select>
        </FormField>
      </FormSection>

      <FormSection icon={Pill} title="Detail Obat">
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.id} className="rounded-2xl border border-[#c7c1b5] bg-[#faf8ef] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#2a3234]">Obat #{index + 1}</p>
                  <p className="text-xs text-[#6a746f]">Setiap obat punya dosis dan keterangan masing-masing.</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#c7c1b5] bg-white text-[#b78585] transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`Hapus obat ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-[1.5fr_0.6fr_1fr_1.3fr]">
                <FormField label="Obat">
                  <select
                    className={sharedSelectTriggerClassName}
                    required
                    value={item.medicineId}
                    onChange={(event) => updateItem(item.id, { medicineId: event.target.value })}
                  >
                    <option value="">Pilih obat</option>
                    {medicines.map((medicine) => <option key={medicine.id} value={medicine.id}>{medicine.name} - stok {medicine.stock}</option>)}
                  </select>
                </FormField>
                <FormField label="Jumlah">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Jumlah"
                    className={sharedInputClassName}
                    required
                    value={item.quantity}
                    onChange={(event) => updateItem(item.id, { quantity: Number(event.target.value) })}
                  />
                </FormField>
                <FormField label="Dosis">
                  <Input
                    placeholder="Contoh: 3x1"
                    className={sharedInputClassName}
                    required
                    value={item.dosage}
                    onChange={(event) => updateItem(item.id, { dosage: event.target.value })}
                  />
                </FormField>
                <FormField label="Keterangan">
                  <Input
                    placeholder="Sesudah makan / sebelum tidur"
                    className={sharedInputClassName}
                    value={item.instruction}
                    onChange={(event) => updateItem(item.id, { instruction: event.target.value })}
                  />
                </FormField>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setItems((current) => [...current, newItem()])}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#c7c1b5] bg-white px-4 text-sm font-semibold text-[#5f7974] transition hover:bg-[#e6efe5]"
          >
            <Plus className="h-4 w-4" />
            Tambah Obat
          </button>
        </div>
      </FormSection>

      <FormMessage message={message} error={error} />
      <div className={sharedFormStyles.actions}>
        <button type="reset" className="inline-flex h-10 items-center justify-center rounded-md border border-[#c7c1b5] px-4 text-sm font-medium">Reset</button>
        <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#5f7974] px-4 text-sm font-medium text-white hover:bg-[#86a197]">
          <Save className="h-4 w-4" />
          Simpan Resep
        </button>
      </div>
    </form>
  );
}



