"use client";

import { useEffect, useState } from "react";
import { defaultSiteCms } from "@/constants/default-site-cms";
import { getPublicSiteSettings } from "@/services/site-settings-service";
import type { SiteCms } from "@/types/site-cms";

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";
const cmsCacheKey = "clinic_site_cms_cache";

function mergeCms(settings: Partial<SiteCms>) {
  return { ...defaultSiteCms, ...settings };
}

function readCachedCms() {
  if (typeof window === "undefined") return defaultSiteCms;
  try {
    const cached = window.localStorage.getItem(cmsCacheKey);
    return cached ? mergeCms(JSON.parse(cached) as Partial<SiteCms>) : defaultSiteCms;
  } catch {
    return defaultSiteCms;
  }
}

function writeCachedCms(settings: SiteCms) {
  try {
    window.localStorage.setItem(cmsCacheKey, JSON.stringify(settings));
  } catch {
    // Ignore storage quota/private mode errors.
  }
}

export function useSiteCms(enabled = true, realtime = true) {
  const [cms, setCms] = useState<SiteCms>(() => readCachedCms());

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
    let socket: { disconnect: () => void; on: (event: string, listener: (payload: { settings: SiteCms }) => void) => void } | null = null;
    let idleId: number | null = null;
    const win = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    getPublicSiteSettings()
      .then((settings) => {
        if (!mounted) return;
        const nextCms = mergeCms(settings);
        setCms(nextCms);
        writeCachedCms(nextCms);
      })
      .catch(() => {
        if (mounted) setCms(readCachedCms());
      });

    const connectRealtime = () => {
      if (!realtime) return;
      import("socket.io-client")
        .then(({ io }) => {
          if (!mounted) return;
          socket = io(socketUrl, { withCredentials: true, transports: ["websocket"] });
          socket.on("cms:updated", (payload: { settings: SiteCms }) => {
            const nextCms = mergeCms(payload.settings);
            setCms(nextCms);
            writeCachedCms(nextCms);
          });
        })
        .catch(() => null);
    };

    if (realtime) {
      if (win.requestIdleCallback) {
        idleId = win.requestIdleCallback(connectRealtime, { timeout: 2500 });
      } else {
        idleId = win.setTimeout(connectRealtime, 1200);
      }
    }

    return () => {
      mounted = false;
      if (idleId !== null) {
        if (win.cancelIdleCallback) win.cancelIdleCallback(idleId);
        else win.clearTimeout(idleId);
      }
      socket?.disconnect();
    };
  }, [enabled, realtime]);

  return cms;
}



