"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, BarChart3, CalendarDays, CheckCircle2, Clock3, Database, Eye, FileText, Gauge, Globe2, MoreVertical, PackageCheck, RefreshCw, Settings, ShieldCheck, TrendingUp, UserCog, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDashboardSummary, type DashboardSummary } from "@/services/dashboard-service";
import { getAdminMonitoring, type AdminMonitoring } from "@/services/site-settings-service";
import { useAuthStore } from "@/store/auth-store";
import { useResourceSocket } from "@/hooks/use-resource-socket";
import { RESOURCE_CHANGED_EVENT } from "@/utils/resource-events";

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value ?? 0));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function DashboardView() {
  const role = useAuthStore((state) => state.user?.role);
  if (role === "ADMIN") return <AdminDashboard />;
  return <OperationalDashboard />;
}

function OperationalDashboard() {
  useResourceSocket();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      setData(await getDashboardSummary());
    } catch {
      setError("Dashboard belum dapat dimuat. Pastikan backend dan database aktif.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    function handleResourceChanged(event: Event) {
      const resource = (event as CustomEvent<{ resource?: string }>).detail?.resource;
      if (resource && ["patients", "visits", "queues", "prescriptions", "payments", "medicines", "medical-records", "vital-signs"].includes(resource)) {
        void load();
      }
    }

    window.addEventListener(RESOURCE_CHANGED_EVENT, handleResourceChanged);
    return () => window.removeEventListener(RESOURCE_CHANGED_EVENT, handleResourceChanged);
  }, [load]);

  const todayLabel = useMemo(() => new Intl.DateTimeFormat("id-ID", { dateStyle: "full" }).format(new Date()), []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-[1440px] rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
        <p className="font-semibold">{error ?? "Dashboard tidak tersedia."}</p>
        <Button className="mt-4" onClick={load}>Coba Lagi</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2a3234] md:text-3xl">Dashboard Operasional Klinik</h1>
          <p className="mt-1 text-sm text-[#6a746f]">Data real dari database untuk {todayLabel}.</p>
        </div>
        <Button variant="outline" onClick={load} className="w-fit border-[#c7c1b5]">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard icon={UsersRound} title="Total Pasien" value={String(data.totals.totalPatients)} helper="Semua pasien terdaftar" tone="sage" />
        <SummaryCard icon={CalendarDays} title="Kunjungan Hari Ini" value={String(data.totals.todayVisits)} helper={`${data.totals.completedVisits} selesai, ${data.totals.pendingVisits} aktif`} tone="soft" />
        <SummaryCard icon={Clock3} title="Antrian Menunggu" value={String(data.totals.waitingQueues)} helper={`${data.totals.calledQueues} sedang dipanggil`} tone="warning" />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="overflow-hidden rounded-xl border border-[#c7c1b5] bg-white">
            <div className="flex items-center justify-between border-b border-[#c7c1b5] bg-[#faf8ef]/60 px-6 py-4">
              <h2 className="text-base font-semibold text-[#2a3234]">Kunjungan Hari Ini</h2>
              <span className="text-sm text-[#6a746f]">{data.recentVisits.length} data</span>
            </div>
            <div className="divide-y divide-[#c7c1b5]">
              {data.recentVisits.length === 0 ? (
                <EmptyRow text="Belum ada kunjungan hari ini." />
              ) : (
                data.recentVisits.map((item) => (
                  <div key={item.id} className="group flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-[#faf8ef]">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border border-[#c7c1b5] bg-[#eef1e8]">
                        <span className="text-xs font-bold text-[#2a3234]">{formatTime(item.visitDate)}</span>
                        <span className="text-[10px] text-[#6a746f]">WIB</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#2a3234]">{item.patient.name}</p>
                        <p className="truncate text-sm text-[#6a746f]">{item.polyclinic.name} - {item.complaint || item.visitNo}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusPill tone={item.status}>{item.status}</StatusPill>
                      <button className="flex h-8 w-8 items-center justify-center rounded text-[#7a827e] transition group-hover:text-[#5f7974]" aria-label="Menu kunjungan">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-[#3f4a49] p-6 text-[#ecf1ff] shadow-lg">
            <div className="relative z-10 grid gap-4 md:grid-cols-3">
              <Insight label="Pendapatan Hari Ini" value={formatCurrency(data.totals.revenueToday)} />
              <Insight label="Resep Pending" value={String(data.totals.pendingPrescriptions)} />
              <Insight label="Invoice Belum Lunas" value={String(data.totals.unpaidPayments)} />
            </div>
            <BarChart3 className="absolute right-8 top-1/2 hidden h-24 w-24 -translate-y-1/2 text-white/15 md:block" />
          </div>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <Panel title="Antrian Aktif">
            {data.queueSnapshot.length === 0 ? (
              <p className="text-sm text-[#6a746f]">Belum ada antrian aktif.</p>
            ) : (
              <div className="space-y-3">
                {data.queueSnapshot.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-[#c7c1b5] bg-[#faf8ef] p-3">
                    <div>
                      <p className="text-sm font-semibold text-[#2a3234]">{item.queueNumber}</p>
                      <p className="text-xs text-[#6a746f]">{item.polyclinic?.name ?? "Poli"} - {item.patient?.name ?? "Pasien"}</p>
                    </div>
                    <StatusPill tone={item.status}>{item.status}</StatusPill>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Stok Obat Rendah">
            {data.lowStockList.length === 0 ? (
              <p className="text-sm text-[#6a746f]">Tidak ada stok rendah.</p>
            ) : (
              <div className="space-y-3">
                {data.lowStockList.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-[#c7c1b5] bg-[#faf8ef] p-3">
                    <div>
                      <p className="text-sm font-semibold text-[#2a3234]">{item.name}</p>
                      <p className="text-xs text-[#6a746f]">{item.code} - min {item.minStock} {item.unit}</p>
                    </div>
                    <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">{item.stock}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </section>

      {data.totals.lowStockMedicines > 0 && (
        <section className="flex items-start gap-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="flex-1">
            <p className="text-sm font-bold">{data.totals.lowStockMedicines} obat berada pada batas stok rendah.</p>
            <p className="text-sm opacity-90">Buka modul Stok Obat untuk melakukan pengecekan dan penyesuaian stok.</p>
          </div>
        </section>
      )}
    </div>
  );
}

function AdminDashboard() {
  useResourceSocket();
  const [data, setData] = useState<AdminMonitoring | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async function loadAdminMonitoring() {
    setLoading(true);
    setError(null);
    try {
      setData(await getAdminMonitoring());
    } catch {
      setError("Monitoring admin belum dapat dimuat. Pastikan backend aktif dan akun Anda Admin.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    function handleResourceChanged(event: Event) {
      const resource = (event as CustomEvent<{ resource?: string }>).detail?.resource;
      if (resource && ["settings", "users", "patients", "notifications", "announcements", "audit-logs"].includes(resource)) {
        void load();
      }
    }

    window.addEventListener(RESOURCE_CHANGED_EVENT, handleResourceChanged);
    return () => window.removeEventListener(RESOURCE_CHANGED_EVENT, handleResourceChanged);
  }, [load]);

  if (loading) return <DashboardSkeleton />;
  if (error || !data) {
    return (
      <div className="mx-auto max-w-[1440px] rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
        <p className="font-semibold">{error ?? "Monitoring admin tidak tersedia."}</p>
        <Button className="mt-4" onClick={load}>Coba Lagi</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <section className="soft-panel overflow-hidden rounded-3xl p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.1em] text-[#5f7974]">Admin Web Control Center</p>
            <h1 className="mt-2 text-3xl font-black text-[#2a3234]">Kelola Website, CMS, Monitoring & Audit</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6a746f]">
              Akun admin difokuskan untuk konfigurasi website, konten publik, user, monitoring sistem, dan audit log. Data medis operasional tidak ditampilkan di dashboard admin.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => window.open("/", "_blank", "noopener,noreferrer")}>
              <Eye className="h-4 w-4" />
              Preview Website
            </Button>
            <Button variant="outline" onClick={load}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetric icon={Globe2} label="Brand Website" value={data.website.brandName} helper={`${data.website.navLinks} menu navigasi`} />
        <AdminMetric icon={FileText} label="Konten Aktif" value={String(data.content.activeAnnouncements)} helper={`${data.content.totalAnnouncements} total pengumuman`} />
        <AdminMetric icon={UserCog} label="User Aktif" value={String(data.users.activeUsers)} helper={`${data.users.totalUsers} total akun`} />
        <AdminMetric icon={Gauge} label="Audit Hari Ini" value={String(data.system.auditToday)} helper="Aktivitas admin & sistem" />
      </section>

      <section className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Panel title="Monitoring Website">
            <div className="grid gap-3 md:grid-cols-2">
              <MonitorRow icon={Settings} label="CMS terakhir disimpan" value={data.website.cmsUpdatedAt ? formatDateTime(data.website.cmsUpdatedAt) : "Belum pernah disimpan"} />
              <MonitorRow icon={Globe2} label="Section layanan" value={`${data.website.departments} department, ${data.website.services} service`} />
              <MonitorRow icon={Database} label="Database" value={data.system.databaseStatus} status={data.system.databaseStatus === "online"} />
              <MonitorRow icon={ShieldCheck} label="API" value={data.system.apiStatus} status={data.system.apiStatus === "online"} />
            </div>
          </Panel>

          <Panel title="Manajemen Website yang Tersedia">
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminLink href="/settings" title="CMS Landing Page & Portal" desc="Logo, nama klinik, hero, layanan, footer, social media, gambar upload, dan preview scroll." />
              <AdminLink href="/announcements" title="Konten Portal Pasien" desc="Pengumuman, edukasi kesehatan, dan informasi publik untuk pasien." />
              <AdminLink href="/notifications" title="Broadcast Notifikasi" desc="Kirim notifikasi admin ke role tertentu secara realtime." />
              <AdminLink href="/users" title="User & Akses" desc="Kelola akun, status aktif, dan role sistem." />
              <AdminLink href="/backup" title="Backup & Recovery" desc="Backup manual, backup otomatis, restore aman, download backup, dan riwayat backup." />
              <AdminLink href="/monitoring" title="Monitoring Sistem" desc="Storage, CPU/RAM, error log, job queue, dan status integrasi." />
              <AdminLink href="/security" title="Keamanan" desc="Password policy, timeout session, whitelist IP, 2FA, enkripsi, dan kebijakan akses pasien." />
              <AdminLink href="/reports" title="Laporan Klinik" desc="Kunjungan, pasien baru, diagnosis, tindakan, obat, keuangan, BPJS, PDF/Excel." />
            </div>
          </Panel>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <Panel title="Status Akun">
            <div className="space-y-3">
              <MonitorRow icon={UsersRound} label="Pasien dengan akun portal" value={String(data.users.patientUsers)} />
              <MonitorRow icon={UserCog} label="User nonaktif" value={String(data.users.inactiveUsers)} />
              <MonitorRow icon={Clock3} label="Waktu server" value={formatDateTime(data.system.serverTime)} />
            </div>
          </Panel>

          <Panel title="Audit Log Terbaru">
            {data.recentAuditLogs.length === 0 ? (
              <p className="text-sm text-[#6a746f]">Belum ada audit log.</p>
            ) : (
              <div className="space-y-4">
                {data.recentAuditLogs.map((item) => (
                  <div key={item.id} className="rounded-xl border border-[#c7c1b5] bg-[#faf8ef] p-3">
                    <p className="text-sm font-bold text-[#2a3234]">{item.action} {item.resource}</p>
                    <p className="mt-1 text-xs text-[#6a746f]">{item.user?.name ?? "System"} - {formatDateTime(item.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ icon: Icon, title, value, helper, tone }: { icon: LucideIcon; title: string; value: string; helper: string; tone: "sage" | "soft" | "warning" }) {
  const toneClass = {
    sage: "bg-[#e6efe5] text-[#5f7974]",
    soft: "bg-[#d9d5c9] text-[#5f7974]",
    warning: "bg-amber-100 text-amber-700"
  }[tone];

  return (
    <div className="flex items-center gap-5 rounded-xl border border-[#c7c1b5] bg-white p-6">
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${toneClass}`}>
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#6a746f]">{title}</p>
        <h3 className="text-xl font-semibold text-[#2a3234]">{value}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-[#6a746f]">
          {tone === "sage" && <TrendingUp className="h-4 w-4 text-green-600" />}
          {tone === "soft" && <CheckCircle2 className="h-4 w-4 text-[#5f7974]" />}
          {tone === "warning" && <PackageCheck className="h-4 w-4 text-amber-700" />}
          {helper}
        </p>
      </div>
    </div>
  );
}

function AdminMetric({ icon: Icon, label, value, helper }: { icon: LucideIcon; label: string; value: string; helper: string }) {
  return (
    <div className="soft-panel flex min-h-32 items-center gap-4 rounded-2xl p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e6efe5] text-[#5f7974]">
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#6a746f]">{label}</p>
        <p className="mt-1 truncate text-2xl font-black text-[#2a3234]">{value}</p>
        <p className="mt-1 text-sm text-[#6a746f]">{helper}</p>
      </div>
    </div>
  );
}

function MonitorRow({ icon: Icon, label, value, status }: { icon: LucideIcon; label: string; value: string; status?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#c7c1b5] bg-[#faf8ef] p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e6efe5] text-[#5f7974]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.06em] text-[#6a746f]">{label}</p>
          <p className="truncate text-sm font-semibold text-[#2a3234]">{value}</p>
        </div>
      </div>
      {typeof status === "boolean" && (
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${status ? "bg-[#86a197]" : "bg-red-500"}`} />
      )}
    </div>
  );
}

function AdminLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="group rounded-2xl border border-[#c7c1b5] bg-[#faf8ef] p-4 transition hover:-translate-y-1 hover:border-[#5f7974] hover:shadow-md">
      <p className="font-black text-[#2a3234] group-hover:text-[#5f7974]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#6a746f]">{desc}</p>
    </Link>
  );
}

function StatusPill({ tone, children }: { tone: string; children: ReactNode }) {
  const className = tone === "completed" || tone === "paid" ? "bg-green-100 text-green-700" : tone === "cancelled" ? "bg-red-100 text-red-700" : "bg-[#e6efe5] text-[#5f7974]";
  return <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${className}`}>{children}</span>;
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.05em] text-white/60">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#c7c1b5] bg-white">
      <div className="border-b border-[#c7c1b5] bg-[#faf8ef]/60 px-6 py-4">
        <h2 className="text-base font-semibold text-[#2a3234]">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <div className="px-6 py-10 text-center text-sm text-[#6a746f]">{text}</div>;
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <div className="h-16 animate-pulse rounded-xl bg-[#eef1e8]" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-[#eef1e8]" />)}
      </div>
      <div className="h-96 animate-pulse rounded-xl bg-[#eef1e8]" />
    </div>
  );
}



