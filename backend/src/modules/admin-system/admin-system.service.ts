import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { prisma } from "../../config/prisma.js";
import { autoBackupSchema, defaultAutoBackup, defaultSecurityPolicy, securityPolicySchema, type AutoBackupPolicy, type SecurityPolicy } from "./admin-system.schema.js";

export const backupDir = path.join(process.cwd(), "storage", "backups");
export const uploadDir = path.join(process.cwd(), "storage", "uploads");

const autoBackupKey = "auto_backup_policy";
const securityPolicyKey = "security_policy";

async function ensureAdminSettingsTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function readSetting<T>(key: string, fallback: T) {
  await ensureAdminSettingsTable();
  const rows = await prisma.$queryRawUnsafe<Array<{ value: unknown }>>(
    `SELECT value FROM site_settings WHERE key = $1 LIMIT 1`,
    key
  );
  return { ...fallback, ...((rows[0]?.value as Record<string, unknown> | undefined) ?? {}) } as T;
}

async function writeSetting(key: string, value: unknown) {
  await ensureAdminSettingsTable();
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO site_settings (key, value, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    key,
    JSON.stringify(value)
  );
}

async function getDirectorySize(directory: string): Promise<number> {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const sizes = await Promise.all(entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return getDirectorySize(fullPath);
      const info = await stat(fullPath);
      return info.size;
    }));
    return sizes.reduce((total, size) => total + size, 0);
  } catch {
    return 0;
  }
}

function serializeRow(value: unknown): unknown {
  if (typeof value === "bigint") return Number(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serializeRow);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serializeRow(item)])
    );
  }
  return value;
}

async function collectBackupData() {
  const [
    roles,
    permissions,
    rolePermissions,
    users,
    patients,
    doctors,
    nurses,
    staff,
    polyclinics,
    doctorSchedules,
    visits,
    queues,
    vitalSigns,
    medicalRecords,
    prescriptions,
    prescriptionItems,
    medicines,
    medicineStockLogs,
    payments,
    paymentDetails,
    notifications,
    auditLogs,
    siteSettings,
    announcements
  ] = await Promise.all([
    prisma.role.findMany(),
    prisma.permission.findMany(),
    prisma.rolePermission.findMany(),
    prisma.user.findMany({ select: { id: true, name: true, email: true, phone: true, isActive: true, roleId: true, createdAt: true, updatedAt: true } }),
    prisma.patient.findMany(),
    prisma.doctor.findMany(),
    prisma.nurse.findMany(),
    prisma.staff.findMany(),
    prisma.polyclinic.findMany(),
    prisma.doctorSchedule.findMany(),
    prisma.visit.findMany(),
    prisma.queue.findMany(),
    prisma.vitalSign.findMany(),
    prisma.medicalRecord.findMany(),
    prisma.prescription.findMany(),
    prisma.prescriptionItem.findMany(),
    prisma.medicine.findMany(),
    prisma.medicineStockLog.findMany(),
    prisma.payment.findMany(),
    prisma.paymentDetail.findMany(),
    prisma.notification.findMany(),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.$queryRawUnsafe<Array<{ key: string; value: unknown; updated_at: Date }>>(`SELECT key, value, updated_at FROM site_settings`),
    prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`SELECT * FROM portal_announcements ORDER BY created_at DESC`)
      .catch(() => [])
  ]);

  return serializeRow({
    roles,
    permissions,
    rolePermissions,
    users,
    patients,
    doctors,
    nurses,
    staff,
    polyclinics,
    doctorSchedules,
    visits,
    queues,
    vitalSigns,
    medicalRecords,
    prescriptions,
    prescriptionItems,
    medicines,
    medicineStockLogs,
    payments,
    paymentDetails,
    notifications,
    auditLogs,
    siteSettings,
    announcements
  });
}

export async function listBackups() {
  await mkdir(backupDir, { recursive: true });
  const files = await readdir(backupDir);
  const backups = await Promise.all(
    files
      .filter((file) => file.endsWith(".json"))
      .map(async (file) => {
        const info = await stat(path.join(backupDir, file));
        return {
          file,
          size: info.size,
          createdAt: info.birthtime,
          updatedAt: info.mtime,
          type: file.includes("auto") ? "automatic" : "manual"
        };
      })
  );

  backups.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  const policy = await readSetting(autoBackupKey, defaultAutoBackup);
  return { backups, policy };
}

export async function createManualBackup(userId?: string) {
  await mkdir(backupDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = `manual-backup-${timestamp}.json`;
  const data = {
    metadata: {
      app: "clinic-emr",
      version: 1,
      type: "manual",
      createdAt: new Date().toISOString(),
      createdBy: userId ?? null
    },
    data: await collectBackupData()
  };

  await writeFile(path.join(backupDir, file), JSON.stringify(data, null, 2), "utf8");
  await prisma.auditLog.create({
    data: {
      userId,
      action: "CREATE_BACKUP",
      resource: "admin_system",
      resourceId: file,
      metadata: { file }
    }
  });

  return { file };
}

export async function getBackupFilePath(file: string) {
  const safeFile = path.basename(file);
  const filePath = path.join(backupDir, safeFile);
  await stat(filePath);
  return { safeFile, filePath };
}

export async function restoreBackup(file: string, userId?: string) {
  const safeFile = path.basename(file);
  const parsed = JSON.parse(await readFile(path.join(backupDir, safeFile), "utf8")) as {
    data?: { siteSettings?: Array<{ key: string; value: unknown }>; announcements?: Array<Record<string, unknown>> };
  };

  const siteSettings = parsed.data?.siteSettings ?? [];
  for (const row of siteSettings) {
    if (row.key) await writeSetting(row.key, row.value);
  }

  await prisma.auditLog.create({
    data: {
      userId,
      action: "RESTORE_BACKUP",
      resource: "admin_system",
      resourceId: safeFile,
      metadata: {
        file: safeFile,
        restored: "site_settings",
        note: "Restore full transactional data is intentionally not automatic to protect relational integrity."
      }
    }
  });

  return {
    file: safeFile,
    restored: ["site_settings"],
    note: "Restore aman saat ini mengembalikan konfigurasi CMS/security/backup policy. Restore data transaksi penuh sebaiknya dilakukan via migrasi database terkontrol."
  };
}

export async function getMonitoring() {
  const memory = process.memoryUsage();
  const dbSize = await prisma.$queryRawUnsafe<Array<{ size: bigint }>>(`SELECT pg_database_size(current_database())::bigint AS size`)
    .catch(() => [{ size: BigInt(0) }]);
  const recentErrors = await prisma.auditLog.findMany({
    where: { action: { contains: "ERROR", mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
    take: 10
  });
  const [pendingPrescriptions, readyPayments, unreadNotifications, backupStorage] = await Promise.all([
    prisma.prescription.count({ where: { status: { in: ["draft", "pending"] } } }),
    prisma.visit.count({ where: { status: "ready_to_pay" } }),
    prisma.notification.count({ where: { readAt: null } }),
    getDirectorySize(backupDir)
  ]);

  return {
    storage: {
      databaseBytes: Number(dbSize[0]?.size ?? 0),
      backupBytes: backupStorage,
      uploadBytes: await getDirectorySize(uploadDir)
    },
    resources: {
      cpuCores: os.cpus().length,
      loadAverage: os.loadavg(),
      memoryTotalBytes: os.totalmem(),
      memoryFreeBytes: os.freemem(),
      processRssBytes: memory.rss,
      processHeapUsedBytes: memory.heapUsed,
      processHeapTotalBytes: memory.heapTotal,
      processExternalBytes: memory.external,
      uptimeSeconds: process.uptime()
    },
    jobQueue: [
      { name: "Resep pending", pending: pendingPrescriptions, status: pendingPrescriptions > 0 ? "warning" : "ok" },
      { name: "Kunjungan siap bayar", pending: readyPayments, status: readyPayments > 0 ? "warning" : "ok" },
      { name: "Notifikasi belum dibaca", pending: unreadNotifications, status: unreadNotifications > 20 ? "warning" : "ok" },
      { name: "Backup otomatis", pending: 0, status: (await readSetting(autoBackupKey, defaultAutoBackup)).enabled ? "ok" : "disabled" }
    ],
    integrations: [
      { name: "Database PostgreSQL", status: "online", message: "Query monitoring berhasil." },
      { name: "Socket.IO Realtime", status: "online", message: "Realtime server aktif bersama API." },
      { name: "Email/SMS Gateway", status: "not_configured", message: "Belum dikonfigurasi di environment local." }
    ],
    recentErrors
  };
}

export async function getSecurityPolicy() {
  return securityPolicySchema.parse(await readSetting(securityPolicyKey, defaultSecurityPolicy));
}

export async function updateSecurityPolicy(userId: string | undefined, payload: SecurityPolicy) {
  await writeSetting(securityPolicyKey, payload);
  await prisma.auditLog.create({
    data: {
      userId,
      action: "UPDATE_SECURITY_POLICY",
      resource: "admin_system",
      metadata: payload
    }
  });
  return payload;
}

export async function updateAutoBackupPolicy(userId: string | undefined, payload: AutoBackupPolicy) {
  await writeSetting(autoBackupKey, payload);
  await prisma.auditLog.create({
    data: {
      userId,
      action: "UPDATE_AUTO_BACKUP_POLICY",
      resource: "admin_system",
      metadata: payload
    }
  });
  return payload;
}
