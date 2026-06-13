"use client";

import { Bell, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { NotificationCard, notificationSenderBadge } from "@/components/ui/notification-card";
import { MobileSidebar } from "@/components/shared/app-sidebar";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { useLanguage } from "@/contexts/language-context";
import { clearNotifications, deleteNotification, getNotifications, markNotificationRead, type NotificationItem } from "@/services/notification-service";
import { useAuthStore } from "@/store/auth-store";

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

export function Topbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const userId = useAuthStore((state) => state.user?.id);
  const { t } = useLanguage();

  useEffect(() => {
    getNotifications().then(setNotifications).catch(() => setNotifications([]));
  }, []);

  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    let socket: Socket | null = null;

    import("socket.io-client")
      .then(({ io }) => {
        if (!mounted) return;
        socket = io(socketUrl, { withCredentials: true, transports: ["websocket"] });
        socket.on("notification:new", (payload: { recipientId: string; notification: NotificationItem }) => {
          if (payload.recipientId !== userId) return;
          setNotifications((items) => [payload.notification, ...items.filter((item) => item.id !== payload.notification.id)].slice(0, 30));
        });
        socket.on("notification:deleted", (payload: { recipientId: string; id: string }) => {
          if (payload.recipientId === userId) setNotifications((items) => items.filter((item) => item.id !== payload.id));
        });
        socket.on("notification:cleared", (payload: { recipientId: string }) => {
          if (payload.recipientId === userId) setNotifications([]);
        });
      })
      .catch(() => null);

    return () => {
      mounted = false;
      socket?.disconnect();
    };
  }, [userId]);

  const unreadCount = notifications.filter((item) => !item.readAt).length;

  async function handleRead(notification: NotificationItem) {
    if (!notification.readAt) {
      await markNotificationRead(notification.id).catch(() => null);
      setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item));
    }
  }

  async function handleDelete(notification: NotificationItem) {
    await deleteNotification(notification.id).catch(() => null);
    setNotifications((items) => items.filter((item) => item.id !== notification.id));
  }

  async function handleClear() {
    await clearNotifications().catch(() => null);
    setNotifications([]);
  }

  return (
    <>
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#c7c1b5]/70 bg-[#faf8ef]/78 px-4 shadow-[0_12px_28px_rgba(46,57,57,.08)] backdrop-blur-xl md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Button variant="outline" size="icon" aria-label="Buka menu" className="shrink-0 md:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#2a3234]">{t("system.title")}</p>
            <p className="truncate text-xs text-[#6a746f]">{t("system.subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Button variant="ghost" size="icon" aria-label={t("notification.title")} className="relative rounded-full transition hover:bg-[#e6efe5]" onClick={() => setNotificationOpen((open) => !open)}>
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{unreadCount}</span>}
            </Button>
            {notificationOpen && (
              <>
                <button className="fixed inset-0 z-40 cursor-default" aria-label="Tutup notifikasi" onClick={() => setNotificationOpen(false)} />
                <div className="soft-panel absolute right-0 z-50 mt-3 w-80 overflow-hidden rounded-2xl animate-in">
                  <div className="border-b border-[#c7c1b5]/70 bg-[#e6efe5]/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#2a3234]">{t("notification.title")}</p>
                        <p className="text-xs text-[#6a746f]">{unreadCount} {t("notification.unread")}</p>
                      </div>
                      {notifications.length > 0 && (
                        <button type="button" onClick={handleClear} className="text-xs font-semibold text-[#5f7974] hover:underline">
                          {t("notification.clear")}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto p-2">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm text-[#6a746f]">{t("notification.empty")}</p>
                    ) : (
                      <div className="grid gap-2">
                        {notifications.map((item) => (
                          <NotificationCard
                            key={item.id}
                            item={item}
                            dateLabel={new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(item.createdAt))}
                            senderLabel={notificationSenderBadge(item.sender?.role).label}
                            onRead={() => handleRead(item)}
                            onDelete={() => handleDelete(item)}
                            deleteLabel={t("notification.delete")}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="h-6 w-px bg-[#c7c1b5]" />
          <LanguageToggle />
        </div>
      </header>
    </>
  );
}



