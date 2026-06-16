"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { Topbar } from "@/components/shared/topbar";
import { getMe, refreshSession } from "@/services/auth-service";
import { useAuthStore } from "@/store/auth-store";

const ADMIN_ALLOWED_ROUTES = ["/dashboard", "/settings", "/announcements", "/notifications", "/users", "/register", "/doctors", "/polyclinics", "/backup", "/monitoring", "/reports", "/security", "/audit-logs", "/profile"];
const OPERATIONAL_BLOCKED_ROUTES = ["/settings", "/users", "/register", "/backup", "/monitoring", "/reports", "/security", "/audit-logs"];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const role = useAuthStore((state) => state.user?.role);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const pathname = usePathname();
  const router = useRouter();
  const [authReady, setAuthReady] = useState(Boolean(accessToken && role));
  const isPatientPortal = role === "PATIENT" && pathname === "/patient-portal";
  const isBlockedPatientRoute = role === "PATIENT" && pathname !== "/patient-portal" && pathname !== "/profile";
  const isBlockedAdminRoute = role === "ADMIN" && !ADMIN_ALLOWED_ROUTES.includes(pathname);
  const isBlockedOperationalRoute = Boolean(role && role !== "ADMIN" && role !== "PATIENT" && OPERATIONAL_BLOCKED_ROUTES.includes(pathname));

  useEffect(() => {
    let mounted = true;

    async function bootstrapSession() {
      if (accessToken && role) {
        setAuthReady(true);
        return;
      }

      try {
        const refreshed = await refreshSession();
        const me = await getMe();
        if (!mounted) return;
        setSession(me, refreshed.accessToken);
        setAuthReady(true);
      } catch {
        if (!mounted) return;
        clearSession();
        setAuthReady(true);
        router.replace("/login");
      }
    }

    void bootstrapSession();

    return () => {
      mounted = false;
    };
  }, [accessToken, clearSession, role, router, setSession]);

  useEffect(() => {
    if (!authReady || !role) return;
    if (isBlockedPatientRoute) {
      router.replace("/patient-portal");
      return;
    }
    if (isBlockedAdminRoute || isBlockedOperationalRoute) {
      router.replace("/dashboard");
    }
  }, [authReady, isBlockedAdminRoute, isBlockedOperationalRoute, isBlockedPatientRoute, role, router]);

  if (!authReady || !role) {
    return (
      <div className="theme-surface flex min-h-screen items-center justify-center p-4 text-[#2a3234]">
        <div className="soft-panel rounded-2xl p-6 text-sm">
          Menyiapkan sesi akun...
        </div>
      </div>
    );
  }

  if (isPatientPortal) {
    return <div className="theme-surface min-h-screen">{children}</div>;
  }

  if (isBlockedPatientRoute) {
    return (
      <div className="theme-surface flex min-h-screen items-center justify-center p-4 text-[#2a3234]">
        <div className="soft-panel rounded-2xl p-6 text-sm">
          Mengalihkan ke portal pasien...
        </div>
      </div>
    );
  }

  if (isBlockedAdminRoute || isBlockedOperationalRoute) {
    return (
      <div className="theme-surface flex min-h-screen items-center justify-center p-4 text-[#2a3234]">
        <div className="soft-panel rounded-2xl p-6 text-sm">
          Mengalihkan ke area yang sesuai dengan role akun...
        </div>
      </div>
    );
  }

  return (
    <div className="theme-surface flex h-dvh overflow-hidden">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <Topbar />
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}



