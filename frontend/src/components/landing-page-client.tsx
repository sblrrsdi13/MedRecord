"use client";

import Link from "next/link";
import { Activity, Ambulance, Baby, CheckCircle2, HeartPulse, Hospital, ShieldCheck, Stethoscope, type LucideIcon } from "lucide-react";
import { useEffect } from "react";
import { SiteFooter } from "@/components/shared/site-footer";
import { Header } from "@/components/ui/header-2";
import { useSiteCms } from "@/hooks/use-site-cms";
import type { SiteCms } from "@/types/site-cms";

const departmentIcons: Record<string, LucideIcon> = {
  Activity,
  Ambulance,
  Baby,
  HeartPulse,
  Hospital,
  Stethoscope
};

const stats = [
  { value: "24/7", label: "Portal aktif" },
  { value: "6+", label: "Role operasional" },
  { value: "Realtime", label: "Antrian & notifikasi" }
];

export function LandingPageClient({ initialCms }: { initialCms: SiteCms }) {
  const cms = useSiteCms(true, true, initialCms);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".scroll-reveal"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          } else {
            entry.target.classList.remove("is-visible");
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="flex min-h-screen flex-col overflow-hidden bg-[#f4efe4] text-[#2a3234]">
      <Header cms={cms} />
      {cms.announcementBanner && (
        <div className="fixed left-1/2 top-20 z-40 hidden -translate-x-1/2 rounded-full border border-[#c7c1b5] bg-[#faf8ef]/85 px-5 py-2 text-xs font-bold text-[#5f7974] shadow-lg backdrop-blur-md md:block">
          {cms.announcementBanner}
        </div>
      )}

      <section id="home" className="relative flex min-h-screen items-center overflow-hidden">
        <img
          src={cms.heroImageUrl}
          alt="Dokter dan pasien di ruang klinik modern"
          fetchPriority="high"
          decoding="async"
          className="landing-hero-image absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#faf8ef]/98 via-[#faf8ef]/90 to-[#d9d5c9]/36" />
        <div className="absolute inset-y-0 left-0 w-[64%] bg-[radial-gradient(circle_at_25%_45%,rgba(250,248,239,.98),rgba(250,248,239,.78)_46%,transparent_72%)]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#f4efe4] via-[#f4efe4]/75 to-transparent" />
        <div className="relative z-10 mx-auto grid w-full max-w-[1440px] px-6 pt-28 md:px-10 lg:grid-cols-[1fr_0.7fr]">
          <div className="landing-reveal max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#9aa9a2] bg-white/82 px-4 py-2 text-xs font-bold uppercase text-[#5f7974] shadow-sm backdrop-blur">
              <ShieldCheck className="h-4 w-4" />
              {cms.heroBadge}
            </span>
            <h1 className="mt-8 max-w-xl text-5xl font-black leading-[1.04] text-[#2a3234] md:text-7xl">
              {cms.heroTitle}
            </h1>
            <p className="mt-6 max-w-xl text-lg font-medium leading-8 text-[#3f4a49] md:text-xl">
              {cms.heroDescription}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={cms.primaryCtaHref} className="inline-flex h-12 items-center justify-center rounded-full bg-[#5f7974] px-7 text-sm font-bold text-white shadow-xl shadow-stone-900/15 transition hover:-translate-y-1 hover:bg-[#86a197]">
                {cms.primaryCtaLabel}
              </Link>
              <a href={cms.secondaryCtaHref} className="inline-flex h-12 items-center justify-center rounded-full border border-[#9aa9a2] bg-[#faf8ef]/82 px-7 text-sm font-bold text-[#5f7974] shadow-sm transition hover:-translate-y-1 hover:bg-[#faf8ef]">
                {cms.secondaryCtaLabel}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="departments" className="content-auto scroll-reveal px-4 py-14 md:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="scroll-reveal text-center">
            <p className="text-sm font-bold uppercase text-[#5f7974]">{cms.departmentsEyebrow}</p>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">{cms.departmentsTitle}</h2>
          </div>
          <div className="landing-swipe mt-10 flex snap-x gap-5 overflow-x-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {cms.departments.map((item) => {
              const Icon = departmentIcons[item.icon] ?? Stethoscope;
              return (
                <article key={item.title} className="scroll-reveal landing-card soft-panel group min-w-[78vw] snap-center rounded-3xl p-8 text-center transition duration-300 hover:-translate-y-2 sm:min-w-[360px] lg:min-w-[31%]">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#eef1e8] text-[#86a197] transition group-hover:scale-110 group-hover:bg-[#e6efe5]">
                    <Icon className="h-10 w-10" />
                  </div>
                  <h3 className="mt-6 text-xl font-black">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#4a5657]">{item.desc}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="services" className="content-auto scroll-reveal bg-[#e9eee3] px-4 py-16 md:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="scroll-reveal mb-9 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold uppercase text-[#5f7974]">{cms.servicesEyebrow}</p>
              <h2 className="mt-3 text-3xl font-black md:text-4xl">{cms.servicesTitle}</h2>
            </div>
            <div className="flex gap-3 text-sm text-[#4a5657]">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#faf8ef] px-4 py-2 shadow-sm"><CheckCircle2 className="h-4 w-4 text-[#5f7974]" /> {cms.servicesBadge}</span>
            </div>
          </div>
          <div className="landing-swipe flex snap-x gap-6 overflow-x-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {cms.services.map((item) => (
              <article key={item.title} className="scroll-reveal landing-card soft-panel group min-w-[84vw] snap-center overflow-hidden rounded-3xl p-4 transition duration-300 hover:-translate-y-2 sm:min-w-[420px] lg:min-w-[31%]">
                <div className="overflow-hidden rounded-2xl">
                  <img src={item.image} alt={item.title} loading="lazy" decoding="async" width={640} height={320} className="h-52 w-full object-cover transition duration-700 group-hover:scale-110" />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-black">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#4a5657]">{item.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="doctors" className="content-auto scroll-reveal px-4 py-16 md:px-8">
        <div className="soft-panel mx-auto grid max-w-[1160px] gap-8 rounded-[2rem] p-6 md:grid-cols-[0.9fr_1.1fr] md:p-10">
          <div className="scroll-reveal relative min-h-80 overflow-hidden rounded-3xl bg-[#d9d5c9]">
            <img src={cms.doctorImageUrl} alt="Dokter klinik" loading="lazy" decoding="async" width={720} height={520} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#5f7974]/55 to-transparent" />
          </div>
          <div className="scroll-reveal flex flex-col justify-center">
            <p className="text-sm font-bold uppercase text-[#5f7974]">{cms.doctorSectionEyebrow}</p>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">{cms.doctorSectionTitle}</h2>
            <p className="mt-5 text-base leading-8 text-[#4a5657]">
              {cms.doctorSectionDescription}
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {stats.map((item) => (
                <div key={item.label} className="scroll-reveal rounded-2xl bg-[#faf8ef] p-4">
                  <p className="text-xl font-black text-[#5f7974]">{item.value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase text-[#4a5657]">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="content-auto scroll-reveal px-4 pb-14 md:px-8">
        <div className="mx-auto mb-6 max-w-[1160px] rounded-[2rem] border border-[#c7c1b5] bg-[#faf8ef] p-8 shadow-sm">
          <p className="text-sm font-bold uppercase text-[#5f7974]">Informasi</p>
          <h2 className="mt-2 text-3xl font-black text-[#2a3234]">{cms.informationPageTitle}</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#4a5657]">{cms.informationPageContent}</p>
        </div>
        <div className="mx-auto flex max-w-[1160px] flex-col items-center justify-between gap-5 rounded-[2rem] bg-[#5f7974] p-8 text-white shadow-2xl shadow-stone-900/20 md:flex-row">
          <div>
            <p className="text-sm font-bold uppercase text-white/70">{cms.ctaEyebrow}</p>
            <h2 className="mt-2 text-3xl font-black">{cms.ctaTitle}</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/login" className="inline-flex h-10 items-center justify-center rounded-full bg-white px-7 text-sm font-bold text-[#5f7974] transition hover:bg-[#e6efe5]">
              Login
            </Link>
            <Link href="/login/register" className="inline-flex h-10 items-center justify-center rounded-full border border-white/40 bg-white/10 px-7 text-sm font-bold text-white transition hover:bg-white/20">
              Register Pasien
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter cms={cms} />
    </main>
  );
}



