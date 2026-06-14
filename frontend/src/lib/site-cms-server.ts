import { cache } from "react";
import { defaultSiteCms } from "@/constants/default-site-cms";
import type { SiteCms } from "@/types/site-cms";

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export const getServerSiteCms = cache(async (): Promise<SiteCms> => {
  try {
    const response = await fetch(`${apiUrl}/settings/public`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2500)
    });

    if (!response.ok) return defaultSiteCms;

    const payload = (await response.json()) as ApiResponse<Partial<SiteCms>>;
    return { ...defaultSiteCms, ...payload.data };
  } catch {
    return defaultSiteCms;
  }
});
