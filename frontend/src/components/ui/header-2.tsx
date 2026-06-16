"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon";
import { useScroll } from "@/components/ui/use-scroll";
import { cn } from "@/lib/utils";
import type { SiteCms } from "@/types/site-cms";

type HeaderProps = {
  cms: SiteCms;
};

export function Header({ cms }: HeaderProps) {
  const [open, setOpen] = React.useState(false);
  const scrolled = useScroll(10);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  React.useEffect(() => {
    setOpen(false);
  }, [scrolled]);

  const links = cms.navLinks.length
    ? cms.navLinks
    : [
        { label: "Home", href: "#home" },
        { label: "Services", href: "#services" },
        { label: "Departments", href: "#departments" },
        { label: "Doctors", href: "#doctors" },
        { label: "Contact", href: "#contact" }
      ];

  return (
    <div className={cn("fixed left-0 right-0 top-0 z-50 px-4 transition-all duration-500 md:px-8", scrolled ? "py-3" : "py-5")}>
      <header
        className={cn(
          "mx-auto w-full max-w-[1440px] border border-transparent transition-all duration-500 ease-out",
          scrolled && !open && "max-w-[1180px] rounded-full border-[#faf8ef]/80 bg-[#faf8ef]/86 shadow-[0_18px_70px_rgba(48,55,50,.18)] backdrop-blur-2xl",
          open && "rounded-3xl border-[#faf8ef]/80 bg-[#faf8ef]/95 shadow-[0_18px_70px_rgba(48,55,50,.16)] backdrop-blur-2xl"
        )}
      >
        <nav className={cn("flex h-16 w-full items-center justify-between gap-3 px-1 transition-all duration-500 md:h-14 md:px-2", (scrolled || open) && "px-4 md:px-5")}>
          <Link href="/" onClick={() => setOpen(false)} className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden transition-all duration-500">
              <Image src={cms.logoImageUrl} alt={`${cms.brandName} logo`} width={44} height={44} className="h-11 w-11 object-contain" priority />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black uppercase leading-4 text-[#5f7974]">{cms.brandName}</span>
              <span className="block truncate text-xs font-semibold uppercase text-[#6a746f]">{cms.brandSubtitle}</span>
            </span>
          </Link>

          <div
            className={cn(
              "hidden items-center gap-1 rounded-full px-2 py-1 text-sm font-bold transition-all duration-500 lg:flex",
              scrolled
                ? "bg-transparent text-[#2a3234]"
                : "border border-[#faf8ef]/70 bg-[#faf8ef]/82 text-[#2a3234] shadow-[0_12px_36px_rgba(48,55,50,.14)] backdrop-blur-2xl"
            )}
          >
            {links.map((link) => (
              <a
                key={`${link.label}-${link.href}`}
                className={buttonVariants({
                  variant: "ghost",
                  className: "rounded-full px-4 text-[#2a3234] hover:bg-[#e6efe5] hover:text-[#5f7974]"
                })}
                href={link.href}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/login"
              className={buttonVariants({
                variant: "outline",
                className: "rounded-full border-[#faf8ef]/70 bg-[#faf8ef]/74 px-5 font-bold text-[#5f7974] shadow-sm backdrop-blur hover:bg-[#faf8ef]"
              })}
            >
              Login
            </Link>
            <Link
              href="/login/register"
              className={buttonVariants({
                className: "rounded-full bg-[#86a197] px-5 font-bold text-white shadow-lg shadow-stone-900/10 hover:bg-[#5f7974]"
              })}
            >
              {cms.primaryCtaLabel}
            </Link>
          </div>

          <Button
            size="icon"
            variant="outline"
            onClick={() => setOpen((value) => !value)}
            className="h-10 w-10 rounded-full border-white/80 bg-white/85 text-[#5f7974] shadow-sm backdrop-blur md:hidden"
            aria-label={open ? "Tutup menu" : "Buka menu"}
          >
            <MenuToggleIcon open={open} className="size-5" duration={300} />
          </Button>
        </nav>

        <div
          className={cn(
            "fixed inset-x-0 bottom-0 top-[76px] z-50 overflow-hidden border-t border-[#d9d5c9] bg-white/95 backdrop-blur-2xl transition md:hidden",
            open ? "block" : "hidden"
          )}
        >
          <div
            data-slot={open ? "open" : "closed"}
            className={cn(
              "flex h-full w-full flex-col justify-between gap-y-2 p-4 ease-out data-[slot=open]:animate-in data-[slot=open]:zoom-in-95 data-[slot=closed]:animate-out data-[slot=closed]:zoom-out-95"
            )}
          >
            <div className="grid gap-y-2">
              {links.map((link) => (
                <a
                  key={`${link.label}-${link.href}-mobile`}
                  className={buttonVariants({
                    variant: "ghost",
                    className: "h-12 justify-start rounded-2xl px-4 text-base font-bold text-[#2a3234] hover:bg-[#faf8ef] hover:text-[#5f7974]"
                  })}
                  href={link.href}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="grid gap-2 border-t border-[#d9d5c9] pt-4">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className={buttonVariants({
                  variant: "outline",
                  className: "h-11 w-full rounded-full border-[#c7c1b5] bg-white font-bold text-[#5f7974] hover:bg-[#faf8ef]"
                })}
              >
                Login
              </Link>
              <Link
                href="/login/register"
                onClick={() => setOpen(false)}
                className={buttonVariants({
                  className: "h-11 w-full rounded-full bg-[#86a197] font-bold text-white hover:bg-[#5f7974]"
                })}
              >
                {cms.primaryCtaLabel}
              </Link>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}



