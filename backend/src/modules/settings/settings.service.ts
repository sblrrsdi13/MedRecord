import { RoleName } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { cmsSchema, defaultCms, type SiteCms } from "./settings.schema.js";

const CMS_KEY = "site_cms";

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

function normalizeCms(cms: SiteCms): SiteCms {
  const next = normalizeLegacyValues({ ...cms });
  const legacyPrimaryLabel = next.primaryCtaLabel.trim().toLowerCase();

  if (next.brandSubtitle.trim().toLowerCase() === "medical portal") {
    next.brandSubtitle = "Accurate Records, Better Care";
  }

  if (next.logoText === "KU") {
    next.logoText = "MR";
  }

  if (legacyPrimaryLabel === "masuk ke sistem" || legacyPrimaryLabel === "masuk sistem") {
    next.primaryCtaLabel = "Register";
    next.primaryCtaHref = "/login/register";
  }

  if (next.primaryCtaLabel.trim().toLowerCase() === "register" && next.primaryCtaHref === "/login") {
    next.primaryCtaHref = "/login/register";
  }

  return next;
}

async function ensureSettingsTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS portal_announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'info',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_by TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS portal_announcements_is_active_created_at_idx
    ON portal_announcements (is_active, created_at)
  `);
}

export async function getCms() {
  await ensureSettingsTable();
  const rows = await prisma.$queryRawUnsafe<Array<{ value: unknown }>>(
    `SELECT value FROM site_settings WHERE key = $1 LIMIT 1`,
    CMS_KEY
  );

  if (!rows[0]?.value) return normalizeCms(defaultCms);
  return normalizeCms(cmsSchema.parse({ ...defaultCms, ...(rows[0].value as Record<string, unknown>) }));
}

export function getLegacySettings() {
  return {
    clinicName: "MedRecord",
    timezone: "Asia/Jakarta",
    queueVoiceLanguage: "id-ID",
    medicalRecordPrefix: "RM"
  };
}

export async function getCmsMonitoring() {
  await ensureSettingsTable();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    cmsRows,
    totalUsers,
    activeUsers,
    patientUsers,
    activeAnnouncements,
    totalAnnouncements,
    auditToday,
    recentAuditLogs,
    dbTime
  ] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ updated_at: Date }>>(`SELECT updated_at FROM site_settings WHERE key = $1 LIMIT 1`, CMS_KEY),
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: { name: RoleName.PATIENT } } }),
    prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`SELECT COUNT(*)::bigint AS count FROM portal_announcements WHERE is_active = true`),
    prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`SELECT COUNT(*)::bigint AS count FROM portal_announcements`),
    prisma.auditLog.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.auditLog.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 8
    }),
    prisma.$queryRawUnsafe<Array<{ now: Date }>>(`SELECT NOW() AS now`)
  ]);

  const cms = await getCms();
  return {
    website: {
      brandName: cms.brandName,
      navLinks: cms.navLinks.length,
      departments: cms.departments.length,
      services: cms.services.length,
      socialLinks: cms.socialLinks.length,
      cmsUpdatedAt: cmsRows[0]?.updated_at ?? null
    },
    users: {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      patientUsers
    },
    content: {
      activeAnnouncements: Number(activeAnnouncements[0]?.count ?? 0),
      totalAnnouncements: Number(totalAnnouncements[0]?.count ?? 0)
    },
    system: {
      apiStatus: "online",
      databaseStatus: dbTime[0]?.now ? "online" : "unknown",
      serverTime: dbTime[0]?.now ?? new Date(),
      auditToday
    },
    recentAuditLogs
  };
}

export async function updateCms(payload: SiteCms) {
  await ensureSettingsTable();
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO site_settings (key, value, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    CMS_KEY,
    JSON.stringify(payload)
  );
  return payload;
}
