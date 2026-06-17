"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { LogIn, ShieldCheck, Sparkles, UserPlus, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/login-form";
import { PatientRegisterForm } from "@/features/auth/components/patient-register-form";
import { useSiteCms } from "@/hooks/use-site-cms";
import { cn } from "@/lib/utils";

type AuthTab = "login" | "register";

export default function LoginPage() {
  const cms = useSiteCms(true, false);
  const [activeTab, setActiveTab] = useState<AuthTab>("login");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab") === "register") setActiveTab("register");
  }, []);

  return (
    <main className="theme-surface relative min-h-screen overflow-x-hidden p-2 text-[#2a3234] sm:p-3 lg:h-screen lg:overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(134,161,151,0.32),transparent_34%),radial-gradient(circle_at_80%_15%,rgba(215,210,235,0.36),transparent_30%),linear-gradient(135deg,#faf4e6_0%,#e6efe5_55%,#e5e0f5_100%)]" />
      <div className="absolute left-1/2 top-10 h-72 w-72 rounded-full bg-[#d7d2eb]/35 blur-3xl" />
      <div className="absolute bottom-0 right-10 h-80 w-80 rounded-full bg-[#86a197]/24 blur-3xl" />

      <section className="relative flex min-h-[calc(100vh-1rem)] w-full flex-col gap-3 lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(440px,520px)] xl:grid-cols-[minmax(0,1fr)_minmax(500px,560px)]">
        <div className="order-2 flex min-h-0 flex-col justify-center overflow-hidden px-5 py-10 lg:order-1 lg:px-10 lg:py-10">
          <div className="mb-12 flex items-center gap-3 lg:mb-16">
            <Image src={cms.logoImageUrl} alt={`${cms.brandName} logo`} width={48} height={48} className="h-12 w-12 object-contain" priority />
            <div>
              <p className="font-black uppercase text-[#2a3234]">{cms.brandName}</p>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5f7974]">{cms.brandSubtitle}</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="soft-panel inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-[#4a5657]">
              <Sparkles className="h-4 w-4 text-[#5f7974]" />
              Smart Clinic Management 2026
            </div>
            <div className="max-w-3xl space-y-5">
              <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
                Selamat datang di <span className="text-[#5f7974]">{cms.brandName}</span>
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[#4a5657] md:text-lg">
                {cms.heroDescription}
              </p>
            </div>
          </div>
        </div>

        <Card className="order-1 flex max-h-none min-h-[calc(100vh-1rem)] w-full flex-col overflow-hidden rounded-[1.75rem] border-white/80 bg-white/92 shadow-2xl shadow-stone-900/10 backdrop-blur-xl lg:order-2 lg:h-full lg:min-h-0">
          <div className={cn("flex min-h-0 flex-1 flex-col", activeTab === "login" && "justify-center")}>
            <CardHeader className="shrink-0 pb-3">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden">
                  <Image src={cms.logoImageUrl} alt={`${cms.brandName} logo`} width={48} height={48} className="h-12 w-12 object-contain" priority />
                </div>
                <div className="min-w-0">
                  <CardTitle>{activeTab === "login" ? "Masuk ke Dashboard" : "Daftar Akun Pasien"}</CardTitle>
                  <CardDescription>
                    {activeTab === "login"
                      ? "Satu pintu login untuk Admin, Operasional Klinik, dan Pasien."
                      : "Buat akun portal sekaligus data pasien dalam satu formulir."}
                  </CardDescription>
                </div>
              </div>

              <div className="grid grid-cols-2 rounded-2xl bg-[#eef1e8] p-1">
                <AuthTabButton active={activeTab === "register"} icon={UserPlus} label="Register" onClick={() => setActiveTab("register")} />
                <AuthTabButton active={activeTab === "login"} icon={LogIn} label="Login" onClick={() => setActiveTab("login")} />
              </div>
            </CardHeader>
            <CardContent className={cn(
              "min-h-0 overflow-y-auto px-6 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              activeTab === "login" ? "" : "flex-1 space-y-5"
            )}>
              <div key={activeTab} className={cn("animate-in fade-in-0 slide-in-from-bottom-2 duration-300", activeTab === "login" && "mx-auto w-full max-w-md")}>
                {activeTab === "login" ? <LoginForm /> : <PatientRegisterForm onLoginClick={() => setActiveTab("login")} />}
              </div>
              <div className={cn("flex items-center gap-2 rounded-xl bg-[#e6efe5] p-3 text-xs font-medium text-[#5f7974]", activeTab === "login" && "mx-auto mt-5 w-full max-w-md")}>
              <ShieldCheck className="h-4 w-4 shrink-0" />
                {activeTab === "login" &&
                  "Data medis dilindungi RBAC dan token autentikasi."}
              </div>
            </CardContent>
            </div>
        </Card>
      </section>
    </main>
  );
}

function AuthTabButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold transition",
        active ? "bg-white text-[#5f7974] shadow-sm" : "text-[#7a827e] hover:bg-white/55 hover:text-[#2a3234]"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
      {active && <span className="absolute inset-x-8 -bottom-1 h-0.5 rounded-full bg-[#86a197]" />}
    </button>
  );
}
