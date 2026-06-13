export type SiteLink = {
  label: string;
  href: string;
};

export type SiteDepartment = {
  title: string;
  desc: string;
  icon: string;
};

export type SiteService = {
  title: string;
  desc: string;
  image: string;
};

export type SiteSocialLink = {
  label: string;
  href: string;
  icon: string;
};

export type SiteCms = {
  brandName: string;
  brandSubtitle: string;
  logoImageUrl: string;
  faviconUrl: string;
  themeMode: "sage" | "warm" | "contrast";
  heroImageUrl: string;
  heroBadge: string;
  heroTitle: string;
  heroDescription: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  departmentsTitle: string;
  departmentsEyebrow: string;
  departments: SiteDepartment[];
  servicesTitle: string;
  servicesEyebrow: string;
  servicesBadge: string;
  services: SiteService[];
  doctorSectionEyebrow: string;
  doctorSectionTitle: string;
  doctorSectionDescription: string;
  doctorImageUrl: string;
  ctaEyebrow: string;
  ctaTitle: string;
  informationPageTitle: string;
  informationPageContent: string;
  announcementBanner: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  footerDescription: string;
  footerAddress: string;
  footerPhone: string;
  footerEmail: string;
  patientCodePrefix: string;
  patientCodeSequenceLength: number;
  visitPrefix: string;
  visitSequenceLength: number;
  invoicePrefix: string;
  invoiceSequenceLength: number;
  socialLinks: SiteSocialLink[];
  navLinks: SiteLink[];
};



