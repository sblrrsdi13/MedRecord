"use client";

import { useEffect, useSyncExternalStore } from "react";
import { defaultSiteCms } from "@/constants/default-site-cms";
import { getPublicSiteSettings } from "@/services/site-settings-service";
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

function notifyCmsSubscribers() {
  subscribers.forEach((listener) => listener());
}

function setCurrentCms(settings: Partial<SiteCms>) {
  currentCms = mergeCms(settings);
  writeCachedCms(currentCms);
  notifyCmsSubscribers();
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

export function useSiteCms(enabled = true, realtime = true) {
  const cms = useSyncExternalStore(subscribe, getSnapshot, () => defaultSiteCms);

  useEffect(() => {
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
  }, [enabled, realtime]);

  return cms;
}



