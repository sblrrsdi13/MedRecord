"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Language = "id" | "en";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultValue?: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("id");

  useEffect(() => {
    const saved = localStorage.getItem("language") as Language | null;
    if (saved) {
      setLanguageState(saved);
      document.documentElement.lang = saved;
    } else {
      document.documentElement.lang = "id";
    }
  }, []);

  function setLanguage(lang: Language) {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
    document.documentElement.lang = lang;
  }

  function t(key: string, defaultValue: string = key): string {
    return translations[language][key] || defaultValue;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}

const translations: Record<Language, Record<string, string>> = {
  id: {
    // Topbar
    "system.title": "MedRecord",
    "system.subtitle": "Operasional klinik hari ini",
    "notification.title": "Notifikasi",
    "notification.unread": "belum dibaca",
    "notification.empty": "Belum ada notifikasi.",
    "notification.clear": "Bersihkan",
    "notification.delete": "Hapus",

    // Language toggle
    "language.bahasa": "Bahasa Indonesia",
    "language.english": "English",
    "language.switch": "Ubah Bahasa",

    // Sidebar
    "sidebar.dashboard": "Dashboard",
    "sidebar.patient_portal": "Portal Pasien",
    "sidebar.users": "User & Role",
    "sidebar.register": "Register User",
    "sidebar.backup": "Backup & Recovery",
    "sidebar.monitoring": "Monitoring",
    "sidebar.security": "Keamanan",
    "sidebar.patients": "Data Pasien",
    "sidebar.doctors": "Dokter",
    "sidebar.medicines": "Obat",
    "sidebar.polyclinics": "Poli",
    "sidebar.visits": "Kunjungan",
    "sidebar.queues": "Antrian",
    "sidebar.vital_signs": "Vital Sign",
    "sidebar.medical_records": "Rekam Medis",
    "sidebar.prescriptions": "Resep",
    "sidebar.payments": "Pembayaran",
    "sidebar.notifications": "Notifikasi",
    "sidebar.announcements": "Pengumuman",
    "sidebar.reports": "Laporan",
    "sidebar.audit_logs": "Audit Logs",
    "sidebar.settings": "Pengaturan",
    "sidebar.profile": "Profil",
    "sidebar.logout": "Logout",
    "sidebar.close_menu": "Tutup menu",

    // Common buttons
    "button.save": "Simpan",
    "button.reset": "Reset",
    "button.cancel": "Batal",
    "button.delete": "Hapus",
    "button.add": "Tambah",
    "button.edit": "Edit",
    "button.search": "Cari",
    "button.filter": "Filter",
    "button.clear": "Bersihkan",

    // Patient portal
    "patient.loading": "Memuat portal pasien...",
    "patient.not_linked": "Akun pasien belum terhubung.",
    "patient.not_linked_desc": "Admin atau receptionist perlu menghubungkan akun user pasien ke data pasien.",
    "patient.portal_title": "Portal Pasien",
    "patient.portal_subtitle": "Akses data kesehatan pribadi",
    "patient.portal_active": "Portal aktif",
    "patient.role": "Pasien",
    "patient.tabs.home": "Beranda",
    "patient.tabs.visits": "Kunjungan",
    "patient.tabs.records": "Rekam Medis",
    "patient.tabs.prescriptions": "Resep",
    "patient.tabs.payments": "Pembayaran",
    "patient.tabs_short.home": "Home",
    "patient.tabs_short.visits": "Riwayat",
    "patient.tabs_short.records": "Medis",
    "patient.tabs_short.prescriptions": "Resep",
    "patient.tabs_short.payments": "Bayar",
    "patient.profile_detail": "Detail Profil",
    "patient.profile_menu": "Menu profile pasien",
    "patient.close_profile_menu": "Tutup menu profile",
    "patient.close_notifications": "Tutup notifikasi",
    "patient.view_profile": "Lihat Profil",
    "patient.account_settings": "Setting Akun",
    "patient.medical_record_no": "No. RM",
    "patient.gender_male": "Laki-laki",
    "patient.gender_female": "Perempuan",
    "patient.gender": "Jenis Kelamin",
    "patient.phone": "Telepon",
    "patient.address": "Alamat",
    "patient.allergy": "Alergi",
    "patient.blood_type": "Gol. Darah",
    "patient.metrics.visits": "Kunjungan",
    "patient.metrics.records": "Rekam Medis",
    "patient.metrics.prescriptions": "Resep",
    "patient.home_welcome": "Selamat datang di Portal Pasien",
    "patient.home_desc": "Lihat informasi klinik, edukasi kesehatan, riwayat kunjungan, resep, dan invoice Anda dari satu tempat.",
    "patient.no_announcements": "Belum ada informasi atau edukasi terbaru dari klinik.",
    "patient.your_summary": "Ringkasan Anda",
    "patient.consult_title": "Punya Pertanyaan Medis?",
    "patient.consult_desc": "Hubungi klinik untuk konsultasi atau jadwal pemeriksaan lanjutan.",
    "patient.start_consult": "Mulai Konsultasi",
    "patient.next_schedule": "Jadwal Selanjutnya",
    "patient.no_schedule": "Belum ada kunjungan terjadwal",
    "patient.empty_visits": "Belum ada kunjungan.",
    "patient.empty_records": "Belum ada rekam medis.",
    "patient.empty_prescriptions": "Belum ada resep.",
    "patient.empty_payments": "Belum ada pembayaran.",
    "patient.no_complaint": "Tanpa keluhan",
    "patient.doctor": "Dokter",
    "patient.no_treatment_notes": "Tidak ada catatan tindakan.",
    "patient.official_invoice": "Invoice Resmi",
    "patient.total_bill": "Total tagihan",
    "patient.paid_amount": "Sudah dibayar",
    "patient.remaining": "Sisa",
    "patient.pay_online": "Bayar Online",
    "patient.pay_at_cashier": "Bayar di Kasir",
    "patient.settings_desc": "Kelola profil dan keamanan akun pasien.",
    "patient.close_settings": "Tutup setting",
    "patient.account": "Akun pasien",
    "patient.account_profile": "Profil Akun",
    "patient.full_name": "Nama lengkap",
    "patient.login_email": "Email login",
    "patient.phone_number": "Nomor telepon",
    "patient.save_profile": "Simpan Profil",
    "patient.change_password": "Ganti Password",
    "patient.current_password": "Password lama",
    "patient.new_password": "Password baru",
    "patient.confirm_new_password": "Konfirmasi password baru",

    // Footer
    "footer.subscribe": "Subscribe",
    "footer.subscribe_short": "Info klinik terbaru",
    "footer.subscribe_desc": "Dapatkan informasi layanan, edukasi kesehatan, dan pengumuman klinik langsung dari MedRecord.",
    "footer.email_placeholder": "Tulis email",
    "footer.submit_email": "Kirim email",
    "footer.brand": "MedRecord",
    "footer.tagline": "Accurate Records, Better Care",
    "footer.description": "MedRecord membantu klinik mengelola pelayanan pasien, antrian, farmasi, pembayaran, dan laporan operasional secara akurat.",
    "footer.about": "Tentang",
    "footer.company": "Klinik",
    "footer.announcements": "Pengumuman",
    "footer.reports": "Laporan",
    "footer.menu": "Menu",
    "footer.patients": "Pasien",
    "footer.queues": "Antrian",
    "footer.services": "Layanan",
    "footer.registration": "Pendaftaran",
    "footer.medical_records": "Rekam Medis",
    "footer.payments": "Pembayaran",
    "footer.contact": "Kontak",
    "footer.address": "Jl. Sehat No. 10, Bandung, Jawa Barat",
    "footer.privacy": "Privacy Policy",
    "footer.history": "Riwayat Aktivitas",
    "footer.what_we_do": "Informasi Klinik",
    "footer.copyright": "All rights reserved.",
  },
  en: {
    // Topbar
    "system.title": "MedRecord",
    "system.subtitle": "Clinic Operations Today",
    "notification.title": "Notifications",
    "notification.unread": "unread",
    "notification.empty": "No notifications yet.",
    "notification.clear": "Clear All",
    "notification.delete": "Delete",

    // Language toggle
    "language.bahasa": "Indonesian",
    "language.english": "English",
    "language.switch": "Change Language",

    // Sidebar
    "sidebar.dashboard": "Dashboard",
    "sidebar.patient_portal": "Patient Portal",
    "sidebar.users": "User & Role",
    "sidebar.register": "Register User",
    "sidebar.backup": "Backup & Recovery",
    "sidebar.monitoring": "Monitoring",
    "sidebar.security": "Security",
    "sidebar.patients": "Patients",
    "sidebar.doctors": "Doctors",
    "sidebar.medicines": "Medicines",
    "sidebar.polyclinics": "Polyclinics",
    "sidebar.visits": "Visits",
    "sidebar.queues": "Queues",
    "sidebar.vital_signs": "Vital Signs",
    "sidebar.medical_records": "Medical Records",
    "sidebar.prescriptions": "Prescriptions",
    "sidebar.payments": "Payments",
    "sidebar.notifications": "Notifications",
    "sidebar.announcements": "Announcements",
    "sidebar.reports": "Reports",
    "sidebar.audit_logs": "Audit Logs",
    "sidebar.settings": "Settings",
    "sidebar.profile": "Profile",
    "sidebar.logout": "Logout",
    "sidebar.close_menu": "Close menu",

    // Common buttons
    "button.save": "Save",
    "button.reset": "Reset",
    "button.cancel": "Cancel",
    "button.delete": "Delete",
    "button.add": "Add",
    "button.edit": "Edit",
    "button.search": "Search",
    "button.filter": "Filter",
    "button.clear": "Clear",

    // Patient portal
    "patient.loading": "Loading patient portal...",
    "patient.not_linked": "Patient account is not linked yet.",
    "patient.not_linked_desc": "Admin or receptionist needs to link this user account to a patient record.",
    "patient.portal_title": "Patient Portal",
    "patient.portal_subtitle": "Access your personal health information",
    "patient.portal_active": "Portal active",
    "patient.role": "Patient",
    "patient.tabs.home": "Home",
    "patient.tabs.visits": "Visits",
    "patient.tabs.records": "Medical Records",
    "patient.tabs.prescriptions": "Prescriptions",
    "patient.tabs.payments": "Payments",
    "patient.tabs_short.home": "Home",
    "patient.tabs_short.visits": "History",
    "patient.tabs_short.records": "Records",
    "patient.tabs_short.prescriptions": "Rx",
    "patient.tabs_short.payments": "Pay",
    "patient.profile_detail": "Profile Details",
    "patient.profile_menu": "Patient profile menu",
    "patient.close_profile_menu": "Close profile menu",
    "patient.close_notifications": "Close notifications",
    "patient.view_profile": "View Profile",
    "patient.account_settings": "Account Settings",
    "patient.medical_record_no": "MR No.",
    "patient.gender_male": "Male",
    "patient.gender_female": "Female",
    "patient.gender": "Gender",
    "patient.phone": "Phone",
    "patient.address": "Address",
    "patient.allergy": "Allergy",
    "patient.blood_type": "Blood Type",
    "patient.metrics.visits": "Visits",
    "patient.metrics.records": "Medical Records",
    "patient.metrics.prescriptions": "Prescriptions",
    "patient.home_welcome": "Welcome to Patient Portal",
    "patient.home_desc": "View clinic information, health education, visit history, prescriptions, and invoices in one place.",
    "patient.no_announcements": "No new clinic information or health education yet.",
    "patient.your_summary": "Your Summary",
    "patient.consult_title": "Have a Medical Question?",
    "patient.consult_desc": "Contact the clinic for consultation or follow-up examination schedule.",
    "patient.start_consult": "Start Consultation",
    "patient.next_schedule": "Next Schedule",
    "patient.no_schedule": "No scheduled visits yet",
    "patient.empty_visits": "No visits yet.",
    "patient.empty_records": "No medical records yet.",
    "patient.empty_prescriptions": "No prescriptions yet.",
    "patient.empty_payments": "No payments yet.",
    "patient.no_complaint": "No complaint",
    "patient.doctor": "Doctor",
    "patient.no_treatment_notes": "No treatment notes.",
    "patient.official_invoice": "Official Invoice",
    "patient.total_bill": "Total bill",
    "patient.paid_amount": "Paid amount",
    "patient.remaining": "Remaining",
    "patient.pay_online": "Pay Online",
    "patient.pay_at_cashier": "Pay at Cashier",
    "patient.settings_desc": "Manage patient account profile and security.",
    "patient.close_settings": "Close settings",
    "patient.account": "Patient account",
    "patient.account_profile": "Account Profile",
    "patient.full_name": "Full name",
    "patient.login_email": "Login email",
    "patient.phone_number": "Phone number",
    "patient.save_profile": "Save Profile",
    "patient.change_password": "Change Password",
    "patient.current_password": "Current password",
    "patient.new_password": "New password",
    "patient.confirm_new_password": "Confirm new password",

    // Footer
    "footer.subscribe": "Subscribe",
    "footer.subscribe_short": "Latest clinic info",
    "footer.subscribe_desc": "Get service updates, health education, and clinic announcements directly from MedRecord.",
    "footer.email_placeholder": "Write email",
    "footer.submit_email": "Submit email",
    "footer.brand": "MedRecord",
    "footer.tagline": "Accurate Records, Better Care",
    "footer.description": "A modern clinic medical record system for patient care, queues, pharmacy, payments, and operational reports.",
    "footer.about": "About",
    "footer.company": "Clinic",
    "footer.announcements": "Announcements",
    "footer.reports": "Reports",
    "footer.menu": "Menu",
    "footer.patients": "Patients",
    "footer.queues": "Queues",
    "footer.services": "Services",
    "footer.registration": "Registration",
    "footer.medical_records": "Medical Records",
    "footer.payments": "Payments",
    "footer.contact": "Contact",
    "footer.address": "Jl. Sehat No. 10, Bandung, West Java",
    "footer.privacy": "Privacy Policy",
    "footer.history": "Activity History",
    "footer.what_we_do": "Clinic Info",
    "footer.copyright": "All rights reserved.",
  },
};



