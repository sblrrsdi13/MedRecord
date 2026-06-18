"use client";

import { ModulePage } from "@/components/shared/module-page";
import { MedicalRecordForm } from "@/features/medical-records/components/medical-record-form";
import { FormActionModal } from "@/components/shared/form-action-modal";
import { Printer } from "lucide-react";
import { escapeHtml, printDocument } from "@/utils/print";

type PatientInfo = {
  id?: string;
  patientCode?: string | null;
  medicalRecordNo?: string | null;
  name?: string;
  nik?: string | null;
  gender?: "MALE" | "FEMALE";
  birthDate?: string;
  phone?: string | null;
  address?: string | null;
  bloodType?: string | null;
  allergyNotes?: string | null;
};

type VisitInfo = {
  visitNo?: string;
  visitDate?: string;
  complaint?: string | null;
};

function formatDate(value: unknown) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(String(value)));
}

function formatBirthDate(value: unknown) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(String(value)));
}

function formatRupiah(value: unknown) {
  return `Rp. ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Number(value ?? 0))}`;
}

function getPatient(row: Record<string, unknown>) {
  return row.patient as PatientInfo | undefined;
}

function getVisit(row: Record<string, unknown>) {
  return row.visit as VisitInfo | undefined;
}

function patientDisplayId(patient?: PatientInfo) {
  return patient?.patientCode ?? patient?.id ?? "-";
}

function PatientDetailCell({ patient }: { patient?: PatientInfo }) {
  if (!patient) return "-";

  return (
    <div className="mx-auto max-w-[420px] space-y-1.5 text-xs leading-5 text-[#4a5657]">
      <div className="grid gap-x-3 gap-y-1 sm:grid-cols-[1fr_1fr]">
        <span>No. RM: <strong>{patient.medicalRecordNo ?? "-"}</strong></span>
        <span>NIK: <strong>{patient.nik ?? "-"}</strong></span>
        <span>Gender: <strong>{patient.gender === "FEMALE" ? "Perempuan" : "Laki-laki"}</strong></span>
        <span>Tgl Lahir: <strong>{formatBirthDate(patient.birthDate)}</strong></span>
        <span>Gol. Darah: <strong>{patient.bloodType ?? "-"}</strong></span>
        <span>Telepon: <strong>{patient.phone ?? "-"}</strong></span>
        <span>Alergi: <strong>{patient.allergyNotes ?? "-"}</strong></span>
      </div>
      <p>Alamat: <strong>{patient.address ?? "-"}</strong></p>
    </div>
  );
}

function printMedicalRecord(row: Record<string, unknown>) {
  const patient = row.patient as PatientInfo | undefined;
  const doctor = row.doctor as { user?: { name?: string } } | undefined;
  const noRm = patient?.medicalRecordNo ?? "";
  const noRmBoxes = Array.from({ length: Math.max(6, noRm.length || 6) }).map((_, index) => `
    <span class="rm-box">${escapeHtml(noRm[index] ?? "")}</span>
  `).join("");
  printDocument("Rekam Medis", `
    <style>
      @page { size: A4 portrait; margin: 12mm; }
      body { color: #222; }
      .record-sheet { position: relative; width: 186mm; min-height: 273mm; box-sizing: border-box; border: 1.5px solid #222; padding: 12mm; overflow: hidden; }
      .record-sheet::before {
        content: "";
        position: absolute;
        inset: 120px 60px 120px 60px;
        background: linear-gradient(135deg, transparent 0 28%, rgba(199, 193, 181, 0.20) 28% 50%, transparent 50% 100%);
        transform: rotate(0deg);
        pointer-events: none;
      }
      .watermark {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        font-size: 58px;
        font-weight: 800;
        color: rgba(95, 121, 116, 0.08);
        transform: rotate(-8deg);
        pointer-events: none;
      }
      .sheet-content { position: relative; z-index: 1; }
      .rm-row { display: flex; justify-content: flex-end; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; }
      .rm-box { display: inline-flex; width: 18px; height: 18px; align-items: center; justify-content: center; border: 1px solid #222; font-size: 10px; font-weight: 700; }
      .title { margin-top: 10px; text-align: center; font-size: 17px; font-weight: 800; letter-spacing: .02em; }
      .identity { margin-top: 16px; width: 72%; font-size: 12px; }
      .identity-row { display: grid; grid-template-columns: 130px 12px 1fr; min-height: 24px; align-items: end; }
      .dotline { border-bottom: 1px dotted #777; min-height: 18px; padding-left: 4px; }
      .divider { border: 0; border-top: 2px solid #222; border-bottom: 1px solid #222; height: 4px; margin: 12px 0 0; }
      .record-table { width: 100%; border-collapse: collapse; margin-top: 6px; table-layout: fixed; }
      .record-table th, .record-table td { border: 1px solid #333; padding: 8px; vertical-align: top; font-size: 12px; }
      .record-table th { height: 28px; text-align: center; font-weight: 700; background: rgba(250, 248, 239, .65); }
      .record-table td { height: 520px; }
      .col-date { width: 15%; }
      .col-anamnesis { width: 35%; }
      .col-diagnosis { width: 25%; }
      .col-therapy { width: 25%; }
      .meta { margin-top: 10px; display: flex; justify-content: space-between; font-size: 11px; color: #555; }
      @media print {
        body { margin: 0; }
        .record-sheet { width: 186mm; min-height: 273mm; border-color: #222; page-break-after: always; }
      }
    </style>
    <div class="record-sheet">
      <div class="watermark">MedRecord</div>
      <div class="sheet-content">
        <div class="rm-row">
          <span>No.RM</span>
          <span>${noRmBoxes}</span>
        </div>
        <div class="title">KARTU REKAM MEDIK</div>
        <div class="identity">
          <div class="identity-row"><span>Nama Pasien</span><span>:</span><div class="dotline">${escapeHtml(patient?.name)}</div></div>
          <div class="identity-row"><span>Umur/Jenis Kelamin</span><span>:</span><div class="dotline">${escapeHtml(`${patient?.gender === "FEMALE" ? "Perempuan" : "Laki-laki"} | Lahir ${formatBirthDate(patient?.birthDate)}`)}</div></div>
          <div class="identity-row"><span>Alamat</span><span>:</span><div class="dotline">${escapeHtml(patient?.address)}</div></div>
          <div class="identity-row"><span>No. Telp</span><span>:</span><div class="dotline">${escapeHtml(patient?.phone)}</div></div>
          <div class="identity-row"><span>Riwayat Alergi</span><span>:</span><div class="dotline">${escapeHtml(patient?.allergyNotes)}</div></div>
        </div>
        <div class="divider"></div>
        <table class="record-table">
          <thead>
            <tr>
              <th class="col-date">Tanggal</th>
              <th class="col-anamnesis">Anamnesa</th>
              <th class="col-diagnosis">Diagnosa</th>
              <th class="col-therapy">Terapi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${escapeHtml(formatDate(row.createdAt))}</td>
              <td>${escapeHtml(row.anamnesis)}</td>
              <td>${escapeHtml(row.diagnosis)}</td>
              <td>${escapeHtml(row.treatment)}</td>
            </tr>
          </tbody>
        </table>
        <div class="meta">
          <span>Dokter: ${escapeHtml(doctor?.user?.name)}</span>
          <span>Dicetak: ${escapeHtml(new Date().toLocaleString("id-ID"))}</span>
        </div>
      </div>
    </div>
  `);
}

export default function MedicalRecordsPage() {
  return (
    <div className="space-y-6">
      <ModulePage
        title="Medical Records"
        description="Rekam medis dokter berisi anamnesis, diagnosis, tindakan, dan catatan klinis."
        endpoint="/medical-records"
        deleteEndpoint="/medical-records"
        editEndpoint="/medical-records"
        editFields={[
          { key: "visitId", label: "ID Kunjungan" },
          { key: "patientId", label: "ID Pasien" },
          { key: "doctorId", label: "ID Dokter" },
          { key: "anamnesis", label: "Anamnesis" },
          { key: "diagnosis", label: "Diagnosis" },
          { key: "treatment", label: "Tindakan" },
          { key: "treatmentFee", label: "Biaya Tindakan", type: "number" },
          { key: "notes", label: "Catatan" }
        ]}
        actionSlot={
          <FormActionModal title="Input Rekam Medis" description="Form ini khusus dokter. Admin dapat melihat dan menghapus data bila perlu." triggerLabel="Tambah Rekam Medis">
            <MedicalRecordForm />
          </FormActionModal>
        }
        columns={[
          {
            key: "patient.name",
            label: "Nama Pasien"
          },
          {
            key: "patient.id",
            label: "ID Pasien",
            render: (row) => <span className="font-mono text-xs">{patientDisplayId(getPatient(row))}</span>
          },
          {
            key: "visit.visitDate",
            label: "Tanggal Pendaftaran",
            render: (row) => formatDate(getVisit(row)?.visitDate)
          },
          {
            key: "patient.allergyNotes",
            label: "Penyakit Khusus",
            render: (row) => {
              const notes = getPatient(row)?.allergyNotes;
              return notes ? <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">{notes}</span> : "-";
            }
          },
          {
            key: "patient",
            label: "Data Pasien",
            headerClassName: "text-center",
            render: (row) => <PatientDetailCell patient={getPatient(row)} />
          },
          { key: "doctor.user.name", label: "Dokter" },
          { key: "diagnosis", label: "Diagnosis" },
          { key: "treatment", label: "Tindakan" },
          { key: "treatmentFee", label: "Biaya Tindakan", render: (row) => formatRupiah(row.treatmentFee) }
        ]}
        rowActions={[
          { label: "Print Rekam Medis", icon: <Printer className="h-4 w-4" />, onClick: printMedicalRecord }
        ]}
      />
    </div>
  );
}



