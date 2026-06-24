import { cache } from "react";
import { defaultSiteCms } from "@/constants/default-site-cms";
import type { SiteCms } from "@/types/site-cms";

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

function normalizeLegacyText(value: string) {
  return value
    .replace(/klinik utama/gi, "MedRecord")
    .replace(/klinikutama/gi, "medrecord");
}

function normalizeLegacyValues<T>(value: T): T {
  if (typeof value === "string") return normalizeLegacyText(value) as T;
  if (Array.isArray(value)) return value.map((item) => normalizeLegacyValues(item)) as T;
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, normalizeLegacyValues(entry)])
  ) as T;
}

function normalizeServerCms(settings: Partial<SiteCms>): SiteCms {
  const next = normalizeLegacyValues({ ...defaultSiteCms, ...settings });

  if (next.brandSubtitle.trim().toLowerCase() === "medical portal") {
    next.brandSubtitle = "Accurate Records, Better Care";
  }

  return next;
}

export const getServerSiteCms = cache(async (): Promise<SiteCms> => {
  try {
    const response = await fetch(`${apiUrl}/settings/public`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2500)
    });

    if (!response.ok) return defaultSiteCms;

    const payload = (await response.json()) as ApiResponse<Partial<SiteCms>>;
    return normalizeServerCms(payload.data);
  } catch {
    return defaultSiteCms;
  }
});
