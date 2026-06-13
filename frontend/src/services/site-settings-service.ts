import { api } from "@/services/api";
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



