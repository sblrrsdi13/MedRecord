"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { Topbar } from "@/components/shared/topbar";
import { useAuthStore } from "@/store/auth-store";

const ADMIN_ALLOWED_ROUTES = ["/dashboard", "/settings", "/announcements", "/notifications", "/users", "/register", "/backup", "/monitoring", "/reports", "/security", "/audit-logs", "/profile"];
const OPERATIONAL_BLOCKED_ROUTES = ["/settings", "/users", "/register", "/backup", "/monitoring", "/reports", "/security", "/audit-logs"];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const role = useAuthStore((state) => state.user?.role);
  const pathname = usePathname();
  const router = useRouter();
  const isPatientPortal = role === "PATIENT" && pathname === "/patient-portal";
  const isBlockedPatientRoute = role === "PATIENT" && pathname !== "/patient-portal" && pathname !== "/profile";
  const isBlockedAdminRoute = role === "ADMIN" && !ADMIN_ALLOWED_ROUTES.includes(pathname);
  const isBlockedOperationalRoute = Boolean(role && role !== "ADMIN" && role !== "PATIENT" && OPERATIONAL_BLOCKED_ROUTES.includes(pathname));

  useEffect(() => {
    if (isBlockedPatientRoute) {
      router.replace("/patient-portal");
      return;
    }
    if (isBlockedAdminRoute || isBlockedOperationalRoute) {
      router.replace("/dashboard");
    }
  }, [isBlockedAdminRoute, isBlockedOperationalRoute, isBlockedPatientRoute, router]);

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
    <div className="theme-surface flex min-h-screen">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}



