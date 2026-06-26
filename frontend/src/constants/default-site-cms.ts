import type { SiteCms } from "@/types/site-cms";

export const defaultSiteCms: SiteCms = {
  brandName: "MedRecord",
  brandSubtitle: "Accurate Records, Better Care",
  logoImageUrl: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=200&q=80",
  faviconUrl: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=64&q=80",
  themeMode: "sage",
  heroImageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=2200&q=88",
  heroImageAlt: "Dokter dan pasien di ruang klinik modern",
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
  doctorImageAlt: "Tim dokter klinik sedang bersiap melayani pasien",
  landingStats: [
    { value: "24/7", label: "Portal aktif" },
    { value: "6+", label: "Role operasional" },
    { value: "Realtime", label: "Antrian & notifikasi" }
  ],
  informationEyebrow: "Informasi",
  ctaEyebrow: "Mulai sekarang",
  ctaTitle: "Masuk atau daftar sebagai pasien baru.",
  ctaPrimaryLabel: "Login",
  ctaPrimaryHref: "/login",
  ctaSecondaryLabel: "Register Pasien",
  ctaSecondaryHref: "/login/register",
  informationPageTitle: "Informasi Klinik",
  informationPageContent: "Klinik menyediakan layanan pendaftaran, pemeriksaan, resep, farmasi, kasir, dan portal pasien terintegrasi.",
  announcementBanner: "Pendaftaran pasien baru dapat dilakukan melalui portal pasien.",
  seoTitle: "MedRecord - Medical Record and Patient Portal",
  seoDescription: "MedRecord adalah web app rekam medis modern untuk pendaftaran pasien, antrian, rekam medis, resep, farmasi, pembayaran, dan portal pasien.",
  seoKeywords: "klinik, rekam medis, portal pasien, antrian klinik",
  footerDescription: "MedRecord membantu klinik mengelola pelayanan pasien, antrian, farmasi, pembayaran, dan laporan operasional secara akurat.",
  footerAddress: "Cibinong, poesing, Indonesia",
  footerPhone: "+62 123-444-555",
  footerEmail: "info@medrecord.local",
  footerContactTitle: "Kontak",
  patientCodePrefix: "PS",
  patientCodeSequenceLength: 4,
  visitPrefix: "V",
  visitSequenceLength: 4,
  invoicePrefix: "INV",
  invoiceSequenceLength: 6,
  socialLinks: [
    { label: "Instagram", href: "https://www.instagram.com/medrecord", icon: "Instagram" },
    { label: "Facebook", href: "https://www.facebook.com/medrecord", icon: "Facebook" },
    { label: "Twitter", href: "https://twitter.com/medrecord", icon: "Twitter" },
    { label: "LinkedIn", href: "https://www.linkedin.com/company/medrecord", icon: "Linkedin" },
    { label: "YouTube", href: "https://www.youtube.com/@medrecord", icon: "Youtube" }
  ],
  navLinks: [
    { label: "Home", href: "#home" },
    { label: "Services", href: "#services" },
    { label: "Departments", href: "#departments" },
    { label: "Doctors", href: "#doctors" },
    { label: "Contact", href: "#contact" }
  ],
  footerSubscribeTitle: "Subscribe",
  footerSubscribeSubtitle: "Info klinik terbaru",
  footerSubscribeDescription: "Dapatkan informasi layanan, edukasi kesehatan, dan pengumuman klinik langsung dari MedRecord.",
  footerEmailPlaceholder: "Tulis email",
  footerSubmitLabel: "Kirim email",
  footerColumns: [
    {
      title: "Tentang",
      links: [
        { label: "Klinik", href: "/#home" },
        { label: "Departemen", href: "/#departments" },
        { label: "Kontak", href: "/#contact" }
      ]
    },
    {
      title: "Menu",
      links: [
        { label: "Beranda", href: "/" },
        { label: "Login", href: "/login" },
        { label: "Daftar Pasien", href: "/login/register" }
      ]
    },
    {
      title: "Layanan",
      links: [
        { label: "Informasi Layanan", href: "/#services" },
        { label: "Portal Pasien", href: "/patient-portal" },
        { label: "Pendaftaran Pasien", href: "/login/register" }
      ]
    }
  ],
  footerBottomLinks: [
    { label: "Privacy Policy", href: "/#contact" },
    { label: "Layanan", href: "/#services" },
    { label: "Informasi Klinik", href: "/#departments" }
  ],
  footerCopyrightText: "All rights reserved."
};
