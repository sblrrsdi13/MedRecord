"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { defaultSiteCms } from "@/constants/default-site-cms";
import { getPublicSiteSettings } from "@/features/settings/services/site-settings-service";
import type { SiteCms } from "@/types/site-cms";

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";
const cmsCacheKey = "clinic_site_cms_cache";
type CmsSocket = {
  disconnect: () => void;
  on: (event: "cms:updated", listener: (payload: { settings: SiteCms }) => void) => void;
};

let currentCms = defaultSiteCms;
let hasReadCache = false;
let hasFetchedCms = false;
let fetchPromise: Promise<void> | null = null;
let cmsSocket: CmsSocket | null = null;
let socketLoading = false;
let realtimeSubscriberCount = 0;
const subscribers = new Set<() => void>();

function mergeCms(settings: Partial<SiteCms>) {
  const next = { ...defaultSiteCms, ...settings };

  if (next.brandName.trim().toLowerCase() === "klinik utama") {
    next.brandName = "MedRecord";
  }

  if (next.brandSubtitle.trim().toLowerCase() === "medical portal") {
    next.brandSubtitle = "Accurate Records, Better Care";
  }

  if (next.footerEmail === "info@medrecord.local") {
    next.footerEmail = "info@medrecord.local";
  }

  next.socialLinks = next.socialLinks.map((link) => ({
    ...link,
    href: link.href.replace(/klinikutama/gi, "medrecord")
  }));

  return next;
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

function notifyCmsSubscribers() {
  subscribers.forEach((listener) => listener());
}

function setCurrentCms(settings: Partial<SiteCms>) {
  currentCms = mergeCms(settings);
  writeCachedCms(currentCms);
  notifyCmsSubscribers();
}

export function primeSiteCms(settings: Partial<SiteCms>) {
  currentCms = mergeCms(settings);
  hasReadCache = true;
}

function ensureCachedCmsRead() {
  if (hasReadCache) return;
  hasReadCache = true;
  currentCms = readCachedCms();
}

function subscribe(listener: () => void) {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
}

function getSnapshot() {
  ensureCachedCmsRead();
  return currentCms;
}

function ensureCmsFetch() {
  if (hasFetchedCms || fetchPromise) return;

  fetchPromise = getPublicSiteSettings()
    .then((settings) => {
      hasFetchedCms = true;
      setCurrentCms(settings);
    })
    .catch(() => {
      currentCms = readCachedCms();
      notifyCmsSubscribers();
    })
    .finally(() => {
      fetchPromise = null;
    });
}

function startCmsRealtime() {
  realtimeSubscriberCount += 1;
  if (cmsSocket || socketLoading) return;

  socketLoading = true;
  import("socket.io-client")
    .then(({ io }) => {
      socketLoading = false;
      if (realtimeSubscriberCount <= 0) return;
      cmsSocket = io(socketUrl, { withCredentials: true, transports: ["websocket"] });
      cmsSocket.on("cms:updated", (payload: { settings: SiteCms }) => {
        setCurrentCms(payload.settings);
      });
    })
    .catch(() => {
      socketLoading = false;
    });
}

function stopCmsRealtime() {
  realtimeSubscriberCount = Math.max(0, realtimeSubscriberCount - 1);
  if (realtimeSubscriberCount === 0) {
    cmsSocket?.disconnect();
    cmsSocket = null;
  }
}

export function useSiteCms(enabled = true, realtime = true, initialCms?: Partial<SiteCms>) {
  const initialSnapshot = useMemo(
    () => (initialCms ? mergeCms(initialCms) : currentCms),
    [initialCms]
  );

  const cms = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => initialSnapshot
  );

  useEffect(() => {
    if (initialCms) primeSiteCms(initialCms);
    if (!enabled) return;
    let idleId: number | null = null;
    let didStartRealtime = false;
    const win = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    ensureCmsFetch();

    const connectRealtime = () => {
      if (!realtime) return;
      didStartRealtime = true;
      startCmsRealtime();
    };

    if (realtime) {
      if (win.requestIdleCallback) {
        idleId = win.requestIdleCallback(connectRealtime, { timeout: 2500 });
      } else {
        idleId = win.setTimeout(connectRealtime, 1200);
      }
    }

    return () => {
      if (idleId !== null) {
        if (win.cancelIdleCallback) win.cancelIdleCallback(idleId);
        else win.clearTimeout(idleId);
      }
      if (didStartRealtime) stopCmsRealtime();
    };
  }, [enabled, realtime, initialCms]);

  return cms;
}



