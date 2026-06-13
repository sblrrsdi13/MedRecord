"use client";

import { AlertTriangle, BellRing, CheckCircle2, Info, Trash2, UserRound, XCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/services/notification-service";
import type { RoleName } from "@/types/api";

type NotificationCardProps = {
  item: NotificationItem;
  dateLabel: string;
  senderLabel: string;
  onRead: () => void;
  onDelete: () => void;
  deleteLabel: string;
};

const typeTone: Record<
  NotificationItem["type"],
  {
    label: string;
    icon: LucideIcon;
    card: string;
    badge: string;
    iconWrap: string;
    dot: string;
  }
> = {
  info: {
    label: "Info",
    icon: Info,
    card: "border-[#cfd9d1] bg-[#e6efe5]/80 hover:bg-[#e6efe5]",
    badge: "bg-[#dce9dd] text-[#58736a]",
    iconWrap: "bg-[#dce9dd] text-[#58736a]",
    dot: "bg-stone-500"
  },
  success: {
    label: "Berhasil",
    icon: CheckCircle2,
    card: "border-[#cfd9d1] bg-[#e1ece4]/80 hover:bg-[#e1ece4]",
    badge: "bg-[#dce9dd] text-[#58736a]",
    iconWrap: "bg-[#dce9dd] text-[#58736a]",
    dot: "bg-[#86a197]"
  },
  warning: {
    label: "Peringatan",
    icon: AlertTriangle,
    card: "border-[#e7d6ae] bg-[#f1e5c8]/80 hover:bg-[#f1e5c8]",
    badge: "bg-[#ead9af] text-[#8a6a2f]",
    iconWrap: "bg-[#ead9af] text-[#8a6a2f]",
    dot: "bg-amber-500"
  },
  danger: {
    label: "Penting",
    icon: XCircle,
    card: "border-[#e4c6c6] bg-[#ead3d3]/80 hover:bg-[#ead3d3]",
    badge: "bg-[#e4c6c6] text-[#a75a5a]",
    iconWrap: "bg-[#e4c6c6] text-[#a75a5a]",
    dot: "bg-red-600"
  }
};

export function notificationSenderBadge(role?: RoleName | null) {
  if (role === "ADMIN") return { label: "Admin", className: "bg-[#dce9dd] text-[#58736a]" };
  if (role && ["RECEPTIONIST", "NURSE", "DOCTOR", "PHARMACY", "CASHIER"].includes(role)) return { label: "Operasional", className: "bg-[#dce9dd] text-[#58736a]" };
  return { label: "Sistem", className: "bg-stone-100 text-stone-600" };
}

export function NotificationCard({ item, dateLabel, senderLabel, onRead, onDelete, deleteLabel }: NotificationCardProps) {
  const tone = typeTone[item.type] ?? typeTone.info;
  const Icon = tone.icon;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onRead}
      onKeyDown={(event) => {
        if (event.key === "Enter") onRead();
      }}
      className={cn(
        "group relative w-full cursor-pointer overflow-hidden rounded-2xl border p-3 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg",
        tone.card,
        item.readAt && "opacity-75"
      )}
    >
      {!item.readAt && <span className={cn("absolute left-0 top-4 h-10 w-1 rounded-r-full", tone.dot)} />}
      <div className="flex items-start gap-3 pl-1">
        <div className="flex w-12 shrink-0 flex-col items-center gap-1.5">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", tone.iconWrap)}>
            <Icon className="h-5 w-5" />
          </div>
          <span className={cn("max-w-full truncate rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.04em]", tone.badge)}>
            {tone.label}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="min-w-0 flex-1 truncate text-sm font-black text-[#2a3234]">{item.title}</h3>
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#4a5657]">{item.message}</p>
          <div className="mt-3 flex min-w-0 items-center gap-2 overflow-hidden text-[11px] font-medium text-[#6a746f]">
            <span className="inline-flex min-w-0 shrink items-center gap-1 rounded-full bg-white/70 px-2 py-1">
              <BellRing className="h-3 w-3 text-[#5f7974]" />
              <span className="truncate">{dateLabel}</span>
            </span>
            <span className="inline-flex min-w-0 shrink-0 items-center gap-1 rounded-full bg-white/70 px-2 py-1">
              <UserRound className="h-3 w-3 text-[#5f7974]" />
              <span className="truncate">{senderLabel}</span>
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-red-600 transition hover:bg-red-100 hover:text-red-700"
          aria-label={deleteLabel}
          title={deleteLabel}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}




