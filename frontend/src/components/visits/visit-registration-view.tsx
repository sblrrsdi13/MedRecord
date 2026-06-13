"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { VisitForm } from "@/components/forms/visit-form";
import { FormActionModal } from "@/components/shared/form-action-modal";
import { VisitRegistrationTable } from "@/components/visits/visit-registration-table";

export function VisitRegistrationView() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3f4a49] via-[#86a197] to-[#9aa9a2] p-5 text-white shadow-lg sm:p-6">
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
              <ClipboardList className="h-3.5 w-3.5" />
              Front office
            </div>
            <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">Pendaftaran Kunjungan</h1>
            <p className="mt-2 text-sm leading-6 text-white/80">
              Mulai dari pasien datang, pilih poli, lalu sistem menyiapkan data untuk antrian, vital sign, rekam medis, dan kasir.
            </p>
          </div>
        </div>
      </section>

      <VisitRegistrationTable
        refreshKey={refreshKey}
        actionSlot={
          <FormActionModal
            title="Input Pendaftaran Pasien"
            description="Pilih pasien, poli tujuan, dan keluhan untuk membuat data pendaftaran kunjungan."
            triggerLabel="Tambah Pendaftaran"
            className="max-w-3xl"
          >
            <VisitForm onCreated={() => setRefreshKey((key) => key + 1)} />
          </FormActionModal>
        }
      />
    </div>
  );
}



