import { z } from "zod";

export const autoBackupSchema = z.object({
  enabled: z.boolean(),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  runAt: z.string().regex(/^\d{2}:\d{2}$/),
  retentionDays: z.number().int().min(1).max(365)
});

export const securityPolicySchema = z.object({
  minPasswordLength: z.number().int().min(8).max(32),
  requireUppercase: z.boolean(),
  requireNumber: z.boolean(),
  requireSymbol: z.boolean(),
  sessionTimeoutMinutes: z.number().int().min(5).max(1440),
  whitelistIps: z.array(z.string().min(1).max(80)).max(50),
  twoFactorEnabled: z.boolean(),
  dataEncryptionEnabled: z.boolean(),
  patientDataAccessPolicy: z.string().min(10).max(1200)
});

export const defaultAutoBackup = {
  enabled: false,
  frequency: "daily" as const,
  runAt: "23:00",
  retentionDays: 14
};

export const defaultSecurityPolicy = {
  minPasswordLength: 8,
  requireUppercase: true,
  requireNumber: true,
  requireSymbol: false,
  sessionTimeoutMinutes: 120,
  whitelistIps: [],
  twoFactorEnabled: false,
  dataEncryptionEnabled: true,
  patientDataAccessPolicy: "Pasien hanya dapat mengakses data miliknya sendiri. Data medis operasional hanya boleh diakses oleh petugas klinik yang sedang menangani pelayanan."
};

export type AutoBackupPolicy = z.infer<typeof autoBackupSchema>;
export type SecurityPolicy = z.infer<typeof securityPolicySchema>;
