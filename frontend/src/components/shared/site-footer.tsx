"use client";

import Image from "next/image";
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Send, Twitter, Youtube, type LucideIcon } from "lucide-react";
import { useSiteCms } from "@/hooks/use-site-cms";
import type { SiteCms } from "@/types/site-cms";

const socialIcons: Record<string, LucideIcon> = { Facebook, Instagram, Linkedin, Twitter, Youtube };

function FooterLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} className="text-sm text-[#4a5657] transition hover:text-[#5f7974]">
      {children}
    </a>
  );
}

export function SiteFooter({ cms: providedCms }: { cms?: SiteCms }) {
  const liveCms = useSiteCms(!providedCms);
  const year = new Date().getFullYear();
  const cms = providedCms ?? liveCms;

  return (
    <footer className="mt-auto border-t border-[#c7c1b5] bg-white text-[#2a3234]">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-6">
        <section className="grid gap-4 border-b border-[#c7c1b5] pb-6 lg:grid-cols-[180px_1fr_320px] lg:items-center">
          <div>
            <p className="text-sm font-bold text-[#2a3234]">{cms.footerSubscribeTitle}</p>
            <p className="mt-1 text-xs text-[#7a827e]">{cms.footerSubscribeSubtitle}</p>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-[#4a5657]">{cms.footerSubscribeDescription}</p>
          <form action={`mailto:${cms.footerEmail}`} method="post" className="flex overflow-hidden rounded-lg border border-[#c7c1b5] bg-[#faf8ef]">
            <input
              type="email"
              name="email"
              placeholder={cms.footerEmailPlaceholder}
              className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-[#7a827e] focus:ring-0"
            />
            <button type="submit" aria-label={cms.footerSubmitLabel} className="m-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#5f7974] text-white transition hover:bg-[#86a197]">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>

        <section className="grid gap-8 py-8 md:grid-cols-2 xl:grid-cols-[1.25fr_repeat(3,minmax(0,0.75fr))_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden">
                <Image src={cms.logoImageUrl} alt={`${cms.brandName} logo`} width={44} height={44} className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-xl font-black tracking-tight text-[#2a3234]">{cms.brandName}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5f7974]">{cms.brandSubtitle}</p>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-6 text-[#4a5657]">{cms.footerDescription}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {cms.socialLinks.map((item) => {
                const Icon = socialIcons[item.icon] ?? Instagram;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#c7c1b5] bg-[#faf8ef] text-[#5f7974] transition hover:-translate-y-0.5 hover:border-[#5f7974] hover:bg-[#e6efe5]"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {cms.footerColumns.map((column) => (
            <div key={column.title}>
              <p className="font-bold text-[#2a3234]">{column.title}</p>
              <div className="mt-4 grid gap-2">
                {column.links.map((link) => (
                  <FooterLink key={`${column.title}-${link.label}`} href={link.href}>
                    {link.label}
                  </FooterLink>
                ))}
              </div>
            </div>
          ))}

          <div>
            <p className="font-bold text-[#2a3234]">{cms.footerContactTitle}</p>
            <div className="mt-4 grid gap-3 text-sm text-[#4a5657]">
              <a href={`tel:${cms.footerPhone}`} className="flex items-center gap-2 transition hover:text-[#5f7974]">
                <Phone className="h-4 w-4 text-[#5f7974]" />
                {cms.footerPhone}
              </a>
              <a href={`mailto:${cms.footerEmail}`} className="flex items-center gap-2 transition hover:text-[#5f7974]">
                <Mail className="h-4 w-4 text-[#5f7974]" />
                {cms.footerEmail}
              </a>
              <div className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#5f7974]" />
                <span>{cms.footerAddress}</span>
              </div>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cms.footerAddress)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 block overflow-hidden rounded-xl border border-[#c7c1b5] bg-[#eef1e8] p-3 transition hover:border-[#5f7974]"
            >
              <div className="relative h-28 rounded-lg bg-[#d9d5c9]">
                <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(90deg,rgba(95,121,116,.16)_1px,transparent_1px),linear-gradient(rgba(95,121,116,.16)_1px,transparent_1px)] [background-size:18px_18px]" />
                <MapPin className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 fill-red-500 text-red-500" />
              </div>
            </a>
          </div>
        </section>
      </div>

      <div className="bg-[#2a3234] text-white">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-4 py-4 text-xs md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex flex-wrap gap-4">
            {cms.footerBottomLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-white/75 transition hover:text-white">
                {link.label}
              </a>
            ))}
          </div>
          <p className="text-white/75">
            © {year} {cms.brandName}. {cms.footerCopyrightText}
          </p>
        </div>
      </div>
    </footer>
  );
}
