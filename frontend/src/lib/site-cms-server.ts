import { cache } from "react";
import { defaultSiteCms } from "@/constants/default-site-cms";
import type { SiteCms } from "@/types/site-cms";

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

function normalizeServerCms(settings: Partial<SiteCms>): SiteCms {
  const next = { ...defaultSiteCms, ...settings };

  if (next.brandName.trim().toLowerCase() === "klinik utama") {
    next.brandName = "MedRecord";
  }

  if (next.brandSubtitle.trim().toLowerCase() === "medical portal") {
    next.brandSubtitle = "Accurate Records, Better Care";
  }

  if (next.footerEmail === "info@klinikutama.local") {
    next.footerEmail = "info@medrecord.local";
  }

  if (/klinik utama/i.test(next.seoTitle)) {
    next.seoTitle = next.seoTitle.replace(/klinik utama/gi, "MedRecord");
  }

  if (/klinik utama/i.test(next.seoDescription)) {
    next.seoDescription = next.seoDescription.replace(/klinik utama/gi, "MedRecord");
  }

  next.socialLinks = next.socialLinks.map((link) => ({
    ...link,
    href: link.href.replace(/klinikutama/gi, "medrecord")
  }));

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
