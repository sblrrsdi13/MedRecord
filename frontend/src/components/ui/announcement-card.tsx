"use client";

import { BookOpen, CalendarDays, Gift, Megaphone, TriangleAlert, UserRound, type LucideIcon } from "lucide-react";
import type React from "react";
import { cn } from "@/lib/utils";
import type { AnnouncementItem } from "@/services/announcement-service";

type AnnouncementCardProps = {
  item: AnnouncementItem;
  dateLabel?: string;
  authorLabel?: string;
  actions?: React.ReactNode;
  compact?: boolean;
  showStatus?: boolean;
};

const toneMap: Record<
  AnnouncementItem["category"],
  {
    label: string;
    icon: LucideIcon;
    card: string;
    iconWrap: string;
    badge: string;
    glow: string;
  }
> = {
  info: {
    label: "Informasi",
    icon: Megaphone,
    card: "soft-panel",
    iconWrap: "bg-[#e6efe5] text-[#5f7974]",
    badge: "bg-[#e6efe5] text-[#5f7974]",
    glow: "bg-[#86a197]/10"
  },
  education: {
    label: "Edukasi",
    icon: BookOpen,
    card: "border-[#cfd9d1] bg-[#e6efe5]/80",
    iconWrap: "bg-[#dce9dd] text-[#58736a]",
    badge: "bg-[#dce9dd] text-[#58736a]",
    glow: "bg-stone-500/10"
  },
  warning: {
    label: "Peringatan",
    icon: TriangleAlert,
    card: "border-[#e7d6ae] bg-[#f1e5c8]/85",
    iconWrap: "bg-[#ead9af] text-[#8a6a2f]",
    badge: "bg-[#ead9af] text-[#8a6a2f]",
    glow: "bg-amber-500/12"
  },
  promo: {
    label: "Promo",
    icon: Gift,
    card: "border-[#cfd9d1] bg-[#e1ece4]/85",
    iconWrap: "bg-[#dce9dd] text-[#58736a]",
    badge: "bg-[#dce9dd] text-[#58736a]",
    glow: "bg-[#e6efe5]/12"
  }
};

export function AnnouncementCard({ item, dateLabel, authorLabel, actions, compact = false, showStatus = false }: AnnouncementCardProps) {
  const tone = toneMap[item.category] ?? toneMap.info;
  const Icon = tone.icon;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/10",
        tone.card,
        compact ? "p-4" : "p-5"
      )}
    >
      <div className={cn("pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl transition group-hover:scale-125", tone.glow)} />
      <div className="relative flex items-start gap-4">
        <div className={cn("flex shrink-0 items-center justify-center rounded-2xl", compact ? "h-11 w-11" : "h-12 w-12", tone.iconWrap)}>
          <Icon className={compact ? "h-5 w-5" : "h-6 w-6"} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em]", tone.badge)}>
              {tone.label}
            </span>
            {showStatus && (
              <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", item.isActive ? "bg-[#dce9dd] text-[#58736a]" : "bg-stone-100 text-stone-600")}>
                {item.isActive ? "Aktif" : "Draft"}
              </span>
            )}
          </div>

          <h3 className={cn("mt-3 font-black leading-snug text-[#2a3234]", compact ? "text-base" : "text-lg")}>{item.title}</h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#4a5657]">{item.content}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium text-[#6a746f]">
            {dateLabel && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-[#5f7974]" />
                {dateLabel}
              </span>
            )}
            {authorLabel && (
              <span className="inline-flex items-center gap-1.5">
                <UserRound className="h-3.5 w-3.5 text-[#5f7974]" />
                {authorLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {actions && <div className="relative mt-5 flex flex-wrap gap-2 border-t border-black/5 pt-4">{actions}</div>}
    </article>
  );
}




