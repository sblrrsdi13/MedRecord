"use client";

import Link from "next/link";
import Image from "next/image";
import { Activity, Ambulance, Baby, CalendarDays, CheckCircle2, HeartPulse, Hospital, Stethoscope, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { AnnouncementCard } from "@/components/ui/announcement-card";
import { SiteFooter } from "@/components/shared/site-footer";
import { Header } from "@/components/ui/header-2";
import { getPublicAnnouncements, type AnnouncementItem } from "@/features/announcements/services/announcement-service";
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

export function LandingPageClient({ initialCms }: { initialCms: SiteCms }) {
  const cms = useSiteCms(true, true, initialCms);
  const [publicAnnouncements, setPublicAnnouncements] = useState<AnnouncementItem[]>([]);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".scroll-reveal"));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    elements.forEach((element, index) => {
      element.style.setProperty("--reveal-delay", `${Math.min(index * 45, 260)}ms`);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const rect = entry.boundingClientRect;
          const farAboveViewport = rect.bottom < -80;
          const farBelowViewport = rect.top > window.innerHeight + 160;

          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            return;
          }

          if (farAboveViewport || farBelowViewport) {
            entry.target.classList.remove("is-visible");
          }
        });
      },
      { threshold: 0.08, rootMargin: "120px 0px 120px 0px" }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let mounted = true;
    getPublicAnnouncements()
      .then((items) => {
        if (mounted) setPublicAnnouncements(items.filter((item) => item.isActive));
      })
      .catch(() => {
        if (mounted) setPublicAnnouncements([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col overflow-hidden bg-[#f4efe4] text-[#2a3234]">
      <Header cms={cms} />

      <section id="home" className="landing-section relative flex min-h-screen scroll-mt-24 items-center overflow-hidden">
        <Image
          src={cms.heroImageUrl}
          alt={cms.heroImageAlt}
          fill
          priority
          sizes="100vw"
          className="landing-hero-image absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#faf8ef]/98 via-[#faf8ef]/90 to-[#d9d5c9]/36" />
        <div className="absolute inset-y-0 left-0 w-[64%] bg-[radial-gradient(circle_at_25%_45%,rgba(250,248,239,.98),rgba(250,248,239,.78)_46%,transparent_72%)]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#f4efe4] via-[#f4efe4]/75 to-transparent" />
        <div className="landing-focus-target relative z-10 mx-auto grid w-full max-w-[1440px] px-6 pt-28 md:px-10 lg:grid-cols-[1fr_0.7fr]">
          <div className="landing-reveal max-w-2xl">
            <h1 className="max-w-xl text-5xl font-black leading-[1.04] text-[#2a3234] md:text-7xl">
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

      <section id="departments" className="landing-section content-auto scroll-reveal scroll-mt-24 px-4 py-14 md:px-8">
        <div className="landing-focus-target mx-auto max-w-[1440px]">
          <div className="scroll-reveal text-center">
            <p className="text-sm font-bold uppercase text-[#5f7974]">{cms.departmentsEyebrow}</p>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">{cms.departmentsTitle}</h2>
          </div>
          <div className="landing-swipe mt-10 flex snap-x gap-5 overflow-x-auto overscroll-x-contain pb-6 pr-6 touch-pan-x">
            {cms.departments.map((item) => {
              const Icon = departmentIcons[item.icon] ?? Stethoscope;
              return (
                <article key={item.title} className="scroll-reveal landing-card soft-panel group min-w-[78vw] shrink-0 snap-center rounded-3xl p-8 text-center transition duration-300 hover:-translate-y-2 sm:min-w-[360px] lg:min-w-[31%]">
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

      <section id="services" className="landing-section content-auto scroll-reveal scroll-mt-24 bg-[#e9eee3] px-4 py-16 md:px-8">
        <div className="landing-focus-target mx-auto max-w-[1440px]">
          <div className="scroll-reveal mb-9 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold uppercase text-[#5f7974]">{cms.servicesEyebrow}</p>
              <h2 className="mt-3 text-3xl font-black md:text-4xl">{cms.servicesTitle}</h2>
            </div>
            <div className="flex gap-3 text-sm text-[#4a5657]">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#faf8ef] px-4 py-2 shadow-sm"><CheckCircle2 className="h-4 w-4 text-[#5f7974]" /> {cms.servicesBadge}</span>
            </div>
          </div>
          <div className="landing-swipe flex snap-x gap-6 overflow-x-auto overscroll-x-contain pb-6 pr-6 touch-pan-x">
            {cms.services.map((item) => (
              <article key={item.title} className="scroll-reveal landing-card soft-panel group min-w-[84vw] shrink-0 snap-center overflow-hidden rounded-3xl p-4 transition duration-300 hover:-translate-y-2 sm:min-w-[420px] lg:min-w-[31%]">
                <div className="overflow-hidden rounded-2xl">
                  <Image src={item.image} alt={item.title} width={640} height={320} sizes="(min-width: 1024px) 31vw, (min-width: 640px) 420px, 84vw" className="h-52 w-full object-cover transition duration-700 group-hover:scale-110" />
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

      <section id="doctors" className="landing-section content-auto scroll-reveal scroll-mt-24 px-4 py-16 md:px-8">
        <div className="landing-focus-target soft-panel mx-auto grid max-w-[1160px] gap-8 rounded-[2rem] p-6 md:grid-cols-[0.9fr_1.1fr] md:p-10">
          <div className="scroll-reveal relative min-h-80 overflow-hidden rounded-3xl bg-[#d9d5c9]">
            <Image src={cms.doctorImageUrl} alt={cms.doctorImageAlt} fill sizes="(min-width: 768px) 45vw, 100vw" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#5f7974]/55 to-transparent" />
          </div>
          <div className="scroll-reveal flex flex-col justify-center">
            <p className="text-sm font-bold uppercase text-[#5f7974]">{cms.doctorSectionEyebrow}</p>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">{cms.doctorSectionTitle}</h2>
            <p className="mt-5 text-base leading-8 text-[#4a5657]">
              {cms.doctorSectionDescription}
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {cms.landingStats.map((item) => (
                <div key={item.label} className="scroll-reveal rounded-2xl bg-[#faf8ef] p-4">
                  <p className="text-xl font-black text-[#5f7974]">{item.value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase text-[#4a5657]">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="landing-section content-auto scroll-reveal scroll-mt-24 px-4 pb-14 md:px-8">
        <div className="landing-focus-target mx-auto mb-6 max-w-[1160px] overflow-hidden rounded-[2rem] border border-[#c7c1b5] bg-[#faf8ef] shadow-sm">
          <div className="relative p-8 md:p-10">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#86a197]/16 blur-3xl" />
            <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase text-[#5f7974]">{cms.informationEyebrow}</p>
                <h2 className="mt-2 text-3xl font-black text-[#2a3234] md:text-4xl">{cms.informationPageTitle}</h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-[#4a5657]">{cms.informationPageContent}</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#c7c1b5] bg-white/70 px-4 py-2 text-xs font-bold text-[#5f7974]">
                <CalendarDays className="h-4 w-4" />
                Update Klinik
              </span>
            </div>

            <div className="relative mt-8">
              {publicAnnouncements.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <AnnouncementCard
                    item={publicAnnouncements[0]}
                    dateLabel={formatAnnouncementDate(publicAnnouncements[0].createdAt)}
                    authorLabel={publicAnnouncements[0].author?.name ?? "MedRecord"}
                  />
                  <div className="grid gap-4">
                    {publicAnnouncements.slice(1, 4).map((item) => (
                      <AnnouncementCard
                        key={item.id}
                        item={item}
                        compact
                        dateLabel={formatAnnouncementDate(item.createdAt)}
                        authorLabel={item.author?.name ?? "MedRecord"}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-[#c7c1b5] bg-white/65 p-6 text-sm leading-7 text-[#4a5657]">
                  Belum ada informasi publik terbaru. Admin dapat menambahkan konten dari menu Pengumuman.
                </div>
              )}

              {publicAnnouncements.length > 4 && (
                <div className="landing-swipe mt-5 flex snap-x gap-4 overflow-x-auto overscroll-x-contain pb-4 pr-4 touch-pan-x">
                  {publicAnnouncements.slice(4).map((item) => (
                    <div key={item.id} className="min-w-[82vw] shrink-0 snap-center sm:min-w-[360px] lg:min-w-[340px]">
                      <AnnouncementCard
                        item={item}
                        compact
                        dateLabel={formatAnnouncementDate(item.createdAt)}
                        authorLabel={item.author?.name ?? "MedRecord"}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1160px] flex-col items-center justify-between gap-5 rounded-[2rem] bg-[#5f7974] p-8 text-white shadow-2xl shadow-stone-900/20 md:flex-row">
          <div>
            <p className="text-sm font-bold uppercase text-white/70">{cms.ctaEyebrow}</p>
            <h2 className="mt-2 text-3xl font-black">{cms.ctaTitle}</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={cms.ctaPrimaryHref} className="inline-flex h-10 items-center justify-center rounded-full bg-white px-7 text-sm font-bold text-[#5f7974] transition hover:bg-[#e6efe5]">
              {cms.ctaPrimaryLabel}
            </Link>
            <Link href={cms.ctaSecondaryHref} className="inline-flex h-10 items-center justify-center rounded-full border border-white/40 bg-white/10 px-7 text-sm font-bold text-white transition hover:bg-white/20">
              {cms.ctaSecondaryLabel}
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter cms={cms} />
    </main>
  );
}

function formatAnnouncementDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}



