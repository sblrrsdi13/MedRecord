"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Cpu, Database, HardDrive, ListChecks, MemoryStick, PlugZap, RefreshCw, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSystemMonitoring, type MonitoringResponse } from "@/services/admin-system-service";

function formatBytes(value: number) {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}j ${minutes}m`;
}

export default function MonitoringPage() {
  const [data, setData] = useState<MonitoringResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setData(await getSystemMonitoring());
    } catch {
      setError("Gagal memuat monitoring sistem. Pastikan login sebagai Admin.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const hostMemoryUsed = data ? data.resources.memoryTotalBytes - data.resources.memoryFreeBytes : 0;
  const hostMemoryPercent = data ? Math.round((hostMemoryUsed / data.resources.memoryTotalBytes) * 100) : 0;
  const heapPercent = data ? Math.round((data.resources.processHeapUsedBytes / Math.max(data.resources.processHeapTotalBytes, 1)) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#5f7974]">Monitoring Sistem</p>
          <h1 className="mt-2 text-3xl font-black text-[#2a3234]">System Health Center</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6a746f]">
            Pantau storage, RAM aplikasi, error log, job queue, dan status integrasi. Metrik RAM utama memakai proses Node agar lebih akurat di cloud.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={load}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading && !data ? <p className="rounded-xl border bg-white p-4 text-sm">Memuat monitoring...</p> : null}

      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Metric icon={Database} label="Database" value={formatBytes(data.storage.databaseBytes)} helper="Estimasi ukuran PostgreSQL" />
            <Metric icon={HardDrive} label="Backup Storage" value={formatBytes(data.storage.backupBytes)} helper="Folder backend/backups" />
            <Metric icon={MemoryStick} label="RAM Aplikasi" value={formatBytes(data.resources.processRssBytes)} helper={`Heap ${formatBytes(data.resources.processHeapUsedBytes)} / ${formatBytes(data.resources.processHeapTotalBytes)} (${heapPercent}%)`} />
            <Metric icon={Cpu} label="Runtime Node" value={formatDuration(data.resources.uptimeSeconds)} helper={`Host ${data.resources.cpuCores} core, RAM host ${hostMemoryPercent}%`} />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MemoryStick className="h-5 w-5" /> Detail Resource</CardTitle>
                <CardDescription>Angka utama memakai proses aplikasi. Info host hanya referensi karena cloud shared dapat membaca kapasitas mesin fisik.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Row title="RSS Process" desc={formatBytes(data.resources.processRssBytes)} status="ok" />
                <Row title="Heap JavaScript" desc={`${formatBytes(data.resources.processHeapUsedBytes)} / ${formatBytes(data.resources.processHeapTotalBytes)}`} status={heapPercent > 80 ? "warning" : "ok"} />
                <Row title="External Memory" desc={formatBytes(data.resources.processExternalBytes)} status="ok" />
                <Row title="Host Memory" desc={`${formatBytes(hostMemoryUsed)} / ${formatBytes(data.resources.memoryTotalBytes)}`} status="info" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5" /> Job Queue</CardTitle>
                <CardDescription>Status pekerjaan yang perlu ditangani admin/operasional.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.jobQueue.map((job) => (
                  <Row key={job.name} title={job.name} desc={`${job.pending} pending`} status={job.status} />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><PlugZap className="h-5 w-5" /> Integrasi</CardTitle>
                <CardDescription>Notifikasi kegagalan integrasi dan status layanan.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.integrations.map((item) => (
                  <Row key={item.name} title={item.name} desc={item.message} status={item.status} />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Error Log</CardTitle>
                <CardDescription>Audit log dengan aksi error terbaru.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.recentErrors.length === 0 ? (
                  <p className="rounded-xl border bg-[#faf8ef] p-3 text-sm text-[#6a746f]">Belum ada error log.</p>
                ) : data.recentErrors.map((item) => (
                  <div key={item.id} className="rounded-xl border bg-white p-3">
                    <p className="text-sm font-bold">{item.action}</p>
                    <p className="text-xs text-[#6a746f]">{item.resource} - {new Date(item.createdAt).toLocaleString("id-ID")}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value, helper }: { icon: LucideIcon; label: string; value: string; helper: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6efe5] text-[#5f7974]">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-[#6a746f]">{label}</p>
          <p className="text-2xl font-black text-[#2a3234]">{value}</p>
          <p className="text-xs text-[#7a827e]">{helper}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ title, desc, status }: { title: string; desc: string; status: string }) {
  const variant = status === "ok" || status === "online" ? "success" : status === "warning" ? "warning" : "secondary";
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-white p-3">
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="text-xs text-[#6a746f]">{desc}</p>
      </div>
      <Badge variant={variant}>{status}</Badge>
    </div>
  );
}
