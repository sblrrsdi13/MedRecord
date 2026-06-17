import { z } from "zod";

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

export const cmsSchema = z.object({
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

export const defaultCms: SiteCms = {
  brandName: "MedRecord",
  brandSubtitle: "Accurate Records, Better Care",
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
  seoTitle: "MedRecord - Medical Record and Patient Portal",
  seoDescription: "MedRecord adalah web app rekam medis modern untuk pendaftaran pasien, antrian, rekam medis, resep, farmasi, pembayaran, dan portal pasien.",
  seoKeywords: "klinik, rekam medis, portal pasien, antrian klinik",
  footerDescription: "MedRecord membantu klinik mengelola pelayanan pasien, antrian, farmasi, pembayaran, dan laporan operasional secara akurat.",
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
