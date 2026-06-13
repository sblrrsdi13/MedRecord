"use client";

import { ModulePage } from "@/components/shared/module-page";
import { PrescriptionForm } from "@/components/forms/prescription-form";
import { FormActionModal } from "@/components/shared/form-action-modal";
import { Printer } from "lucide-react";
import { escapeHtml, printDocument } from "@/utils/print";

function printPrescription(row: Record<string, unknown>) {
  const record = row.medicalRecord as { patient?: { name?: string; medicalRecordNo?: string | null }; doctor?: { user?: { name?: string } } } | undefined;
  const items = Array.isArray(row.items) ? row.items as Array<{ quantity?: number; dosage?: string; instruction?: string; medicine?: { name?: string; unit?: string } }> : [];
  printDocument("Resep Pasien", `
    <div class="header">
      <div>
        <h1>Resep Pasien</h1>
        <p class="muted">Dokumen resep klinik</p>
      </div>
      <div class="muted">${new Date().toLocaleString("id-ID")}</div>
    </div>
    <div class="grid">
      <div class="box"><strong>Pasien</strong><br />${escapeHtml(record?.patient?.name)}</div>
      ${record?.patient?.medicalRecordNo ? `<div class="box"><strong>No. RM</strong><br />${escapeHtml(record.patient.medicalRecordNo)}</div>` : ""}
      <div class="box"><strong>Dokter</strong><br />${escapeHtml(record?.doctor?.user?.name)}</div>
      <div class="box"><strong>Status</strong><br />${escapeHtml(row.status)}</div>
    </div>
    <h2>Daftar Obat</h2>
    <table>
      <thead><tr><th>Obat</th><th>Jumlah</th><th>Dosis</th><th>Instruksi</th></tr></thead>
      <tbody>
        ${items.map((item) => `
          <tr>
            <td>${escapeHtml(item.medicine?.name)}</td>
            <td>${escapeHtml(`${item.quantity ?? 0} ${item.medicine?.unit ?? ""}`)}</td>
            <td>${escapeHtml(item.dosage)}</td>
            <td>${escapeHtml(item.instruction)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `);
}

export default function PrescriptionsPage() {
  return (
    <div className="space-y-6">
      <ModulePage
        title="Prescriptions"
        description="Kelola resep dokter dan status persiapan apotek."
        endpoint="/prescriptions"
        deleteEndpoint="/prescriptions"
        editEndpoint="/prescriptions"
        editFields={[
          { key: "status", label: "Status Resep" }
        ]}
        actionSlot={
          <FormActionModal title="Input Resep" description="Pilih rekam medis dan obat untuk membuat resep." triggerLabel="Tambah Resep">
            <PrescriptionForm />
          </FormActionModal>
        }
        columns={[
          { key: "medicalRecord.patient.name", label: "Pasien" },
          { key: "status", label: "Status" },
          { key: "createdAt", label: "Tanggal" }
        ]}
        rowActions={[
          { label: "Print Resep", icon: <Printer className="h-4 w-4" />, onClick: printPrescription }
        ]}
      />
    </div>
  );
}



