"use client";

import { ModulePage } from "@/components/shared/module-page";

const actionLabels: Record<string, string> = {
  CREATE: "Membuat data baru",
  UPDATE: "Mengubah data",
  DELETE: "Menghapus data",
  LOGIN: "Login ke sistem",
  LOGOUT: "Logout dari sistem",
  SEND_NOTIFICATION: "Mengirim notifikasi",
  CALL_QUEUE: "Memanggil antrian",
  RECALL_QUEUE: "Memanggil ulang antrian",
  SKIP_QUEUE: "Melewati antrian",
  COMPLETE_QUEUE: "Menyelesaikan antrian",
  CANCEL_QUEUE: "Membatalkan antrian"
};

const resourceLabels: Record<string, string> = {
  users: "Akun pengguna",
  patients: "Data pasien",
  doctors: "Data dokter",
  polyclinics: "Data poli",
  doctor_schedules: "Jadwal dokter",
  visits: "Kunjungan pasien",
  queues: "Antrian",
  vital_signs: "Vital sign",
  medical_records: "Rekam medis",
  prescriptions: "Resep",
  medicines: "Stok obat",
  payments: "Invoice dan pembayaran",
  notifications: "Notifikasi"
};

function humanize(value: unknown, labels: Record<string, string>) {
  const text = String(value ?? "-");
  return labels[text] ?? labels[text.toUpperCase()] ?? text.replaceAll("_", " ").toLowerCase();
}

export default function AuditLogsPage() {
  return (
    <ModulePage
      title="Audit Logs"
      description="Jejak aktivitas penting untuk keamanan dan kepatuhan data medis."
      endpoint="/audit-logs"
      columns={[
        { key: "user.name", label: "User" },
        { key: "action", label: "Aksi", render: (item) => humanize(item.action, actionLabels) },
        { key: "resource", label: "Data", render: (item) => humanize(item.resource, resourceLabels) },
        { key: "ipAddress", label: "IP" },
        { key: "createdAt", label: "Waktu" }
      ]}
    />
  );
}



