"use client";

import { useEffect, useState } from "react";
import { ArchiveRestore, Clock, DatabaseBackup, Download, HardDrive, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createManualBackup, downloadBackup, getBackups, restoreBackup, updateAutoBackupPolicy, type BackupItem, type BackupPolicy } from "@/features/admin-system/services/admin-system-service";

function formatBytes(value: number) {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [policy, setPolicy] = useState<BackupPolicy>({ enabled: false, frequency: "daily", runAt: "23:00", retentionDays: 14 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getBackups();
      setBackups(data.backups);
      setPolicy(data.policy);
    } catch {
      setError("Gagal memuat backup. Pastikan login sebagai Admin dan backend aktif.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreateBackup() {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const result = await createManualBackup();
      setMessage(`Backup berhasil dibuat: ${result.file}`);
      await load();
    } catch {
      setError("Gagal membuat backup manual.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore(file: string) {
    if (!window.confirm(`Restore konfigurasi dari ${file}?`)) return;
    setBusy(true);
    setError(null);
    try {
      const result = await restoreBackup(file);
      setMessage(result.note);
    } catch {
      setError("Gagal restore backup.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSavePolicy() {
    setBusy(true);
    setError(null);
    try {
      const saved = await updateAutoBackupPolicy(policy);
      setPolicy(saved);
      setMessage("Pengaturan backup otomatis berhasil disimpan.");
    } catch {
      setError("Gagal menyimpan pengaturan backup otomatis.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#5f7974]">Backup & Recovery</p>
          <h1 className="mt-2 text-3xl font-black text-[#2a3234]">Database Backup Center</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6a746f]">
            Buat backup manual, atur backup otomatis, download arsip, dan restore konfigurasi sistem secara terkontrol.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={load}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button type="button" onClick={handleCreateBackup} disabled={busy}>
            <DatabaseBackup className="h-4 w-4" />
            Backup Manual
          </Button>
        </div>
      </div>

      {message && <p className="rounded-xl border border-[#c7c1b5] bg-[#e6efe5] p-3 text-sm text-[#5f7974]">{message}</p>}
      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Backup Otomatis
            </CardTitle>
            <CardDescription>Pengaturan jadwal backup otomatis untuk server produksi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center justify-between rounded-xl border bg-[#faf8ef] p-3 text-sm font-semibold">
              Aktifkan backup otomatis
              <input type="checkbox" checked={policy.enabled} onChange={(event) => setPolicy((current) => ({ ...current, enabled: event.target.checked }))} />
            </label>
            <Field label="Frekuensi">
              <select className="h-10 rounded-lg border bg-white px-3 text-sm" value={policy.frequency} onChange={(event) => setPolicy((current) => ({ ...current, frequency: event.target.value as BackupPolicy["frequency"] }))}>
                <option value="daily">Harian</option>
                <option value="weekly">Mingguan</option>
                <option value="monthly">Bulanan</option>
              </select>
            </Field>
            <Field label="Jam Backup">
              <input className="h-10 rounded-lg border bg-white px-3 text-sm" type="time" value={policy.runAt} onChange={(event) => setPolicy((current) => ({ ...current, runAt: event.target.value }))} />
            </Field>
            <Field label="Retensi Backup (hari)">
              <input className="h-10 rounded-lg border bg-white px-3 text-sm" type="number" min={1} max={365} value={policy.retentionDays} onChange={(event) => setPolicy((current) => ({ ...current, retentionDays: Number(event.target.value) }))} />
            </Field>
            <Button type="button" className="w-full" onClick={handleSavePolicy} disabled={busy}>
              <Save className="h-4 w-4" />
              Simpan Jadwal
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Riwayat Backup
            </CardTitle>
            <CardDescription>Backup tersimpan di folder backend/storage/backups.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-[#eef1e8] text-left text-xs uppercase text-[#4a5657]">
                  <tr>
                    <th className="px-4 py-3">File</th>
                    <th className="px-4 py-3">Tipe</th>
                    <th className="px-4 py-3">Ukuran</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="px-4 py-6 text-center">Memuat backup...</td></tr>
                  ) : backups.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-6 text-center">Belum ada backup.</td></tr>
                  ) : backups.map((backup) => (
                    <tr key={backup.file} className="border-t">
                      <td className="max-w-[320px] truncate px-4 py-3 font-semibold">{backup.file}</td>
                      <td className="px-4 py-3"><Badge variant={backup.type === "manual" ? "secondary" : "success"}>{backup.type === "manual" ? "Manual" : "Otomatis"}</Badge></td>
                      <td className="px-4 py-3">{formatBytes(backup.size)}</td>
                      <td className="px-4 py-3">{formatDate(backup.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => downloadBackup(backup.file)}>
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => handleRestore(backup.file)}>
                            <ArchiveRestore className="h-4 w-4" />
                            Restore
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold uppercase tracking-[0.06em] text-[#4a5657]">{label}</span>
      {children}
    </label>
  );
}
