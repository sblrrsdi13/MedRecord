import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import type { ApiResponse } from "@/types/api";
import type { SiteCms } from "@/types/site-cms";

export async function getPublicSiteSettings() {
  const response = await api.get<ApiResponse<SiteCms>>("/settings/public");
  return response.data.data;
}

export async function getSiteCmsSettings() {
  const response = await api.get<ApiResponse<SiteCms>>("/settings/cms");
  return response.data.data;
}

export async function updateSiteCmsSettings(payload: SiteCms) {
  const response = await api.put<ApiResponse<SiteCms>>("/settings/cms", payload);
  return response.data.data;
}

const imageUploadLimits = {
  logo: { width: 512, height: 512, quality: 0.86 },
  favicon: { width: 256, height: 256, quality: 0.86 },
  hero: { width: 1920, height: 1080, quality: 0.82 },
  doctor: { width: 1280, height: 900, quality: 0.82 }
} as const;

async function compressCmsImage(file: File, purpose: keyof typeof imageUploadLimits) {
  if (file.type === "image/svg+xml" || !file.type.startsWith("image/")) return file;
  if (typeof window === "undefined" || typeof createImageBitmap === "undefined") return file;

  const limit = imageUploadLimits[purpose];
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, limit.width / bitmap.width, limit.height / bitmap.height);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return file;

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", limit.quality);
  });
  if (!blob || blob.size >= file.size) return file;

  return new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
    type: "image/webp",
    lastModified: Date.now()
  });
}

export async function uploadCmsImage(file: File, purpose: "logo" | "favicon" | "hero" | "doctor") {
  const optimizedFile = await compressCmsImage(file, purpose);
  const formData = new FormData();
  formData.append("file", optimizedFile);
  formData.append("purpose", purpose);

  const token = useAuthStore.getState().accessToken;
  const response = await fetch("/api/cms/upload", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData
  });

  const payload = (await response.json()) as ApiResponse<{ url: string }>;
  if (!response.ok || !payload.data?.url) {
    throw new Error(payload.message || "Upload gambar gagal.");
  }

  return payload.data.url;
}

export type AdminMonitoring = {
  website: {
    brandName: string;
    navLinks: number;
    departments: number;
    services: number;
    socialLinks: number;
    cmsUpdatedAt: string | null;
  };
  users: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    patientUsers: number;
  };
  content: {
    activeAnnouncements: number;
    totalAnnouncements: number;
  };
  system: {
    apiStatus: string;
    databaseStatus: string;
    serverTime: string;
    auditToday: number;
  };
  recentAuditLogs: Array<{
    id: string;
    action: string;
    resource: string;
    resourceId?: string;
    createdAt: string;
    user?: { name: string; email: string } | null;
  }>;
};

export async function getAdminMonitoring() {
  const response = await api.get<ApiResponse<AdminMonitoring>>("/settings/monitoring");
  return response.data.data;
}



