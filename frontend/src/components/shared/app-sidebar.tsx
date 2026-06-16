"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Activity, BadgeDollarSign, Bell, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, FileBarChart, FlaskConical, Gauge, HardDrive, HeartPulse, LayoutDashboard, ListOrdered, LockKeyhole, LogOut, Logs, Megaphone, Pill, Search, Settings, Stethoscope, UserCog, UsersRound, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { useAuthStore } from "@/store/auth-store";
import type { RoleName } from "@/types/api";
import { logout } from "@/services/auth-service";
import { useSiteCms } from "@/hooks/use-site-cms";

type SidebarItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  roles: RoleName[];
};

type SidebarGroup = {
  title: string;
  items: SidebarItem[];
};

const ADMIN_ROLES: RoleName[] = ["ADMIN"];
const OPERATIONAL_ROLES: RoleName[] = ["RECEPTIONIST", "NURSE", "DOCTOR", "PHARMACY", "CASHIER"];
const STAFF_ROLES: RoleName[] = [...ADMIN_ROLES, ...OPERATIONAL_ROLES];

const sidebarGroups: SidebarGroup[] = [
  {
    title: "Utama",
    items: [
      { href: "/dashboard", labelKey: "sidebar.dashboard", icon: LayoutDashboard, roles: STAFF_ROLES },
      { href: "/patient-portal", labelKey: "sidebar.patient_portal", icon: HeartPulse, roles: ["PATIENT"] },
      { href: "/notifications", labelKey: "sidebar.notifications", icon: Bell, roles: STAFF_ROLES },
      { href: "/announcements", labelKey: "sidebar.announcements", icon: Megaphone, roles: STAFF_ROLES }
    ]
  },
  {
    title: "Front Office",
    items: [
      { href: "/patients", labelKey: "sidebar.patients", icon: UsersRound, roles: OPERATIONAL_ROLES },
      { href: "/visits", labelKey: "sidebar.visits", icon: ClipboardList, roles: OPERATIONAL_ROLES },
      { href: "/queues", labelKey: "sidebar.queues", icon: ListOrdered, roles: OPERATIONAL_ROLES }
    ]
  },
  {
    title: "Klinis",
    items: [
      { href: "/vital-signs", labelKey: "sidebar.vital_signs", icon: Activity, roles: OPERATIONAL_ROLES },
      { href: "/medical-records", labelKey: "sidebar.medical_records", icon: Stethoscope, roles: OPERATIONAL_ROLES },
      { href: "/prescriptions", labelKey: "sidebar.prescriptions", icon: Pill, roles: OPERATIONAL_ROLES }
    ]
  },
  {
    title: "Farmasi & Kasir",
    items: [
      { href: "/medicines", labelKey: "sidebar.medicines", icon: Pill, roles: OPERATIONAL_ROLES },
      { href: "/payments", labelKey: "sidebar.payments", icon: BadgeDollarSign, roles: OPERATIONAL_ROLES }
    ]
  },
  {
    title: "Admin Sistem",
    items: [
      { href: "/users", labelKey: "sidebar.users", icon: UserCog, roles: ADMIN_ROLES },
      { href: "/doctors", labelKey: "sidebar.doctors", icon: Stethoscope, roles: ADMIN_ROLES },
      { href: "/polyclinics", labelKey: "sidebar.polyclinics", icon: FlaskConical, roles: ADMIN_ROLES },
      { href: "/backup", labelKey: "sidebar.backup", icon: HardDrive, roles: ADMIN_ROLES },
      { href: "/monitoring", labelKey: "sidebar.monitoring", icon: Gauge, roles: ADMIN_ROLES },
      { href: "/reports", labelKey: "sidebar.reports", icon: FileBarChart, roles: ADMIN_ROLES },
      { href: "/security", labelKey: "sidebar.security", icon: LockKeyhole, roles: ADMIN_ROLES },
      { href: "/audit-logs", labelKey: "sidebar.audit_logs", icon: Logs, roles: ADMIN_ROLES },
      { href: "/settings", labelKey: "sidebar.settings", icon: Settings, roles: ADMIN_ROLES }
    ]
  }
];

export function AppSidebar() {
  const pathname = usePathname();
  const role = useAuthStore((state) => state.user?.role);
  const user = useAuthStore((state) => state.user);
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const visibleGroups = getVisibleSidebarGroups(role);

  return (
    <aside
      className={cn(
        "hidden h-dvh shrink-0 overflow-visible border-r border-[#c7c1b5]/70 bg-[#eef1e8]/80 shadow-[0_18px_38px_rgba(46,57,57,.10)] backdrop-blur-xl transition-[width] duration-300 ease-out md:sticky md:top-0 md:flex md:flex-col",
        collapsed ? "w-[86px]" : "w-72"
      )}
    >
      <div className="relative flex min-h-0 flex-1 flex-col overflow-visible">
        <BrandHeader collapsed={collapsed} t={t} />
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="absolute right-0 top-8 z-40 flex h-10 w-6 items-center justify-center rounded-l-xl border-y border-l border-[#d9d5c9] bg-white/95 text-[#7a827e] shadow-md shadow-stone-900/10 transition hover:bg-white hover:text-[#5f7974] hover:shadow-lg"
          aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        <SidebarSearch collapsed={collapsed} />
        <SidebarNav groups={visibleGroups} pathname={pathname} t={t} collapsed={collapsed} />
        <SidebarProfile name={user?.name ?? "Guest"} email={user?.email ?? "-"} role={user?.role ?? "Clinic User"} t={t} collapsed={collapsed} />
      </div>
    </aside>
  );
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const role = useAuthStore((state) => state.user?.role);
  const user = useAuthStore((state) => state.user);
  const { t } = useLanguage();
  const visibleGroups = getVisibleSidebarGroups(role);

  return (
    <div className={cn("fixed inset-0 z-50 md:hidden", open ? "pointer-events-auto" : "pointer-events-none")}>
      <div
        className={cn(
          "absolute inset-0 bg-stone-950/45 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "absolute inset-y-0 left-0 flex h-dvh w-[84vw] max-w-80 flex-col overflow-hidden border-r border-[#c7c1b5]/70 bg-[#eef1e8]/95 shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-20 items-center justify-between border-b border-[#c7c1b5] px-5">
          <BrandMark compact t={t} />
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md border bg-white text-muted-foreground transition hover:rotate-90 hover:bg-muted hover:text-foreground"
            aria-label={t("sidebar.close_menu")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <SidebarSearch collapsed={false} />
        <SidebarNav groups={visibleGroups} pathname={pathname} onNavigate={onClose} t={t} collapsed={false} />
        <SidebarProfile name={user?.name ?? "Guest"} email={user?.email ?? "-"} role={user?.role ?? "Clinic User"} t={t} collapsed={false} />
      </aside>
    </div>
  );
}

function getVisibleSidebarGroups(role?: RoleName) {
  return sidebarGroups
    .map((group) => ({
      ...group,
      items: role ? group.items.filter((item) => item.roles.includes(role)) : group.items.filter((item) => item.href === "/dashboard")
    }))
    .filter((group) => group.items.length > 0);
}

function BrandHeader({ collapsed, t }: { collapsed: boolean; t: (key: string) => string }) {
  return (
    <div className={cn("flex h-24 shrink-0 items-center border-b border-[#d9d5c9] px-4 transition-all duration-300", collapsed && "px-3")}>
      <div
        className={cn(
          "relative flex w-full items-center transition-all duration-300",
          collapsed && "justify-center"
        )}
      >
        <BrandMark collapsed={collapsed} t={t} />
      </div>
    </div>
  );
}

function BrandMark({ compact = false, collapsed = false, t }: { compact?: boolean; collapsed?: boolean; t: (key: string) => string }) {
  const brand = useSiteCms();

  return (
    <div className={cn("flex min-w-0 items-center gap-3 transition-all duration-300", collapsed && "justify-center")}>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:scale-105">
        <Image src={brand.logoImageUrl} alt={`${brand.brandName} logo`} width={44} height={44} className="h-11 w-11 object-contain" />
      </div>
      <div className={cn("min-w-0 transition-all duration-200", collapsed ? "w-0 translate-x-2 overflow-hidden opacity-0" : "w-44 opacity-100")}>
        <p className="truncate text-base font-bold text-[#5f7974]">{brand.brandName}</p>
        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6a746f]">{brand.brandSubtitle}</p>
      </div>
    </div>
  );
}

function SidebarSearch({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn("shrink-0 px-4 pt-4 transition-all duration-300", collapsed && "px-3")}>
      <div
        className={cn(
          "group flex h-11 items-center gap-2 rounded-xl border border-[#d9d5c9] bg-white/75 px-3 text-[#6a746f] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#9aa9a2] hover:bg-white hover:shadow-md hover:shadow-stone-900/10",
          collapsed && "justify-center px-0"
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-[#5f7974] transition-transform duration-200 group-hover:scale-110" />
        <input
          aria-label="Cari menu"
          placeholder="Cari menu..."
          className={cn(
            "min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-[#7a827e] focus:ring-0",
            collapsed && "hidden"
          )}
        />
      </div>
    </div>
  );
}

function SidebarNav({ groups, pathname, onNavigate, t, collapsed }: { groups: SidebarGroup[]; pathname: string; onNavigate?: () => void; t: (key: string) => string; collapsed: boolean }) {
  let itemIndex = 0;

  return (
    <nav className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", collapsed ? "px-3" : "px-3")}>
      <div className="space-y-5">
        {groups.map((group) => (
          <section key={group.title} className="space-y-1.5">
            <div className={cn("px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7a827e] transition-all duration-200", collapsed && "px-0 text-center text-[9px] tracking-normal")}>
              {group.title}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                const delay = itemIndex++ * 24;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    style={{ animationDelay: `${delay}ms` }}
                    title={collapsed ? t(item.labelKey) : undefined}
                    className={cn(
                      "sidebar-item group relative flex min-h-10 items-center gap-3 rounded-xl text-sm font-medium text-[#4a5657] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#dfe9df] hover:text-[#2a3234] hover:shadow-md hover:shadow-stone-900/10",
                      collapsed ? "justify-center px-0 py-2.5" : "px-4 py-2.5",
                      active && "bg-[#86a197] font-semibold text-white shadow-md shadow-stone-900/10 hover:bg-[#86a197] hover:text-white"
                    )}
                  >
                    <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200 group-hover:scale-110", active ? "bg-white/20 text-white" : "bg-white/55 text-[#5f7974] group-hover:bg-white")}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className={cn("truncate transition-all duration-200", collapsed ? "w-0 translate-x-2 overflow-hidden opacity-0" : "w-auto opacity-100")}>{t(item.labelKey)}</span>
                    {collapsed && (
                      <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-30 -translate-y-1/2 rounded-lg bg-[#3f4a49] px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-xl transition group-hover:opacity-100">
                        {t(item.labelKey)}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </nav>
  );
}

function SidebarProfile({ name, email, role, t, collapsed }: { name: string; email: string; role: string; t: (key: string) => string; collapsed: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const clearSession = useAuthStore((state) => state.clearSession);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

  async function handleLogout() {
    try {
      await logout();
    } finally {
      clearSession();
      router.push("/login");
    }
  }

  return (
    <div className={cn("m-3 shrink-0 rounded-xl border border-[#c7c1b5] bg-[#e6efe5] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#9aa9a2] hover:bg-[#dfe9df] hover:shadow-md hover:shadow-stone-900/10", collapsed ? "p-2" : "p-3")}>
      <button type="button" onClick={() => setOpen((value) => !value)} className={cn("group flex w-full items-center rounded-lg text-left transition", collapsed ? "justify-center p-1" : "gap-3 p-1")} aria-expanded={open}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#c7c1b5] bg-white text-sm font-bold text-[#5f7974] transition-all duration-200 group-hover:scale-105 group-hover:border-[#9aa9a2]">
          {initials}
        </div>
        <div className={cn("min-w-0 flex-1 transition-all duration-200", collapsed && "w-0 overflow-hidden opacity-0")}>
          <p className="truncate text-sm font-bold text-[#2a3234]">{name}</p>
          <p className="truncate text-xs text-[#6a746f]">{email}</p>
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.04em] text-[#5f7974]">{role}</p>
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-[#6a746f] transition-transform duration-200 group-hover:text-[#5f7974]", open && "rotate-180", collapsed && "hidden")} />
      </button>
      {open && (
        <div className={cn("mt-3 grid gap-2 animate-in", collapsed && "absolute bottom-4 left-[calc(100%+10px)] z-40 w-44 rounded-xl border border-[#c7c1b5] bg-white p-2 shadow-2xl")}>
          <button type="button" onClick={() => router.push("/profile")} className="flex items-center gap-2 rounded-lg border border-[#c7c1b5] bg-white px-3 py-2 text-xs font-semibold text-[#5f7974] transition hover:bg-[#faf8ef]">
            <Settings className="h-3.5 w-3.5" />
            {t("sidebar.profile")}
          </button>
          <button type="button" onClick={handleLogout} className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50">
            <LogOut className="h-3.5 w-3.5" />
            {t("sidebar.logout")}
          </button>
        </div>
      )}
    </div>
  );
}




