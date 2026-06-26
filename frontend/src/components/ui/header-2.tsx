"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";
import { ChevronDown, LayoutDashboard, LogOut, UserCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon";
import { useScroll } from "@/components/ui/use-scroll";
import { getMe, logout, refreshSession } from "@/features/auth/services/auth-service";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import type { SiteCms } from "@/types/site-cms";

type HeaderProps = {
  cms: SiteCms;
};

export function Header({ cms }: HeaderProps) {
  const [open, setOpen] = React.useState(false);
  const [accountOpen, setAccountOpen] = React.useState(false);
  const [activeHash, setActiveHash] = React.useState("#home");
  const [sessionChecked, setSessionChecked] = React.useState(false);
  const scrolled = useScroll(10);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const links = React.useMemo(
    () => cms.navLinks.length
      ? cms.navLinks
      : [
          { label: "Home", href: "#home" },
          { label: "Services", href: "#services" },
          { label: "Departments", href: "#departments" },
          { label: "Doctors", href: "#doctors" },
          { label: "Contact", href: "#contact" }
        ],
    [cms.navLinks]
  );

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  React.useEffect(() => {
    setOpen(false);
  }, [scrolled]);

  React.useEffect(() => {
    const sectionIds = links
      .map((link) => getHashFromHref(link.href)?.slice(1))
      .filter((id): id is string => Boolean(id));
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleEntry?.target.id) {
          setActiveHash(`#${visibleEntry.target.id}`);
        }
      },
      { threshold: [0.28, 0.45, 0.62], rootMargin: "-22% 0px -52% 0px" }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [links]);

  React.useEffect(() => {
    let mounted = true;

    async function hydrateSession() {
      if (user || sessionChecked) {
        if (mounted) setSessionChecked(true);
        return;
      }

      try {
        const refreshed = accessToken ? { accessToken } : await refreshSession();
        const me = await getMe();
        if (!mounted) return;
        setSession(me, refreshed.accessToken);
      } catch {
        if (mounted) clearSession();
      } finally {
        if (mounted) setSessionChecked(true);
      }
    }

    void hydrateSession();

    return () => {
      mounted = false;
    };
  }, [accessToken, clearSession, sessionChecked, setSession, user]);

  const accountHref = user?.role === "PATIENT" ? "/patient-portal" : "/dashboard";

  async function handleLogout() {
    try {
      await logout();
    } finally {
      clearSession();
      setOpen(false);
      setAccountOpen(false);
      router.push("/login");
    }
  }

  function handleAnchorClick(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
    const hash = getHashFromHref(href);
    const isSamePageHash = hash && (href.startsWith("#") || href.startsWith("/#") || window.location.pathname === "/");

    if (!hash || !isSamePageHash) {
      setOpen(false);
      return;
    }

    const target = document.querySelector<HTMLElement>(hash);
    if (!target) {
      setOpen(false);
      return;
    }

    event.preventDefault();
    setOpen(false);
    setActiveHash(hash);
    window.history.pushState(null, "", hash);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    playSectionAnimationWhenSettled(target);
  }

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
                  className: cn(
                    "rounded-full px-4 text-[#2a3234] transition-all duration-300 hover:bg-[#e6efe5] hover:text-[#5f7974]",
                    activeHash === getHashFromHref(link.href) && "bg-[#5f7974] text-white shadow-sm hover:bg-[#5f7974] hover:text-white"
                  )
                })}
                href={link.href}
                onClick={(event) => handleAnchorClick(event, link.href)}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAccountOpen((value) => !value)}
                  className="flex h-11 items-center gap-3 rounded-full border border-[#faf8ef]/80 bg-[#faf8ef]/82 px-2.5 pr-4 font-bold text-[#2a3234] shadow-sm backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-[#faf8ef]"
                  aria-expanded={accountOpen}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5f7974] text-xs font-black uppercase text-white">
                    {user.name.slice(0, 1)}
                  </span>
                  <span className="max-w-36 truncate text-left text-sm">{user.name}</span>
                  <ChevronDown className={cn("h-4 w-4 text-[#5f7974] transition", accountOpen && "rotate-180")} />
                </button>
                {accountOpen && (
                  <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-[#c7c1b5] bg-[#faf8ef]/92 p-2 shadow-2xl shadow-stone-900/15 backdrop-blur-2xl animate-in fade-in zoom-in-95">
                    <div className="border-b border-[#d9d5c9] px-3 py-3">
                      <p className="truncate text-sm font-black text-[#2a3234]">{user.name}</p>
                      <p className="truncate text-xs text-[#6a746f]">{user.email}</p>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5f7974]">{user.role}</p>
                    </div>
                    <Link
                      href={accountHref}
                      onClick={() => setAccountOpen(false)}
                      className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-[#2a3234] transition hover:bg-[#e6efe5] hover:text-[#5f7974]"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Buka Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-[#2a3234] transition hover:bg-[#e6efe5] hover:text-[#5f7974]"
                    >
                      <UserCircle className="h-4 w-4" />
                      Profile Akun
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
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
              </>
            )}
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

      </header>
      {open && (
        <div className="relative z-[70] mx-auto mt-2 w-full max-w-[1440px] md:hidden">
          <div
            data-slot="open"
            className="max-h-[calc(100dvh-110px)] overflow-y-auto rounded-[1.6rem] border border-[#faf8ef]/80 bg-[#faf8ef]/96 p-3 shadow-[0_22px_70px_rgba(48,55,50,.24)] backdrop-blur-2xl ease-out animate-in fade-in zoom-in-95"
          >
            <div className="grid gap-y-2">
              {links.map((link) => (
                <a
                  key={`${link.label}-${link.href}-mobile`}
                  className={buttonVariants({
                    variant: "ghost",
                    className: cn(
                      "h-12 justify-start rounded-2xl px-4 text-base font-bold text-[#2a3234] transition-all duration-300 hover:bg-[#e6efe5] hover:text-[#5f7974]",
                      activeHash === getHashFromHref(link.href) && "bg-[#5f7974] text-white hover:bg-[#5f7974] hover:text-white"
                    )
                  })}
                  href={link.href}
                  onClick={(event) => handleAnchorClick(event, link.href)}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="mt-3 grid gap-2 border-t border-[#d9d5c9] pt-3">
              {user ? (
                <>
                  <div className="rounded-2xl border border-[#c7c1b5] bg-white/70 p-3">
                    <p className="truncate text-sm font-black text-[#2a3234]">{user.name}</p>
                    <p className="truncate text-xs text-[#6a746f]">{user.email}</p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5f7974]">{user.role}</p>
                  </div>
                  <Link
                    href={accountHref}
                    onClick={() => setOpen(false)}
                    className={buttonVariants({
                      className: "h-11 w-full rounded-full bg-[#86a197] font-bold text-white hover:bg-[#5f7974]"
                    })}
                  >
                    Buka Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className={buttonVariants({
                      variant: "outline",
                      className: "h-11 w-full rounded-full border-[#c7c1b5] bg-white font-bold text-[#5f7974] hover:bg-[#faf8ef]"
                    })}
                  >
                    Profile Akun
                  </Link>
                  <Button type="button" variant="outline" onClick={handleLogout} className="h-11 w-full rounded-full border-red-200 bg-white font-bold text-red-600 hover:bg-red-50">
                    Logout
                  </Button>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getHashFromHref(href: string) {
  if (href.startsWith("#")) return href;
  if (href.startsWith("/#")) return href.slice(1);

  try {
    const base = typeof window === "undefined" ? "http://localhost" : window.location.origin;
    const url = new URL(href, base);
    return url.hash || null;
  } catch {
    return null;
  }
}

function playSectionAnimationWhenSettled(target: HTMLElement) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) return;

  let stableFrames = 0;
  let lastScrollY = window.scrollY;
  const startedAt = performance.now();

  function tick() {
    const currentScrollY = window.scrollY;
    const scrollIsStable = Math.abs(currentScrollY - lastScrollY) < 1;
    const rect = target.getBoundingClientRect();
    const targetIsVisible = rect.top < window.innerHeight * 0.72 && rect.bottom > 96;

    stableFrames = scrollIsStable ? stableFrames + 1 : 0;
    lastScrollY = currentScrollY;

    if ((targetIsVisible && stableFrames >= 4) || performance.now() - startedAt > 1600) {
      target.classList.remove("section-focus-pop");
      void target.offsetWidth;
      target.classList.add("section-focus-pop");
      window.setTimeout(() => target.classList.remove("section-focus-pop"), 1200);
      return;
    }

    window.requestAnimationFrame(tick);
  }

  window.requestAnimationFrame(tick);
}


