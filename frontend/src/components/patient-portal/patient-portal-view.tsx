"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import type { Socket } from "socket.io-client";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  CalendarClock,
  CalendarDays,
  CreditCard,
  Droplets,
  FileText,
  HeartPulse,
  Home,
  KeyRound,
  MapPin,
  Megaphone,
  Pill,
  Printer,
  Settings,
  ShieldCheck,
  Stethoscope,
  UserRound,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateChooser } from "@/components/ui/date-chooser";
import { SelectChooser } from "@/components/ui/select-chooser";
import { AnnouncementCard } from "@/components/ui/announcement-card";
import { NotificationCard, notificationSenderBadge } from "@/components/ui/notification-card";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { useLanguage } from "@/contexts/language-context";
import { changePassword, getMe, logout } from "@/services/auth-service";
import { getAnnouncements, type AnnouncementItem } from "@/services/announcement-service";
import { clearNotifications, deleteNotification, getNotifications, markNotificationRead, type NotificationItem } from "@/services/notification-service";
import { getPatientPortal, payPatientInvoice, updatePatientPortalProfile, type PatientPortalData } from "@/services/patient-portal-service";
import { useAuthStore } from "@/store/auth-store";
import { useSiteCms } from "@/hooks/use-site-cms";
import type { RoleName, UserSession } from "@/types/api";
import { cn } from "@/lib/utils";
import { escapeHtml, printDocument } from "@/utils/print";

const tabs = [
  { key: "home", label: "Beranda", short: "Home", icon: Home },
  { key: "visits", label: "Kunjungan", short: "Riwayat", icon: CalendarClock },
  { key: "records", label: "Rekam Medis", short: "Medis", icon: FileText },
  { key: "prescriptions", label: "Resep", short: "Resep", icon: Pill },
  { key: "payments", label: "Pembayaran", short: "Bayar", icon: CreditCard }
] as const;

type TabKey = (typeof tabs)[number]["key"] | "profile";
const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value ?? 0));
}

function dateInputValue(value?: string) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export function PatientPortalView() {
  const [active, setActive] = useState<TabKey>("home");
  const [data, setData] = useState<PatientPortalData | null>(null);
  const [account, setAccount] = useState<(UserSession & { phone?: string; isActive?: boolean; createdAt?: string }) | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const accessToken = useAuthStore((state) => state.accessToken);
  const clearSession = useAuthStore((state) => state.clearSession);
  const { t } = useLanguage();
  const cms = useSiteCms();

  useEffect(() => {
    Promise.all([getPatientPortal(), getMe(), getAnnouncements()])
      .then(([portal, me, portalAnnouncements]) => {
        setData(portal);
        setAccount(me);
        setAnnouncements(portalAnnouncements.filter((item) => item.isActive));
      })
      .catch(() => setError("Data pasien belum dapat dimuat. Pastikan login sebagai pasien."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!account?.id || !accessToken) {
      setNotifications([]);
      return;
    }
    getNotifications().then(setNotifications).catch(() => setNotifications([]));
  }, [accessToken, account?.id]);

  useEffect(() => {
    if (!account?.id) return;
    let mounted = true;
    let socket: Socket | null = null;
    let idleId: number | null = null;
    const win = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    const connectSocket = () => {
      import("socket.io-client")
        .then(({ io }) => {
          if (!mounted) return;
          socket = io(socketUrl, { withCredentials: true, transports: ["websocket"] });
          socket.on("notification:new", (payload: { recipientId: string; notification: NotificationItem }) => {
            if (payload.recipientId !== account.id) return;
            setNotifications((items) => [payload.notification, ...items.filter((item) => item.id !== payload.notification.id)].slice(0, 30));
          });
          socket.on("notification:deleted", (payload: { recipientId: string; id: string }) => {
            if (payload.recipientId === account.id) setNotifications((items) => items.filter((item) => item.id !== payload.id));
          });
          socket.on("notification:cleared", (payload: { recipientId: string }) => {
            if (payload.recipientId === account.id) setNotifications([]);
          });
        })
        .catch(() => null);
    };

    if (win.requestIdleCallback) {
      idleId = win.requestIdleCallback(connectSocket, { timeout: 2500 });
    } else {
      idleId = win.setTimeout(connectSocket, 900);
    }

    return () => {
      mounted = false;
      if (idleId !== null) {
        if (win.cancelIdleCallback) win.cancelIdleCallback(idleId);
        else win.clearTimeout(idleId);
      }
      socket?.disconnect();
    };
  }, [account?.id]);

  const unreadCount = notifications.filter((item) => !item.readAt).length;

  async function handleReadNotification(notification: NotificationItem) {
    if (!notification.readAt) {
      await markNotificationRead(notification.id).catch(() => null);
      setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item));
    }
  }

  async function handleDeleteNotification(notification: NotificationItem) {
    await deleteNotification(notification.id).catch(() => null);
    setNotifications((items) => items.filter((item) => item.id !== notification.id));
  }

  async function handleClearNotifications() {
    await clearNotifications().catch(() => null);
    setNotifications([]);
  }

  async function handlePayInvoice(paymentId: string) {
    await payPatientInvoice(paymentId);
    const portal = await getPatientPortal();
    setData(portal);
  }

  async function handleLogout() {
    try {
      await logout();
    } finally {
      clearSession();
      router.push("/login");
    }
  }

  async function handleProfileSubmit(formData: FormData) {
    setSettingsError(null);
    setProfileMessage(null);
    try {
      const portalUpdate = await updatePatientPortalProfile({
        name: String(formData.get("name")),
        email: String(formData.get("email")),
        phone: String(formData.get("phone") || "") || undefined,
        nik: String(formData.get("nik")),
        birthDate: String(formData.get("birthDate")),
        gender: String(formData.get("gender")) as "MALE" | "FEMALE",
        bloodType: String(formData.get("bloodType") || "") || undefined,
        address: String(formData.get("address")),
        allergyNotes: String(formData.get("allergyNotes") || "") || undefined
      });
      setAccount((current) => current ? { ...current, ...portalUpdate.user, role: portalUpdate.user.role as RoleName } : { ...portalUpdate.user, role: portalUpdate.user.role as RoleName });
      setData((current) => current ? { ...current, patient: portalUpdate.patient } : current);
      setSession({ id: portalUpdate.user.id, name: portalUpdate.user.name, email: portalUpdate.user.email, role: portalUpdate.user.role as RoleName }, accessToken ?? "");
      setProfileMessage("Profil akun berhasil diperbarui.");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setSettingsError(err.response?.data?.message ?? "Gagal memperbarui profil akun.");
        return;
      }
      setSettingsError("Gagal memperbarui profil akun.");
    }
  }

  async function handlePasswordSubmit(formData: FormData) {
    setSettingsError(null);
    setPasswordMessage(null);
    const newPassword = String(formData.get("newPassword"));
    const confirmPassword = String(formData.get("confirmPassword"));

    if (newPassword !== confirmPassword) {
      setSettingsError("Konfirmasi password baru tidak sama.");
      return;
    }

    try {
      await changePassword({
        currentPassword: String(formData.get("currentPassword")),
        newPassword
      });
      setPasswordMessage("Password berhasil diganti. Silakan login ulang.");
      clearSession();
      setTimeout(() => router.push("/login"), 700);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setSettingsError(err.response?.data?.message ?? "Gagal mengganti password.");
        return;
      }
      setSettingsError("Gagal mengganti password.");
    }
  }

  const nowLabel = useMemo(() => formatDateTime(new Date().toISOString()), []);

  if (loading) {
    return (
      <main className="theme-surface flex min-h-screen items-center justify-center text-[#2a3234]">
        <div className="soft-panel rounded-2xl p-6">{t("patient.loading", "Memuat portal pasien...")}</div>
      </main>
    );
  }

  if (error || !data?.patient) {
    return (
      <main className="theme-surface flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-lg">
          <CardContent className="p-6">
            <p className="font-medium text-[#2a3234]">{error ?? t("patient.not_linked", "Akun pasien belum terhubung.")}</p>
            <p className="mt-1 text-sm text-[#5f7974]">{t("patient.not_linked_desc", "Admin atau receptionist perlu menghubungkan akun user pasien ke data pasien.")}</p>
            <Button className="mt-4" onClick={handleLogout}>{t("sidebar.logout", "Logout")}</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const initials = data.patient.name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const activeTab = tabs.find((tab) => tab.key === active);
  const ActiveIcon = activeTab?.icon ?? UserRound;
  const genderLabel = data.patient.gender === "MALE" ? t("patient.gender_male", "Laki-laki") : t("patient.gender_female", "Perempuan");
  const nextVisit = data.visits[0];
  const activeTitle = active === "profile" ? t("patient.profile_detail", "Detail Profil") : activeTab ? t(`patient.tabs.${activeTab.key}`, activeTab.label) : t("patient.profile_detail", "Detail Profil");

  return (
    <main className="theme-surface flex min-h-screen flex-col text-[#2a3234]">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#c7c1b5] bg-[#faf8ef]/82 shadow-[0_10px_34px_rgba(48,55,50,.12)] backdrop-blur-2xl">
        <div className="mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden">
              <img src={cms.logoImageUrl} alt={`${cms.brandName} logo`} className="h-11 w-11 object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-[#5f7974]">{cms.brandName}</h1>
              <p className="truncate text-sm text-[#4a5657]">{cms.brandSubtitle}</p>
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActive(tab.key)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-bold uppercase tracking-[0.05em] text-[#4a5657] transition hover:bg-[#e6efe5]",
                    active === tab.key && "bg-[#e6efe5] text-[#5f7974] shadow-inner"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t(`patient.tabs.${tab.key}`, tab.label)}
                </button>
              );
            })}
          </nav>

          <div className="relative flex shrink-0 items-center gap-3">
            <LanguageToggle />

            <div className="relative">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-[#faf8ef]"
                aria-label={t("notification.title", "Notifikasi")}
                onClick={() => setNotificationOpen((open) => !open)}
              >
                <Bell className="h-5 w-5 text-[#4a5657]" />
                {unreadCount > 0 && (
                  <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <>
                  <button className="fixed inset-0 z-40 cursor-default" aria-label={t("patient.close_notifications", "Tutup notifikasi")} onClick={() => setNotificationOpen(false)} />
                  <div className="soft-panel absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl animate-in">
                    <div className="border-b border-[#c7c1b5] bg-[#faf8ef]/80 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[#2a3234]">{t("notification.title", "Notifikasi")}</p>
                          <p className="text-xs text-[#4a5657]">{unreadCount} {t("notification.unread", "belum dibaca")}</p>
                        </div>
                        {notifications.length > 0 && (
                          <button type="button" onClick={handleClearNotifications} className="text-xs font-semibold text-[#5f7974] hover:underline">
                            {t("notification.clear", "Bersihkan")}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto p-2">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-sm text-[#4a5657]">{t("notification.empty", "Belum ada notifikasi.")}</p>
                      ) : (
                        <div className="grid gap-2">
                          {notifications.map((item) => (
                            <NotificationCard
                              key={item.id}
                              item={item}
                              dateLabel={formatDateTime(item.createdAt)}
                              senderLabel={notificationSenderBadge(item.sender?.role).label}
                              onRead={() => handleReadNotification(item)}
                              onDelete={() => handleDeleteNotification(item)}
                              deleteLabel={t("notification.delete", "Hapus")}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-3 rounded-full border border-[#c7c1b5] bg-[#faf8ef]/70 py-1 pl-1 pr-3 shadow-sm transition hover:bg-[#faf8ef]"
                aria-label={t("patient.profile_menu", "Menu profile pasien")}
                onClick={() => setProfileMenuOpen((open) => !open)}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#86a197] text-sm font-bold text-white">
                  {initials}
                </span>
                <span className="hidden min-w-0 text-left sm:block">
                  <span className="block max-w-32 truncate text-sm font-bold text-[#2a3234]">{account?.name ?? data.patient.name}</span>
                  <span className="block max-w-32 truncate text-xs text-[#4a5657]">{account?.email ?? "Pasien"}</span>
                </span>
              </button>

              {profileMenuOpen && (
                <>
                  <button className="fixed inset-0 z-40 cursor-default" aria-label={t("patient.close_profile_menu", "Tutup menu profile")} onClick={() => setProfileMenuOpen(false)} />
                  <div className="soft-panel absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl animate-in">
                    <div className="border-b border-[#c7c1b5] bg-[#faf8ef]/80 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#86a197] font-bold text-white">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#2a3234]">{account?.name ?? data.patient.name}</p>
                          <p className="truncate text-xs text-[#4a5657]">{account?.email ?? "-"}</p>
                          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#5f7974]">{t("patient.role", "Pasien")}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <MenuButton
                        icon={UserRound}
                        label={t("patient.view_profile", "Lihat Profil")}
                        onClick={() => {
                          setActive("profile");
                          setProfileMenuOpen(false);
                        }}
                      />
                      <MenuButton
                        icon={Settings}
                        label={t("patient.account_settings", "Setting Akun")}
                        onClick={() => {
                          setSettingsOpen(true);
                          setProfileMenuOpen(false);
                        }}
                      />
                      <MenuButton
                        icon={ShieldCheck}
                        label={t("sidebar.logout", "Logout")}
                        onClick={() => {
                          setProfileMenuOpen(false);
                          handleLogout();
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-24 pt-24 md:px-6 md:pb-10">
        {active === "profile" && (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="soft-panel relative overflow-hidden rounded-2xl p-6 lg:col-span-8">
              <div className="absolute right-5 top-5">
                <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.05em] text-green-700">
                  <span className="h-2 w-2 rounded-full bg-[#86a197]" />
                  {t("patient.portal_active", "Portal aktif")}
                </span>
              </div>
              <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-[#c7c1b5] bg-[#d9d5c9] text-3xl font-bold text-[#86a197]">
                  {initials}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-xl font-semibold text-[#2a3234]">{data.patient.name}</h2>
                  {data.patient.medicalRecordNo && (
                    <p className="mt-1 text-sm text-[#4a5657]">{t("patient.medical_record_no", "No. RM")} {data.patient.medicalRecordNo}</p>
                  )}
                  <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
                    <Metric label={t("patient.metrics.visits", "Kunjungan")} value={String(data.visits.length)} />
                    <Metric label={t("patient.metrics.records", "Rekam Medis")} value={String(data.medicalRecords.length)} />
                    <Metric label={t("patient.metrics.prescriptions", "Resep")} value={String(data.prescriptions.length)} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 lg:col-span-4">
              <CompactInfo label="NIK" value={data.patient.nik ?? "-"} />
              <CompactInfo label={t("patient.phone", "Telepon")} value={data.patient.phone ?? "-"} />
              <CompactInfo label={t("patient.gender", "Jenis Kelamin")} value={genderLabel} />
              <CompactInfo label={t("patient.blood_type", "Gol. Darah")} value={data.patient.bloodType ?? "-"} />
            </div>
          </section>
        )}

        <section className={cn(active === "profile" ? "mt-8" : "mt-4")}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ActiveIcon className="h-5 w-5 text-[#5f7974]" />
              <h3 className="text-base font-semibold text-[#5f7974]">{activeTitle}</h3>
            </div>
            <div className="rounded-full bg-[#dfe9df] px-3 py-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#5f7974]">{nowLabel}</p>
            </div>
          </div>

          {active === "profile" && (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setSettingsOpen(true)}>
                  <Settings className="h-4 w-4" />
                  {t("patient.account_settings", "Setting Akun")}
                </Button>
                <Button type="button" variant="destructive" onClick={handleLogout}>
                  {t("sidebar.logout", "Logout")}
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DetailCard icon={BadgeCheck} label="NIK" value={data.patient.nik ?? "-"} />
                <DetailCard icon={UserRound} label={t("patient.gender", "Jenis Kelamin")} value={genderLabel} />
                <DetailCard icon={Stethoscope} label={t("patient.phone", "Telepon")} value={data.patient.phone ?? "-"} />
                <DetailCard icon={MapPin} label={t("patient.address", "Alamat")} value={data.patient.address ?? "-"} wide />
                <DetailCard icon={AlertTriangle} label={t("patient.allergy", "Alergi")} value={data.patient.allergyNotes ?? "-"} danger />
                <DetailCard icon={Droplets} label={t("patient.blood_type", "Gol. Darah")} value={data.patient.bloodType ?? "-"} />
              </div>
            </div>
          )}

          {active === "home" && <HomeContent announcements={announcements} data={data} />}
          {active === "visits" && <VisitList data={data} />}
          {active === "records" && <RecordList data={data} />}
          {active === "prescriptions" && <PrescriptionList data={data} />}
          {active === "payments" && <PaymentList data={data} />}
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="relative h-52 overflow-hidden rounded-2xl bg-[#86a197] p-8 text-white lg:col-span-2">
            <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] [background-size:24px_24px]" />
            <div className="relative z-10 max-w-lg">
              <h4 className="text-xl font-semibold">{t("patient.consult_title", "Punya Pertanyaan Medis?")}</h4>
              <p className="mt-2 text-sm text-white/85">{t("patient.consult_desc", "Hubungi klinik untuk konsultasi atau jadwal pemeriksaan lanjutan.")}</p>
              <Button className="mt-5 bg-white text-[#5f7974] hover:bg-[#e6efe5]">{t("patient.start_consult", "Mulai Konsultasi")}</Button>
            </div>
            <HeartPulse className="absolute right-10 top-1/2 hidden h-28 w-28 -translate-y-1/2 text-white/20 md:block" />
          </div>
          <div className="soft-panel rounded-2xl p-6 text-center">
            <CalendarDays className="mx-auto h-12 w-12 text-[#5f7974]" />
            <p className="mt-4 font-semibold">{t("patient.next_schedule", "Jadwal Selanjutnya")}</p>
            <p className="mt-1 text-sm text-[#4a5657]">{nextVisit ? `${nextVisit.polyclinic?.name ?? "Klinik"} - ${formatDateTime(nextVisit.visitDate)}` : t("patient.no_schedule", "Belum ada kunjungan terjadwal")}</p>
          </div>
        </section>
      </div>

      <PatientMinimalFooter brandName={cms.brandName} />

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-[#c7c1b5] bg-[#faf8ef]/90 py-2 shadow-[0_-10px_30px_rgba(48,55,50,.12)] backdrop-blur-xl md:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} type="button" onClick={() => setActive(tab.key)} className={cn("flex flex-col items-center gap-1 text-[#4a5657]", active === tab.key && "text-[#5f7974]")}>
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{t(`patient.tabs_short.${tab.key}`, tab.short)}</span>
            </button>
          );
        })}
      </nav>

      {settingsOpen && (
        <SettingsModal
          account={account}
          patientName={data.patient.name}
          patient={data.patient}
          patientPhone={data.patient.phone}
          initials={initials}
          profileMessage={profileMessage}
          passwordMessage={passwordMessage}
          error={settingsError}
          onClose={() => setSettingsOpen(false)}
          onProfileSubmit={handleProfileSubmit}
          onPasswordSubmit={handlePasswordSubmit}
        />
      )}
    </main>
  );
}

function PatientMinimalFooter({ brandName }: { brandName: string }) {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-[#2a3234] text-white">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-4 py-4 text-xs sm:flex-row sm:items-center sm:justify-between md:px-6">
        <div className="flex flex-wrap gap-5">
          <a href="/#contact" className="text-white/80 transition hover:text-white">{t("footer.privacy", "Privacy Policy")}</a>
          <a href="/patient-portal" className="text-white/80 transition hover:text-white">{t("footer.history", "Activity History")}</a>
          <a href="/#departments" className="text-white/80 transition hover:text-white">{t("footer.what_we_do", "Clinic Info")}</a>
        </div>
        <p className="text-white/80">&copy; {year} {brandName}. {t("footer.copyright", "All rights reserved.")}</p>
      </div>
    </footer>
  );
}

function MenuButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-[#faf8ef]">
      <Icon className="h-4 w-4 text-[#5f7974]" />
      {label}
    </button>
  );
}

function HomeContent({ announcements, data }: { announcements: AnnouncementItem[]; data: PatientPortalData }) {
  const { t } = useLanguage();

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <PatientWelcomeCard gender={data.patient?.gender} />

        {announcements.length === 0 ? (
          <div className="soft-panel rounded-2xl border-dashed p-8 text-center text-sm text-[#6a746f]">
            {t("patient.no_announcements", "Belum ada informasi atau edukasi terbaru dari klinik.")}
          </div>
        ) : (
          announcements.map((item) => (
            <AnnouncementCard
              key={item.id}
              item={item}
              dateLabel={formatDateTime(item.createdAt)}
              authorLabel={item.author?.name ?? "Klinik"}
              compact
            />
          ))
        )}
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-[#c7c1b5] bg-white p-5">
          <p className="text-sm font-semibold text-[#2a3234]">{t("patient.your_summary", "Ringkasan Anda")}</p>
          <div className="mt-4 grid gap-3">
            <Metric label={t("patient.metrics.visits", "Kunjungan")} value={String(data.visits.length)} />
            <Metric label={t("patient.metrics.records", "Rekam Medis")} value={String(data.medicalRecords.length)} />
            <Metric label={t("patient.metrics.prescriptions", "Resep")} value={String(data.prescriptions.length)} />
            <Metric label="Transaksi" value={String(data.payments.filter((payment) => payment.status === "paid" && !payment.isDraft).length)} />
          </div>
        </div>
      </aside>
    </div>
  );
}

function PatientWelcomeCard({ gender }: { gender?: "MALE" | "FEMALE" }) {
  const { t } = useLanguage();
  const isFemale = gender === "FEMALE";

  return (
    <section className="soft-panel relative overflow-hidden rounded-2xl bg-white p-0">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(230,239,229,.96),rgba(250,248,239,.84)_48%,rgba(215,210,235,.35))]" />
      <div className="relative flex min-h-[150px] items-center gap-5 px-5 py-4 sm:px-7">
        <div className="hidden h-36 w-36 shrink-0 items-end justify-center sm:flex">
          <PatientIllustration female={isFemale} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5f7974] shadow-sm ring-1 ring-[#c7c1b5]/70">
            <Megaphone className="h-3.5 w-3.5" />
            Portal Pasien
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#2a3234] md:text-3xl">
            {t("patient.home_welcome", "Selamat datang di Portal Pasien")}
          </h2>
        </div>
        <div className="flex h-24 w-24 shrink-0 items-end justify-center sm:hidden">
          <PatientIllustration female={isFemale} compact />
        </div>
      </div>
    </section>
  );
}

function PatientIllustration({ female, compact }: { female: boolean; compact?: boolean }) {
  const sizeClass = compact ? "h-24 w-24" : "h-36 w-36";
  const hair = female ? "#243c3a" : "#31413e";
  const shirt = female ? "#86a197" : "#5f7974";

  return (
    <svg className={sizeClass} viewBox="0 0 160 160" role="img" aria-label={female ? "Ilustrasi pasien perempuan" : "Ilustrasi pasien laki-laki"}>
      <circle cx="80" cy="84" r="70" fill="#eef4ec" />
      <path d="M38 146c5-34 24-52 43-52s38 18 43 52H38Z" fill={shirt} />
      <path d="M58 102c9 12 34 12 44 0l-4 22c-8 10-28 10-36 0l-4-22Z" fill="#f0c9a9" />
      <circle cx="80" cy="66" r="31" fill="#f4d4b7" />
      {female ? (
        <>
          <path d="M47 80c-3-31 10-53 33-54 25-1 39 22 34 55-4-12-11-18-20-23-13-7-28-8-47 22Z" fill={hair} />
          <path d="M49 75c-13 18-8 46 4 63 1-24 8-42 20-55L49 75Z" fill={hair} />
        </>
      ) : (
        <path d="M49 59c4-25 25-36 48-25 11 5 17 14 16 27-18-11-39-10-64-2Z" fill={hair} />
      )}
      <circle cx="68" cy="69" r="3" fill="#243c3a" />
      <circle cx="92" cy="69" r="3" fill="#243c3a" />
      <path d="M70 84c7 6 15 6 22 0" fill="none" stroke="#9a6d54" strokeWidth="3" strokeLinecap="round" />
      <path d="M53 122c8 12 18 18 31 18s23-6 31-18" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity=".7" />
      <circle cx="49" cy="122" r="7" fill="#f6f3e8" />
      <circle cx="111" cy="122" r="7" fill="#f6f3e8" />
      <path d="M112 61c14 6 20 16 22 31" fill="none" stroke={shirt} strokeWidth="7" strokeLinecap="round" />
      <circle cx="136" cy="92" r="5" fill="#5f7974" />
    </svg>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="soft-panel min-w-[100px] rounded-xl p-4 text-center">
      <p className="text-xl font-bold text-[#5f7974]">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#4a5657]">{label}</p>
    </div>
  );
}

function CompactInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="soft-panel rounded-xl p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#4a5657]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[#2a3234]">{value}</p>
    </div>
  );
}

function DetailCard({ icon: Icon, label, value, wide, danger }: { icon: LucideIcon; label: string; value: string; wide?: boolean; danger?: boolean }) {
  return (
    <div className={cn("flex items-center gap-5 rounded-xl border p-6 transition hover:-translate-y-1", danger ? "border-red-200 bg-red-50" : "soft-panel hover:border-[#5f7974]", wide && "md:row-span-2")}>
      <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full", danger ? "bg-red-100 text-red-700" : "bg-[#e6efe5] text-[#5f7974]")}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className={cn("text-[11px] font-bold uppercase tracking-[0.05em]", danger ? "text-red-700" : "text-[#4a5657]")}>{label}</p>
        <p className="mt-1 break-words text-lg font-semibold text-[#2a3234]">{value}</p>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="soft-panel flex min-h-64 items-center justify-center rounded-xl border-dashed p-8 text-center">
      <p className="max-w-sm text-sm leading-6 text-[#4a5657]">{text}</p>
    </div>
  );
}

function VisitList({ data }: { data: PatientPortalData }) {
  const { t } = useLanguage();

  if (data.visits.length === 0) return <Empty text={t("patient.empty_visits", "Belum ada kunjungan.")} />;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {data.visits.map((visit) => (
        <div key={visit.id} className="soft-panel rounded-xl p-5 transition hover:-translate-y-1 hover:border-[#5f7974]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{visit.visitNo}</p>
              <p className="mt-1 text-sm text-[#4a5657]">{visit.polyclinic?.name ?? "-"}</p>
              <p className="mt-3 text-sm">{visit.complaint ?? t("patient.no_complaint", "Tanpa keluhan")}</p>
              <p className="mt-3 text-xs text-[#7a827e]">{formatDateTime(visit.visitDate)}</p>
            </div>
            <Badge variant="secondary">{visit.status}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecordList({ data }: { data: PatientPortalData }) {
  const { t } = useLanguage();

  if (data.medicalRecords.length === 0) return <Empty text={t("patient.empty_records", "Belum ada rekam medis.")} />;
  return (
    <div className="space-y-4">
      {data.medicalRecords.map((record) => (
        <div key={record.id} className="soft-panel rounded-xl p-5 transition hover:-translate-y-1 hover:border-[#5f7974]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{record.diagnosis}</p>
              <p className="text-sm text-[#4a5657]">{t("patient.doctor", "Dokter")}: {record.doctor?.user?.name ?? "-"}</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-[#7a827e]">{formatDateTime(record.createdAt)}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => printPatientRecord(data.patient, record)}>
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          </div>
          <p className="mt-3 text-sm">{record.treatment ?? t("patient.no_treatment_notes", "Tidak ada catatan tindakan.")}</p>
        </div>
      ))}
    </div>
  );
}

function PrescriptionList({ data }: { data: PatientPortalData }) {
  const { t } = useLanguage();

  if (data.prescriptions.length === 0) return <Empty text={t("patient.empty_prescriptions", "Belum ada resep.")} />;
  return (
    <div className="space-y-4">
      {data.prescriptions.map((prescription) => (
        <div key={prescription.id} className="soft-panel rounded-xl p-5 transition hover:-translate-y-1 hover:border-[#5f7974]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="secondary">{prescription.status}</Badge>
            <div className="flex items-center gap-2">
              <p className="text-xs text-[#7a827e]">{formatDateTime(prescription.createdAt)}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => printPatientPrescription(data.patient?.name ?? "-", data.patient?.medicalRecordNo, prescription)}>
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {prescription.items.map((item) => (
              <div key={`${prescription.id}-${item.medicine.name}`} className="rounded-lg bg-[#faf8ef] p-3 text-sm">
                <p className="font-semibold">{item.medicine.name} ({item.quantity} {item.medicine.unit})</p>
                <p className="text-[#4a5657]">{item.dosage} - {item.instruction ?? "-"}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PaymentList({ data }: { data: PatientPortalData }) {
  const { t } = useLanguage();
  const paidPayments = data.payments.filter((payment) => payment.status === "paid" && !payment.isDraft);

  if (paidPayments.length === 0) return <Empty text={t("patient.empty_payments", "Belum ada histori pembayaran lunas.")} />;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {paidPayments.map((payment) => (
        <div key={payment.id} className="soft-panel rounded-xl p-5 transition hover:-translate-y-1 hover:border-[#5f7974]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.05em] text-[#7a827e]">{t("patient.payment_proof", "Bukti Pembayaran")}</p>
              <p className="mt-1 font-mono text-lg font-semibold text-[#5f7974]">{payment.invoiceNo}</p>
              <p className="mt-1 text-xs text-[#7a827e]">{formatDateTime(payment.createdAt)}</p>
            </div>
            <Badge variant="success">LUNAS</Badge>
          </div>
          <div className="mt-4 grid gap-2 rounded-xl bg-[#faf8ef] p-4 text-sm">
            {payment.details?.length ? (
              <div className="mb-2 space-y-2 border-b border-[#c7c1b5] pb-2">
                {payment.details.map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 text-xs">
                    <span className="text-[#4a5657]">{item.itemName} x{item.quantity}</span>
                    <span className="font-semibold">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="flex justify-between gap-3">
              <span className="text-[#4a5657]">{t("patient.total_bill", "Total tagihan")}</span>
              <span className="font-semibold">{formatCurrency(payment.total)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[#4a5657]">{t("patient.paid_amount", "Sudah dibayar")}</span>
              <span className="font-semibold">{formatCurrency(payment.paidAmount)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[#4a5657]">Metode</span>
              <span className="font-semibold">{payment.paymentMethod ?? "-"}</span>
            </div>
            <div className="flex justify-between gap-3 border-t border-[#c7c1b5] pt-2">
              <span className="text-[#4a5657]">Status</span>
              <span className="font-bold text-[#5f7974]">Pembayaran diterima</span>
            </div>
          </div>
          <Button type="button" variant="outline" className="mt-3 w-full" onClick={() => printPatientInvoice(data.patient?.name ?? "-", data.patient?.medicalRecordNo, payment)}>
            <Printer className="h-4 w-4" />
            Print Bukti Pembayaran
          </Button>
        </div>
      ))}
    </div>
  );
}

function printPatientRecord(patient: PatientPortalData["patient"], record: PatientPortalData["medicalRecords"][number]) {
  const noRm = patient?.medicalRecordNo ?? "";
  const noRmBoxes = Array.from({ length: Math.max(6, noRm.length || 6) }).map((_, index) => `
    <span class="rm-box">${escapeHtml(noRm[index] ?? "")}</span>
  `).join("");

  printDocument("Rekam Medis Pasien", `
    <style>
      @page { size: A4 portrait; margin: 12mm; }
      body { color: #222; }
      .record-sheet { position: relative; width: 186mm; min-height: 273mm; box-sizing: border-box; border: 1.5px solid #222; padding: 12mm; overflow: hidden; background: #fff; }
      .record-sheet::before {
        content: "";
        position: absolute;
        inset: 120px 60px 120px 60px;
        background: linear-gradient(135deg, transparent 0 28%, rgba(199, 193, 181, 0.20) 28% 50%, transparent 50% 100%);
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
      .meta { margin-top: 10px; display: flex; justify-content: space-between; gap: 16px; font-size: 11px; color: #555; }
      @media print {
        body { margin: 0; }
        .record-sheet { width: 186mm; min-height: 273mm; border-color: #222; page-break-after: always; }
      }
    </style>
    <div class="record-sheet">
      <div class="watermark">Klinik Utama</div>
      <div class="sheet-content">
        <div class="rm-row">
          <span>No.RM</span>
          <span>${noRmBoxes}</span>
        </div>
        <div class="title">KARTU REKAM MEDIK</div>
        <div class="identity">
          <div class="identity-row"><span>Nama Pasien</span><span>:</span><div class="dotline">${escapeHtml(patient?.name)}</div></div>
          <div class="identity-row"><span>Umur/Jenis Kelamin</span><span>:</span><div class="dotline">${escapeHtml(`${patient?.gender === "FEMALE" ? "Perempuan" : "Laki-laki"} | Lahir ${formatDate(patient?.birthDate)}`)}</div></div>
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
              <td>${escapeHtml(formatDateTime(record.createdAt))}</td>
              <td>${escapeHtml(record.anamnesis ?? record.notes ?? "-")}</td>
              <td>${escapeHtml(record.diagnosis)}</td>
              <td>${escapeHtml(record.treatment ?? "-")}</td>
            </tr>
          </tbody>
        </table>
        <div class="meta">
          <span>Dokter: ${escapeHtml(record.doctor?.user?.name)}</span>
          <span>Dicetak: ${escapeHtml(new Date().toLocaleString("id-ID"))}</span>
        </div>
      </div>
    </div>
  `);
}

function printPatientPrescription(patientName: string, medicalRecordNo: string | null | undefined, prescription: PatientPortalData["prescriptions"][number]) {
  printDocument("Resep Pasien", `
    <div class="header">
      <div>
        <h1>Resep Pasien</h1>
        <p class="muted">Portal pasien - dokumen pribadi</p>
      </div>
      <div class="muted">${escapeHtml(formatDateTime(prescription.createdAt))}</div>
    </div>
    <div class="grid">
      <div class="box"><strong>Pasien</strong><br />${escapeHtml(patientName)}</div>
      ${medicalRecordNo ? `<div class="box"><strong>No. RM</strong><br />${escapeHtml(medicalRecordNo)}</div>` : ""}
      <div class="box"><strong>Status</strong><br />${escapeHtml(prescription.status)}</div>
    </div>
    <h2>Daftar Obat</h2>
    <table>
      <thead><tr><th>Obat</th><th>Jumlah</th><th>Dosis</th><th>Instruksi</th></tr></thead>
      <tbody>
        ${prescription.items.map((item) => `
          <tr>
            <td>${escapeHtml(item.medicine.name)}</td>
            <td>${escapeHtml(`${item.quantity} ${item.medicine.unit}`)}</td>
            <td>${escapeHtml(item.dosage)}</td>
            <td>${escapeHtml(item.instruction)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `);
}

function printPatientInvoice(patientName: string, medicalRecordNo: string | null | undefined, payment: PatientPortalData["payments"][number]) {
  const details = payment.details ?? [];
  printDocument("Invoice Pasien", `
    <div class="header">
      <div>
        <h1>Invoice Pasien</h1>
        <p class="muted">${payment.isDraft ? "Estimasi invoice kunjungan siap bayar" : "Invoice resmi pembayaran klinik"}</p>
      </div>
      <div class="muted">${escapeHtml(formatDateTime(payment.createdAt))}</div>
    </div>
    <div class="grid">
      <div class="box"><strong>Invoice</strong><br />${escapeHtml(payment.invoiceNo)}</div>
      <div class="box"><strong>Status</strong><br />${escapeHtml(payment.status)}</div>
      <div class="box"><strong>Pasien</strong><br />${escapeHtml(patientName)}</div>
      ${medicalRecordNo ? `<div class="box"><strong>No. RM</strong><br />${escapeHtml(medicalRecordNo)}</div>` : ""}
    </div>
    <h2>Rincian Tagihan</h2>
    <table>
      <thead><tr><th>Item</th><th>Jumlah</th><th>Harga</th><th>Total</th></tr></thead>
      <tbody>
        ${details.map((item) => `
          <tr>
            <td>${escapeHtml(item.itemName)}</td>
            <td>${escapeHtml(item.quantity)}</td>
            <td>${escapeHtml(formatCurrency(item.price))}</td>
            <td>${escapeHtml(formatCurrency(item.total))}</td>
          </tr>
        `).join("") || `<tr><td colspan="4">Detail invoice belum tersedia.</td></tr>`}
      </tbody>
    </table>
    <h2>Ringkasan</h2>
    <div class="box">
      <p><strong>Total:</strong> ${escapeHtml(formatCurrency(payment.total))}</p>
      <p><strong>Sudah dibayar:</strong> ${escapeHtml(formatCurrency(payment.paidAmount))}</p>
      <p><strong>Sisa:</strong> ${escapeHtml(formatCurrency(Number(payment.total) - Number(payment.paidAmount)))}</p>
    </div>
  `);
}

function SettingsModal({
  account,
  patientName,
  patient,
  patientPhone,
  initials,
  profileMessage,
  passwordMessage,
  error,
  onClose,
  onProfileSubmit,
  onPasswordSubmit
}: {
  account: (UserSession & { phone?: string }) | null;
  patientName: string;
  patient: NonNullable<PatientPortalData["patient"]>;
  patientPhone?: string;
  initials: string;
  profileMessage: string | null;
  passwordMessage: string | null;
  error: string | null;
  onClose: () => void;
  onProfileSubmit: (formData: FormData) => void;
  onPasswordSubmit: (formData: FormData) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#2a3234]/55 p-4 backdrop-blur-md">
      <section className="soft-panel max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl p-4 text-[#2a3234] md:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e6efe5] text-[#5f7974]">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{t("patient.account_settings", "Setting Akun")}</h2>
              <p className="text-sm text-[#4a5657]">{t("patient.settings_desc", "Kelola profil dan keamanan akun pasien.")}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={t("patient.close_settings", "Tutup setting")}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-5 rounded-xl bg-[#86a197] p-4 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 text-lg font-semibold ring-1 ring-white/30">{initials}</div>
              <div>
                <p className="font-semibold">{account?.name ?? patientName}</p>
                <p className="text-sm text-white/80">{account?.email ?? t("patient.account", "Akun pasien")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm ring-1 ring-white/25">
              <ShieldCheck className="h-4 w-4" />
              PATIENT
            </div>
          </div>
        </div>

        {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="grid gap-4 lg:grid-cols-2">
          <form action={onProfileSubmit} className="rounded-xl border border-[#c7c1b5] bg-[#faf8ef]/78 p-4 shadow-inner lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <UserRound className="h-5 w-5 text-[#5f7974]" />
              <h3 className="font-semibold">{t("patient.account_profile", "Profil Akun")}</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input name="name" defaultValue={account?.name ?? patientName} placeholder={t("patient.full_name", "Nama lengkap")} required />
              <Input name="email" type="email" defaultValue={account?.email ?? ""} placeholder={t("patient.login_email", "Email login")} required />
              <Input name="nik" defaultValue={patient.nik ?? ""} placeholder="NIK" required />
              <DateChooser name="birthDate" defaultValue={dateInputValue(patient.birthDate)} max={new Date().toISOString().slice(0, 10)} placeholder="Tanggal lahir" required />
              <SelectChooser
                name="gender"
                defaultValue={patient.gender}
                required
                options={[
                  { value: "MALE", label: "Laki-laki" },
                  { value: "FEMALE", label: "Perempuan" }
                ]}
              />
              <SelectChooser
                name="bloodType"
                defaultValue={patient.bloodType ?? ""}
                options={[
                  { value: "", label: "Gol. darah tidak diketahui" },
                  { value: "A", label: "A" },
                  { value: "B", label: "B" },
                  { value: "AB", label: "AB" },
                  { value: "O", label: "O" }
                ]}
              />
              <Input name="phone" defaultValue={account?.phone ?? patientPhone ?? ""} placeholder={t("patient.phone_number", "Nomor telepon")} />
              <Input name="allergyNotes" defaultValue={patient.allergyNotes ?? ""} placeholder={t("patient.allergy", "Alergi")} />
              <textarea name="address" defaultValue={patient.address ?? ""} placeholder={t("patient.address", "Alamat")} className="min-h-24 rounded-lg border border-[#c7c1b5] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#86a197]/25 md:col-span-2" required />
              <div className="md:col-span-2">
                {profileMessage && <p className="mb-3 text-sm text-[#5f7974]">{profileMessage}</p>}
                <Button type="submit" className="w-full">{t("patient.save_profile", "Simpan Profil")}</Button>
              </div>
            </div>
          </form>

          <form action={onPasswordSubmit} className="rounded-xl border border-[#c7c1b5] bg-[#faf8ef]/78 p-4 shadow-inner">
            <div className="mb-4 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-[#5f7974]" />
              <h3 className="font-semibold">{t("patient.change_password", "Ganti Password")}</h3>
            </div>
            <div className="space-y-3">
              <Input name="currentPassword" type="password" placeholder={t("patient.current_password", "Password lama")} required />
              <Input name="newPassword" type="password" placeholder={t("patient.new_password", "Password baru")} required />
              <Input name="confirmPassword" type="password" placeholder={t("patient.confirm_new_password", "Konfirmasi password baru")} required />
              {passwordMessage && <p className="text-sm text-[#5f7974]">{passwordMessage}</p>}
              <Button type="submit" variant="outline" className="w-full">{t("patient.change_password", "Ganti Password")}</Button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}



