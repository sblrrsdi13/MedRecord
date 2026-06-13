import { Router } from "express";
import { RoleName } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { emitCmsEvent } from "../../socket/socket.js";
import { ok } from "../../utils/api-response.js";

export const settingsRoutes = Router();

const CMS_KEY = "site_cms";

const linkSchema = z.object({
  label: z.string().min(1).max(80),
  href: z.string().min(1).max(500)
});

const departmentSchema = z.object({
  title: z.string().min(1).max(120),
  desc: z.string().min(1).max(280),
  icon: z.string().min(1).max(40).default("Stethoscope")
});

const imageSourceSchema = z.string().min(1).max(5_500_000).refine(
  (value) => value.startsWith("https://") || value.startsWith("http://") || /^data:image\/(png|jpeg|jpg|webp);base64,/.test(value),
  "Image must be an http(s) URL or a png/jpeg/webp data URL"
);

const serviceSchema = z.object({
  title: z.string().min(1).max(120),
  desc: z.string().min(1).max(320),
  image: imageSourceSchema
});

const socialSchema = z.object({
  label: z.string().min(1).max(80),
  href: z.string().url().max(1000),
  icon: z.string().min(1).max(40).default("Instagram")
});

const cmsSchema = z.object({
  brandName: z.string().min(1).max(120),
  brandSubtitle: z.string().min(1).max(120),
  logoText: z.string().min(1).max(12).default("LOGO"),
  logoImageUrl: imageSourceSchema,
  faviconUrl: imageSourceSchema,
  themeMode: z.enum(["sage", "warm", "contrast"]).default("sage"),
  heroImageUrl: imageSourceSchema,
  heroBadge: z.string().min(1).max(120),
  heroTitle: z.string().min(1).max(160),
  heroDescription: z.string().min(1).max(500),
  primaryCtaLabel: z.string().min(1).max(80),
  primaryCtaHref: z.string().min(1).max(500),
  secondaryCtaLabel: z.string().min(1).max(80),
  secondaryCtaHref: z.string().min(1).max(500),
  departmentsTitle: z.string().min(1).max(160),
  departmentsEyebrow: z.string().min(1).max(80),
  departments: z.array(departmentSchema).min(1).max(8),
  servicesTitle: z.string().min(1).max(160),
  servicesEyebrow: z.string().min(1).max(80),
  servicesBadge: z.string().min(1).max(80),
  services: z.array(serviceSchema).min(1).max(8),
  doctorSectionEyebrow: z.string().min(1).max(80),
  doctorSectionTitle: z.string().min(1).max(160),
  doctorSectionDescription: z.string().min(1).max(500),
  doctorImageUrl: imageSourceSchema,
  ctaEyebrow: z.string().min(1).max(80),
  ctaTitle: z.string().min(1).max(160),
  informationPageTitle: z.string().min(1).max(160),
  informationPageContent: z.string().min(1).max(1200),
  announcementBanner: z.string().min(1).max(250),
  seoTitle: z.string().min(1).max(160),
  seoDescription: z.string().min(1).max(300),
  seoKeywords: z.string().min(1).max(300),
  footerDescription: z.string().min(1).max(500),
  footerAddress: z.string().min(1).max(250),
  footerPhone: z.string().min(1).max(80),
  footerEmail: z.string().email().max(160),
  patientCodePrefix: z.string().min(1).max(12).regex(/^[A-Z0-9]+$/),
  patientCodeSequenceLength: z.coerce.number().int().min(3).max(10),
  visitPrefix: z.string().min(1).max(12).regex(/^[A-Z0-9]+$/),
  visitSequenceLength: z.coerce.number().int().min(3).max(10),
  invoicePrefix: z.string().min(1).max(12).regex(/^[A-Z0-9]+$/),
  invoiceSequenceLength: z.coerce.number().int().min(3).max(10),
  socialLinks: z.array(socialSchema).min(1).max(8),
  navLinks: z.array(linkSchema).min(1).max(8)
});

export type SiteCms = z.infer<typeof cmsSchema>;

const defaultCms: SiteCms = {
  brandName: "Klinik Utama",
  brandSubtitle: "Medical Portal",
  logoText: "KU",
  logoImageUrl: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=200&q=80",
  faviconUrl: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=64&q=80",
  themeMode: "sage",
  heroImageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=2200&q=88",
  heroBadge: "Aman, cepat, terintegrasi",
  heroTitle: "Your Health, Our Priority",
  heroDescription: "Platform rekam medis modern untuk klinik: pendaftaran pasien, antrian realtime, rekam medis, resep, farmasi, kasir, dan portal pasien.",
  primaryCtaLabel: "Register",
  primaryCtaHref: "/login/register",
  secondaryCtaLabel: "Lihat Layanan",
  secondaryCtaHref: "#services",
  departmentsEyebrow: "Our Departments",
  departmentsTitle: "Pelayanan klinik yang terhubung",
  departments: [
    { title: "IGD & Emergency", desc: "Respons cepat untuk kondisi darurat.", icon: "Ambulance" },
    { title: "Poli Anak", desc: "Pelayanan ramah untuk tumbuh kembang anak.", icon: "Baby" },
    { title: "Poli Umum", desc: "Konsultasi, diagnosis, dan tindak lanjut.", icon: "Stethoscope" }
  ],
  servicesEyebrow: "Featured Services",
  servicesTitle: "Semua alur klinik dalam satu sistem",
  servicesBadge: "Production-ready",
  services: [
    {
      title: "Advanced Diagnostics",
      desc: "Pemeriksaan klinis dan penunjang dengan alur data terintegrasi.",
      image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80"
    },
    {
      title: "Digital Medical Records",
      desc: "Riwayat pasien, resep, invoice, dan laporan operasional dalam satu sistem.",
      image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80"
    },
    {
      title: "Realtime Queue System",
      desc: "Antrian poli, kasir, dan farmasi berjalan realtime dengan pemanggilan suara.",
      image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=900&q=80"
    }
  ],
  doctorSectionEyebrow: "Clinical Portal",
  doctorSectionTitle: "Dibangun untuk pasien dan operasional klinik",
  doctorSectionDescription: "Admin mengatur sistem, tim klinik menjalankan pendaftaran sampai pembayaran, dan pasien mendapat portal pribadi untuk melihat riwayat medis serta invoice.",
  doctorImageUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=900&q=85",
  ctaEyebrow: "Mulai sekarang",
  ctaTitle: "Masuk atau daftar sebagai pasien baru.",
  informationPageTitle: "Informasi Klinik",
  informationPageContent: "Klinik menyediakan layanan pendaftaran, pemeriksaan, resep, farmasi, kasir, dan portal pasien terintegrasi.",
  announcementBanner: "Pendaftaran pasien baru dapat dilakukan melalui portal pasien.",
  seoTitle: "Klinik Utama - Rekam Medis dan Portal Pasien",
  seoDescription: "Website klinik modern untuk pendaftaran pasien, antrian, rekam medis, resep, farmasi, pembayaran, dan portal pasien.",
  seoKeywords: "klinik, rekam medis, portal pasien, antrian klinik",
  footerDescription: "Sistem rekam medis klinik modern untuk pelayanan pasien, antrian, farmasi, pembayaran, dan laporan operasional.",
  footerAddress: "Jl. Sehat No. 10, Bandung, Jawa Barat",
  footerPhone: "+62 812-3456-7890",
  footerEmail: "info@klinikutama.local",
  patientCodePrefix: "PS",
  patientCodeSequenceLength: 4,
  visitPrefix: "V",
  visitSequenceLength: 4,
  invoicePrefix: "INV",
  invoiceSequenceLength: 6,
  socialLinks: [
    { label: "Instagram", href: "https://www.instagram.com/klinikutama", icon: "Instagram" },
    { label: "Facebook", href: "https://www.facebook.com/klinikutama", icon: "Facebook" },
    { label: "Twitter", href: "https://twitter.com/klinikutama", icon: "Twitter" },
    { label: "LinkedIn", href: "https://www.linkedin.com/company/klinikutama", icon: "Linkedin" },
    { label: "YouTube", href: "https://www.youtube.com/@klinikutama", icon: "Youtube" }
  ],
  navLinks: [
    { label: "Home", href: "#home" },
    { label: "Services", href: "#services" },
    { label: "Departments", href: "#departments" },
    { label: "Doctors", href: "#doctors" },
    { label: "Contact", href: "#contact" }
  ]
};

function normalizeCms(cms: SiteCms): SiteCms {
  const next = { ...cms };
  const legacyPrimaryLabel = next.primaryCtaLabel.trim().toLowerCase();

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

async function getCms() {
  await ensureSettingsTable();
  const rows = await prisma.$queryRawUnsafe<Array<{ value: unknown }>>(
    `SELECT value FROM site_settings WHERE key = $1 LIMIT 1`,
    CMS_KEY
  );

  if (!rows[0]?.value) return normalizeCms(defaultCms);
  return normalizeCms(cmsSchema.parse({ ...defaultCms, ...(rows[0].value as Record<string, unknown>) }));
}

settingsRoutes.get("/public", async (_req, res) => {
  return ok(res, await getCms());
});

settingsRoutes.use(authenticate, authorize([RoleName.ADMIN]));

settingsRoutes.get("/", async (_req, res) => {
  return ok(res, {
    clinicName: "Klinik Utama",
    timezone: "Asia/Jakarta",
    queueVoiceLanguage: "id-ID",
    medicalRecordPrefix: "RM"
  });
});

settingsRoutes.get("/cms", async (_req, res) => {
  return ok(res, await getCms());
});

settingsRoutes.get("/monitoring", async (_req, res) => {
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
  return ok(res, {
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
  });
});

settingsRoutes.put("/cms", async (req, res) => {
  const payload = cmsSchema.parse(req.body);
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

  emitCmsEvent({ settings: payload });
  return ok(res, payload, "CMS settings saved");
});
