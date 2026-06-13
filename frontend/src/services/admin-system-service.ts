import { api } from "@/services/api";
import type { ApiResponse } from "@/types/api";

export type BackupPolicy = {
  enabled: boolean;
  frequency: "daily" | "weekly" | "monthly";
  runAt: string;
  retentionDays: number;
};

export type BackupItem = {
  file: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  type: "manual" | "automatic";
};

export type BackupResponse = {
  backups: BackupItem[];
  policy: BackupPolicy;
};

export type MonitoringResponse = {
  storage: {
    databaseBytes: number;
    backupBytes: number;
    uploadBytes: number;
  };
  resources: {
    cpuCores: number;
    loadAverage: number[];
    memoryTotalBytes: number;
    memoryFreeBytes: number;
    processRssBytes: number;
    processHeapUsedBytes: number;
    uptimeSeconds: number;
  };
  jobQueue: Array<{ name: string; pending: number; status: string }>;
  integrations: Array<{ name: string; status: string; message: string }>;
  recentErrors: Array<{ id: string; action: string; resource: string; createdAt: string; metadata?: unknown }>;
};

export type SecurityPolicy = {
  minPasswordLength: number;
  requireUppercase: boolean;
  requireNumber: boolean;
  requireSymbol: boolean;
  sessionTimeoutMinutes: number;
  whitelistIps: string[];
  twoFactorEnabled: boolean;
  dataEncryptionEnabled: boolean;
  patientDataAccessPolicy: string;
};

export async function getBackups() {
  const response = await api.get<ApiResponse<BackupResponse>>("/admin-system/backups");
  return response.data.data;
}

export async function createManualBackup() {
  const response = await api.post<ApiResponse<{ file: string }>>("/admin-system/backups/manual");
  return response.data.data;
}

export async function restoreBackup(file: string) {
  const response = await api.post<ApiResponse<{ file: string; restored: string[]; note: string }>>(`/admin-system/backups/${encodeURIComponent(file)}/restore`);
  return response.data.data;
}

export async function updateAutoBackupPolicy(payload: BackupPolicy) {
  const response = await api.put<ApiResponse<BackupPolicy>>("/admin-system/auto-backup", payload);
  return response.data.data;
}

export function getBackupDownloadUrl(file: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
  return `${baseUrl}/admin-system/backups/${encodeURIComponent(file)}/download`;
}

export async function downloadBackup(file: string) {
  const response = await api.get(`/admin-system/backups/${encodeURIComponent(file)}/download`, { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function getSystemMonitoring() {
  const response = await api.get<ApiResponse<MonitoringResponse>>("/admin-system/monitoring");
  return response.data.data;
}

export async function getSecurityPolicy() {
  const response = await api.get<ApiResponse<SecurityPolicy>>("/admin-system/security-policy");
  return response.data.data;
}

export async function updateSecurityPolicy(payload: SecurityPolicy) {
  const response = await api.put<ApiResponse<SecurityPolicy>>("/admin-system/security-policy", payload);
  return response.data.data;
}
