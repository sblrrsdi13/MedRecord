"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AlertTriangle, Eye, Save, Settings, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { defaultSiteCms } from "@/constants/default-site-cms";
import { getSiteCmsSettings, updateSiteCmsSettings, uploadCmsImage } from "@/features/settings/services/site-settings-service";
import type { SiteCms } from "@/types/site-cms";

type CmsArrayKey = "navLinks" | "departments" | "services" | "socialLinks" | "landingStats" | "footerColumns" | "footerBottomLinks";
type CmsImageKey = "logoImageUrl" | "faviconUrl" | "heroImageUrl" | "doctorImageUrl";

const arrayHints: Record<CmsArrayKey, string> = {
  navLinks: `[{"label":"Home","href":"#home"}]`,
  departments: `[{"title":"Poli Umum","desc":"Konsultasi umum","icon":"Stethoscope"}]`,
  services: `[{"title":"Digital Medical Records","desc":"Riwayat pasien terintegrasi","image":"https://..."}]`,
  socialLinks: `[{"label":"Instagram","href":"https://instagram.com/...","icon":"Instagram"}]`,
  landingStats: `[{"value":"24/7","label":"Portal aktif"}]`,
  footerColumns: `[{"title":"Menu","links":[{"label":"Beranda","href":"/"}]}]`,
  footerBottomLinks: `[{"label":"Privacy Policy","href":"/#contact"}]`
};

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const imagePurposeByKey: Record<CmsImageKey, "logo" | "favicon" | "hero" | "doctor"> = {
  logoImageUrl: "logo",
  faviconUrl: "favicon",
  heroImageUrl: "hero",
  doctorImageUrl: "doctor"
};
const advancedJsonKeys: CmsArrayKey[] = ["navLinks", "departments", "socialLinks", "footerColumns", "footerBottomLinks"];

function stringify(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default function SettingsPage() {
  const [cms, setCms] = useState<SiteCms>(defaultSiteCms);
  const [jsonFields, setJsonFields] = useState<Record<CmsArrayKey, string>>({
    navLinks: stringify(defaultSiteCms.navLinks),
    departments: stringify(defaultSiteCms.departments),
    services: stringify(defaultSiteCms.services),
    socialLinks: stringify(defaultSiteCms.socialLinks),
    landingStats: stringify(defaultSiteCms.landingStats),
    footerColumns: stringify(defaultSiteCms.footerColumns),
    footerBottomLinks: stringify(defaultSiteCms.footerBottomLinks)
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<CmsImageKey | null>(null);
  const [uploadingServiceIndex, setUploadingServiceIndex] = useState<number | null>(null);

  useEffect(() => {
    getSiteCmsSettings()
      .then((settings) => {
        const next = { ...defaultSiteCms, ...settings };
        setCms(next);
        setJsonFields({
          navLinks: stringify(next.navLinks),
          departments: stringify(next.departments),
          services: stringify(next.services),
          socialLinks: stringify(next.socialLinks),
          landingStats: stringify(next.landingStats),
          footerColumns: stringify(next.footerColumns),
          footerBottomLinks: stringify(next.footerBottomLinks)
        });
      })
      .catch(() => setError("Gagal memuat konfigurasi CMS. Pastikan login sebagai Admin."));
  }, []);

  const preview = useMemo(() => {
    const next = { ...cms };
    (Object.keys(jsonFields) as CmsArrayKey[]).forEach((key) => {
      try {
        next[key] = JSON.parse(jsonFields[key]);
      } catch {
        // Preview keeps last valid array while the admin is typing invalid JSON.
      }
    });
    return next;
  }, [cms, jsonFields]);

  function updateField<K extends keyof SiteCms>(key: K, value: SiteCms[K]) {
    setCms((current) => ({ ...current, [key]: value }));
    setMessage(null);
    setError(null);
  }

  function updateArrayField(key: CmsArrayKey, value: SiteCms[CmsArrayKey]) {
    setCms((current) => ({ ...current, [key]: value }));
    setJsonFields((current) => ({ ...current, [key]: stringify(value) }));
    setMessage(null);
    setError(null);
  }

  function updateCodePrefix(key: "patientCodePrefix" | "visitPrefix" | "invoicePrefix", value: string) {
    updateField(key, value.toUpperCase().replace(/[^A-Z0-9]/g, "") as SiteCms[typeof key]);
  }

  async function handleImageUpload(key: CmsImageKey, file?: File) {
    if (!file) return;
    setMessage(null);
    setError(null);

    if (!["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(file.type)) {
      setError("File harus berupa gambar PNG, JPG, WebP, atau SVG.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Ukuran gambar maksimal 2MB. Kompres gambar terlebih dahulu agar website tetap cepat.");
      return;
    }

    try {
      setUploadingField(key);
      const url = await uploadCmsImage(file, imagePurposeByKey[key]);
      updateField(key, url as SiteCms[typeof key]);
      setMessage("Gambar berhasil di-upload ke Vercel Blob. Klik Simpan CMS untuk memakai perubahan ini.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal upload gambar ke Vercel Blob.");
    } finally {
      setUploadingField(null);
    }
  }

  async function handleServiceImageUpload(index: number, file?: File) {
    if (!file) return;
    setMessage(null);
    setError(null);

    if (!["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(file.type)) {
      setError("File harus berupa gambar PNG, JPG, WebP, atau SVG.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Ukuran gambar maksimal 2MB. Kompres gambar terlebih dahulu agar website tetap cepat.");
      return;
    }

    try {
      setUploadingServiceIndex(index);
      const url = await uploadCmsImage(file, "service");
      const nextServices = cms.services.map((service, serviceIndex) => (
        serviceIndex === index ? { ...service, image: url } : service
      ));
      updateArrayField("services", nextServices);
      setMessage("Gambar service berhasil di-upload. Klik Simpan CMS untuk memakai perubahan ini.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal upload gambar service ke Vercel Blob.");
    } finally {
      setUploadingServiceIndex(null);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const payload = { ...cms };
      (Object.keys(jsonFields) as CmsArrayKey[]).forEach((key) => {
        payload[key] = JSON.parse(jsonFields[key]);
      });
      const saved = await updateSiteCmsSettings(payload);
      setCms(saved);
      setMessage("Konfigurasi CMS berhasil disimpan dan akan tampil di landing page.");
    } catch (err) {
      setError("Gagal menyimpan. Periksa format JSON, URL gambar, email, dan pastikan akun Anda Admin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#5f7974]">Admin CMS</p>
          <h1 className="mt-2 text-3xl font-black text-[#2a3234]">Website Content Management</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6a746f]">
            Atur nama klinik, logo teks, hero landing page, layanan, kontak, social media, dan footer. Preview di kanan akan berubah sebelum data disimpan.
          </p>
        </div>
        <Button type="button" onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Menyimpan..." : "Simpan CMS"}
        </Button>
      </div>

      {message && <p className="rounded-xl border border-[#c7c1b5] bg-[#e6efe5] p-3 text-sm text-[#5f7974]">{message}</p>}
      {error && (
        <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_520px]">
        <section className="space-y-5">
          <Panel title="Branding" icon={Settings}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nama Klinik"><Input value={cms.brandName} onChange={(event) => updateField("brandName", event.target.value)} /></Field>
              <Field label="Subtitle Brand"><Input value={cms.brandSubtitle} onChange={(event) => updateField("brandSubtitle", event.target.value)} /></Field>
              <Field label="Tema Website">
                <select className="h-10 rounded-lg border bg-white px-3 text-sm" value={cms.themeMode} onChange={(event) => updateField("themeMode", event.target.value as SiteCms["themeMode"])}>
                  <option value="sage">Sage Soft</option>
                  <option value="warm">Warm Cream</option>
                  <option value="contrast">High Contrast</option>
                </select>
              </Field>
              <ImageField
                label="Logo Image"
                value={cms.logoImageUrl}
                recommendation="Maks. 2MB. Rekomendasi 512 x 512 px, rasio 1:1, PNG/WebP transparan lebih baik."
                onTextChange={(value) => updateField("logoImageUrl", value)}
                onUpload={(file) => handleImageUpload("logoImageUrl", file)}
                uploading={uploadingField === "logoImageUrl"}
              />
              <ImageField
                label="Favicon"
                value={cms.faviconUrl}
                recommendation="Maks. 2MB. Rekomendasi 64 x 64 px atau 512 x 512 px, rasio 1:1."
                onTextChange={(value) => updateField("faviconUrl", value)}
                onUpload={(file) => handleImageUpload("faviconUrl", file)}
                uploading={uploadingField === "faviconUrl"}
              />
              <ImageField
                label="Hero Image"
                value={cms.heroImageUrl}
                recommendation="Maks. 2MB. Rekomendasi 2200 x 1200 px atau rasio 16:9, area penting jangan terlalu gelap."
                onTextChange={(value) => updateField("heroImageUrl", value)}
                onUpload={(file) => handleImageUpload("heroImageUrl", file)}
                uploading={uploadingField === "heroImageUrl"}
              />
            </div>
          </Panel>

          <Panel title="Landing Hero" icon={Eye}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Judul Hero"><Input value={cms.heroTitle} onChange={(event) => updateField("heroTitle", event.target.value)} /></Field>
              <Field label="Alt Text Hero Image" wide><Input value={cms.heroImageAlt} onChange={(event) => updateField("heroImageAlt", event.target.value)} /></Field>
              <Field label="Tombol Utama"><Input value={cms.primaryCtaLabel} onChange={(event) => updateField("primaryCtaLabel", event.target.value)} /></Field>
              <Field label="Link Tombol Utama"><Input value={cms.primaryCtaHref} onChange={(event) => updateField("primaryCtaHref", event.target.value)} /></Field>
              <Field label="Tombol Kedua"><Input value={cms.secondaryCtaLabel} onChange={(event) => updateField("secondaryCtaLabel", event.target.value)} /></Field>
              <Field label="Link Tombol Kedua"><Input value={cms.secondaryCtaHref} onChange={(event) => updateField("secondaryCtaHref", event.target.value)} /></Field>
              <Field label="Deskripsi Hero" wide>
                <textarea className="min-h-24 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#5f7974]/20" value={cms.heroDescription} onChange={(event) => updateField("heroDescription", event.target.value)} />
              </Field>
            </div>
            <div className="mt-5">
              <LandingStatsEditor
                stats={cms.landingStats}
                onChange={(landingStats) => updateArrayField("landingStats", landingStats)}
              />
            </div>
          </Panel>

          <Panel title="Format Nomor Otomatis" icon={Settings}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Prefix ID Pasien">
                <Input value={cms.patientCodePrefix} onChange={(event) => updateCodePrefix("patientCodePrefix", event.target.value)} />
              </Field>
              <Field label="Digit Urutan ID Pasien">
                <Input type="number" min={3} max={10} value={cms.patientCodeSequenceLength} onChange={(event) => updateField("patientCodeSequenceLength", Number(event.target.value))} />
              </Field>
              <Field label="Prefix No. Kunjungan">
                <Input value={cms.visitPrefix} onChange={(event) => updateCodePrefix("visitPrefix", event.target.value)} />
              </Field>
              <Field label="Digit Urutan Kunjungan">
                <Input type="number" min={3} max={10} value={cms.visitSequenceLength} onChange={(event) => updateField("visitSequenceLength", Number(event.target.value))} />
              </Field>
              <Field label="Prefix Invoice">
                <Input value={cms.invoicePrefix} onChange={(event) => updateCodePrefix("invoicePrefix", event.target.value)} />
              </Field>
              <Field label="Digit Urutan Invoice">
                <Input type="number" min={3} max={10} value={cms.invoiceSequenceLength} onChange={(event) => updateField("invoiceSequenceLength", Number(event.target.value))} />
              </Field>
              <div className="md:col-span-2 rounded-xl border border-[#d7d2c8] bg-[#f4f2eb] p-4 text-sm text-[#5f6f69]">
                <p className="font-bold text-[#2a3234]">Preview format</p>
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  <NumberPreview label="ID Pasien" value={previewNumber(cms.patientCodePrefix, String(new Date().getFullYear()), cms.patientCodeSequenceLength)} />
                  <NumberPreview label="No. Kunjungan" value={previewNumber(cms.visitPrefix, `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}`, cms.visitSequenceLength)} />
                  <NumberPreview label="Invoice" value={previewNumber(cms.invoicePrefix, String(new Date().getFullYear()), cms.invoiceSequenceLength)} />
                </div>
                <p className="mt-3 text-xs leading-5">
                  Prefix hanya menerima huruf kapital dan angka. Perubahan format hanya berlaku untuk data baru agar nomor lama tetap aman.
                </p>
              </div>
            </div>
          </Panel>

          <Panel title="Section & Footer" icon={Settings}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Department Eyebrow"><Input value={cms.departmentsEyebrow} onChange={(event) => updateField("departmentsEyebrow", event.target.value)} /></Field>
              <Field label="Department Title"><Input value={cms.departmentsTitle} onChange={(event) => updateField("departmentsTitle", event.target.value)} /></Field>
              <Field label="Services Eyebrow"><Input value={cms.servicesEyebrow} onChange={(event) => updateField("servicesEyebrow", event.target.value)} /></Field>
              <Field label="Services Title"><Input value={cms.servicesTitle} onChange={(event) => updateField("servicesTitle", event.target.value)} /></Field>
              <Field label="Services Badge"><Input value={cms.servicesBadge} onChange={(event) => updateField("servicesBadge", event.target.value)} /></Field>
              <ImageField
                label="Doctor Image"
                value={cms.doctorImageUrl}
                recommendation="Maks. 2MB. Rekomendasi 900 x 650 px atau rasio 4:3, gunakan foto klinik/dokter yang terang."
                onTextChange={(value) => updateField("doctorImageUrl", value)}
                onUpload={(file) => handleImageUpload("doctorImageUrl", file)}
                uploading={uploadingField === "doctorImageUrl"}
              />
              <Field label="Doctor Eyebrow"><Input value={cms.doctorSectionEyebrow} onChange={(event) => updateField("doctorSectionEyebrow", event.target.value)} /></Field>
              <Field label="Doctor Title"><Input value={cms.doctorSectionTitle} onChange={(event) => updateField("doctorSectionTitle", event.target.value)} /></Field>
              <Field label="Doctor Image Alt"><Input value={cms.doctorImageAlt} onChange={(event) => updateField("doctorImageAlt", event.target.value)} /></Field>
              <Field label="Doctor Description" wide>
                <textarea className="min-h-24 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#5f7974]/20" value={cms.doctorSectionDescription} onChange={(event) => updateField("doctorSectionDescription", event.target.value)} />
              </Field>
              <Field label="Information Eyebrow"><Input value={cms.informationEyebrow} onChange={(event) => updateField("informationEyebrow", event.target.value)} /></Field>
              <Field label="CTA Eyebrow"><Input value={cms.ctaEyebrow} onChange={(event) => updateField("ctaEyebrow", event.target.value)} /></Field>
              <Field label="CTA Title"><Input value={cms.ctaTitle} onChange={(event) => updateField("ctaTitle", event.target.value)} /></Field>
              <Field label="CTA Button Utama"><Input value={cms.ctaPrimaryLabel} onChange={(event) => updateField("ctaPrimaryLabel", event.target.value)} /></Field>
              <Field label="CTA Link Utama"><Input value={cms.ctaPrimaryHref} onChange={(event) => updateField("ctaPrimaryHref", event.target.value)} /></Field>
              <Field label="CTA Button Kedua"><Input value={cms.ctaSecondaryLabel} onChange={(event) => updateField("ctaSecondaryLabel", event.target.value)} /></Field>
              <Field label="CTA Link Kedua"><Input value={cms.ctaSecondaryHref} onChange={(event) => updateField("ctaSecondaryHref", event.target.value)} /></Field>
              <Field label="Banner Pengumuman" wide><Input value={cms.announcementBanner} onChange={(event) => updateField("announcementBanner", event.target.value)} /></Field>
              <Field label="Judul Halaman Informasi"><Input value={cms.informationPageTitle} onChange={(event) => updateField("informationPageTitle", event.target.value)} /></Field>
              <Field label="SEO Title"><Input value={cms.seoTitle} onChange={(event) => updateField("seoTitle", event.target.value)} /></Field>
              <Field label="Halaman Informasi" wide>
                <textarea className="min-h-24 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#5f7974]/20" value={cms.informationPageContent} onChange={(event) => updateField("informationPageContent", event.target.value)} />
              </Field>
              <Field label="SEO Description" wide>
                <textarea className="min-h-20 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#5f7974]/20" value={cms.seoDescription} onChange={(event) => updateField("seoDescription", event.target.value)} />
              </Field>
              <Field label="SEO Keywords" wide><Input value={cms.seoKeywords} onChange={(event) => updateField("seoKeywords", event.target.value)} /></Field>
              <Field label="Footer Phone"><Input value={cms.footerPhone} onChange={(event) => updateField("footerPhone", event.target.value)} /></Field>
              <Field label="Footer Email"><Input value={cms.footerEmail} onChange={(event) => updateField("footerEmail", event.target.value)} /></Field>
              <Field label="Footer Contact Title"><Input value={cms.footerContactTitle} onChange={(event) => updateField("footerContactTitle", event.target.value)} /></Field>
              <Field label="Footer Subscribe Title"><Input value={cms.footerSubscribeTitle} onChange={(event) => updateField("footerSubscribeTitle", event.target.value)} /></Field>
              <Field label="Footer Subscribe Subtitle"><Input value={cms.footerSubscribeSubtitle} onChange={(event) => updateField("footerSubscribeSubtitle", event.target.value)} /></Field>
              <Field label="Footer Email Placeholder"><Input value={cms.footerEmailPlaceholder} onChange={(event) => updateField("footerEmailPlaceholder", event.target.value)} /></Field>
              <Field label="Footer Submit Label"><Input value={cms.footerSubmitLabel} onChange={(event) => updateField("footerSubmitLabel", event.target.value)} /></Field>
              <Field label="Footer Address" wide><Input value={cms.footerAddress} onChange={(event) => updateField("footerAddress", event.target.value)} /></Field>
              <Field label="Footer Description" wide>
                <textarea className="min-h-24 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#5f7974]/20" value={cms.footerDescription} onChange={(event) => updateField("footerDescription", event.target.value)} />
              </Field>
              <Field label="Footer Subscribe Description" wide>
                <textarea className="min-h-20 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#5f7974]/20" value={cms.footerSubscribeDescription} onChange={(event) => updateField("footerSubscribeDescription", event.target.value)} />
              </Field>
              <Field label="Footer Copyright Text" wide><Input value={cms.footerCopyrightText} onChange={(event) => updateField("footerCopyrightText", event.target.value)} /></Field>
            </div>
          </Panel>

          <Panel title="Konten Layanan Landing" icon={Settings}>
            <ServiceEditor
              services={cms.services}
              uploadingIndex={uploadingServiceIndex}
              onChange={(services) => updateArrayField("services", services)}
              onUpload={handleServiceImageUpload}
            />
          </Panel>

          <Panel title="Data JSON Dinamis Lanjutan" icon={Settings}>
            <p className="mb-4 text-sm leading-6 text-[#6a746f]">
              Dipakai untuk konten berulang yang strukturnya fleksibel seperti menu, departemen, social media, dan kolom footer.
              Service dan statistik sudah punya editor visual di atas.
            </p>
            <div className="grid gap-4">
              {advancedJsonKeys.map((key) => (
                <Field key={key} label={`${key} (JSON)`} wide>
                  <textarea
                    className="min-h-40 w-full rounded-lg border bg-stone-950 px-3 py-2 font-mono text-xs text-stone-100 outline-none focus:ring-2 focus:ring-[#5f7974]/20"
                    value={jsonFields[key]}
                    placeholder={arrayHints[key]}
                    onChange={(event) => setJsonFields((current) => ({ ...current, [key]: event.target.value }))}
                  />
                </Field>
              ))}
            </div>
          </Panel>
        </section>

        <aside className="xl:sticky xl:top-20 xl:self-start">
          <Preview cms={preview} />
        </aside>
      </div>
    </div>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#c7c1b5] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-[#5f7974]" />
        <h2 className="font-bold text-[#2a3234]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function previewNumber(prefix: string, datePart: string, length: number) {
  return `${prefix || "-"}${datePart}${String(1).padStart(Math.max(Number(length) || 4, 1), "0")}`;
}

function NumberPreview({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#c7c1b5] bg-white px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#7e8178]">{label}</p>
      <p className="mt-1 font-mono text-sm font-bold text-[#2a3234]">{value}</p>
    </div>
  );
}

function LandingStatsEditor({
  stats,
  onChange
}: {
  stats: SiteCms["landingStats"];
  onChange: (stats: SiteCms["landingStats"]) => void;
}) {
  return (
    <div className="rounded-xl border border-[#c7c1b5] bg-[#faf8ef] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.06em] text-[#4a5657]">Landing Stats</p>
          <p className="mt-1 text-xs text-[#7a827e]">Maksimal 6 item, tampil di section dokter/operasional.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => onChange([...stats, { value: "0", label: "Label baru" }].slice(0, 6))}
          disabled={stats.length >= 6}
        >
          Tambah
        </Button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {stats.map((item, index) => (
          <div key={`${item.label}-${index}`} className="grid gap-2 rounded-xl border border-[#d7d2c8] bg-white p-3">
            <Input
              value={item.value}
              placeholder="Nilai"
              onChange={(event) => onChange(stats.map((stat, statIndex) => statIndex === index ? { ...stat, value: event.target.value } : stat))}
            />
            <Input
              value={item.label}
              placeholder="Label"
              onChange={(event) => onChange(stats.map((stat, statIndex) => statIndex === index ? { ...stat, label: event.target.value } : stat))}
            />
            <Button type="button" variant="outline" onClick={() => onChange(stats.filter((_, statIndex) => statIndex !== index))} disabled={stats.length <= 1}>
              Hapus
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServiceEditor({
  services,
  uploadingIndex,
  onChange,
  onUpload
}: {
  services: SiteCms["services"];
  uploadingIndex: number | null;
  onChange: (services: SiteCms["services"]) => void;
  onUpload: (index: number, file?: File) => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-bold text-[#2a3234]">Service Card</p>
          <p className="mt-1 text-xs leading-5 text-[#7a827e]">Konten ini tampil di landing page. Maks. 8 layanan, gambar rekomendasi 900 x 520 px, maks. 2MB.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => onChange([...services, { title: "Layanan Baru", desc: "Deskripsi layanan", image: defaultSiteCms.services[0]?.image ?? defaultSiteCms.heroImageUrl }].slice(0, 8))}
          disabled={services.length >= 8}
        >
          Tambah Service
        </Button>
      </div>
      {services.map((service, index) => (
        <div key={`${service.title}-${index}`} className="grid gap-4 rounded-2xl border border-[#c7c1b5] bg-[#faf8ef] p-4 md:grid-cols-[180px_1fr]">
          <div className="overflow-hidden rounded-xl border bg-white">
            <Image src={service.image} alt={service.title} width={360} height={220} className="h-36 w-full object-cover" />
          </div>
          <div className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Judul Service">
                <Input
                  value={service.title}
                  onChange={(event) => onChange(services.map((item, serviceIndex) => serviceIndex === index ? { ...item, title: event.target.value } : item))}
                />
              </Field>
              <Field label="URL Gambar Service">
                <Input
                  value={service.image}
                  onChange={(event) => onChange(services.map((item, serviceIndex) => serviceIndex === index ? { ...item, image: event.target.value } : item))}
                />
              </Field>
            </div>
            <Field label="Deskripsi Service" wide>
              <textarea
                className="min-h-20 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#5f7974]/20"
                value={service.desc}
                onChange={(event) => onChange(services.map((item, serviceIndex) => serviceIndex === index ? { ...item, desc: event.target.value } : item))}
              />
            </Field>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                disabled={uploadingIndex === index}
                onChange={(event) => onUpload(index, event.target.files?.[0])}
                className="block w-full rounded-lg border border-[#c7c1b5] bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#5f7974] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white disabled:cursor-not-allowed disabled:opacity-60 md:max-w-md"
              />
              <Button type="button" variant="outline" onClick={() => onChange(services.filter((_, serviceIndex) => serviceIndex !== index))} disabled={services.length <= 1}>
                Hapus
              </Button>
            </div>
            {uploadingIndex === index && <p className="text-xs text-[#5f7974]">Sedang upload gambar service...</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={wide ? "grid gap-2 md:col-span-2" : "grid gap-2"}>
      <span className="text-xs font-bold uppercase tracking-[0.06em] text-[#4a5657]">{label}</span>
      {children}
    </label>
  );
}

function ImageField({
  label,
  value,
  recommendation,
  onTextChange,
  onUpload,
  uploading
}: {
  label: string;
  value: string;
  recommendation: string;
  onTextChange: (value: string) => void;
  onUpload: (file?: File) => void;
  uploading?: boolean;
}) {
  const preview = value.startsWith("data:image") || value.startsWith("http") || value.startsWith("/");

  return (
    <div className="grid gap-2 md:col-span-2">
      <span className="text-xs font-bold uppercase tracking-[0.06em] text-[#4a5657]">{label}</span>
      <div className="grid gap-3 rounded-xl border border-[#c7c1b5] bg-[#faf8ef] p-3 md:grid-cols-[120px_1fr]">
        <div className="flex h-28 items-center justify-center overflow-hidden rounded-lg border bg-white">
          {preview ? (
            <Image src={value} alt={`${label} preview`} width={160} height={112} className="h-full w-full object-cover" />
          ) : (
            <span className="px-3 text-center text-xs text-[#7a827e]">Belum ada gambar</span>
          )}
        </div>
        <div className="grid gap-2">
          <Input value={value} onChange={(event) => onTextChange(event.target.value)} placeholder="https://... atau upload file gambar" />
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            disabled={uploading}
            onChange={(event) => onUpload(event.target.files?.[0])}
            className="block w-full rounded-lg border border-[#c7c1b5] bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#5f7974] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white disabled:cursor-not-allowed disabled:opacity-60"
          />
          <p className="text-xs leading-5 text-[#7a827e]">
            {uploading ? "Sedang upload ke Vercel Blob..." : "Bisa pakai link gambar atau upload PNG/JPG/WebP/SVG."} {recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}

function Preview({ cms }: { cms: SiteCms }) {
  return (
    <section className="max-h-[calc(100vh-7rem)] overflow-y-auto rounded-3xl border border-[#c7c1b5] bg-white shadow-xl [scrollbar-width:thin]">
      <div className="relative min-h-[560px] p-5">
        <Image src={cms.heroImageUrl} alt="Preview hero" fill sizes="420px" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/82 to-white/20" />
        <div className="relative z-10">
          <div className="flex items-center justify-between rounded-full bg-white/80 p-2 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden">
                <Image src={cms.logoImageUrl} alt={`${cms.brandName} logo`} width={36} height={36} className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-xs font-black uppercase text-[#5f7974]">{cms.brandName}</p>
                <p className="text-[10px] font-semibold uppercase text-[#6a746f]">{cms.brandSubtitle}</p>
              </div>
            </div>
            <span className="rounded-full bg-[#5f7974] px-3 py-2 text-xs font-bold text-white">{cms.primaryCtaLabel}</span>
          </div>

          <div className="pt-24">
            <h3 className="max-w-md text-4xl font-black leading-tight text-[#2a3234]">{cms.heroTitle}</h3>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#3f4a49]">{cms.heroDescription}</p>
          </div>
        </div>
      </div>
      <div className="grid gap-3 bg-[#faf8ef] p-4">
        <p className="text-xs font-bold uppercase text-[#5f7974]">Preview Sections</p>
        <p className="font-black">{cms.departmentsTitle}</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {cms.departments.slice(0, 3).map((item) => (
            <div key={item.title} className="rounded-xl border bg-white p-3">
              <p className="text-sm font-bold">{item.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-[#6a746f]">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="pt-4 font-black">{cms.servicesTitle}</p>
        <div className="grid gap-3">
          {cms.services.slice(0, 3).map((item) => (
            <div key={item.title} className="overflow-hidden rounded-xl border bg-white">
              <Image src={item.image} alt={item.title} width={420} height={112} className="h-28 w-full object-cover" />
              <div className="p-3">
                <p className="text-sm font-bold">{item.title}</p>
                <p className="mt-1 text-xs text-[#6a746f]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-xl border bg-white p-3">
          <Image src={cms.doctorImageUrl} alt="Preview dokter" width={420} height={128} className="h-32 w-full rounded-lg object-cover" />
          <p className="mt-3 text-xs font-bold uppercase text-[#5f7974]">{cms.doctorSectionEyebrow}</p>
          <p className="mt-1 font-black">{cms.doctorSectionTitle}</p>
          <p className="mt-2 text-xs leading-5 text-[#6a746f]">{cms.doctorSectionDescription}</p>
        </div>
        <div className="rounded-xl bg-[#5f7974] p-4 text-white">
          <p className="text-xs font-bold uppercase text-white/70">{cms.ctaEyebrow}</p>
          <p className="mt-1 font-black">{cms.ctaTitle}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs font-bold uppercase text-[#5f7974]">Banner</p>
          <p className="mt-1 text-sm font-semibold text-[#2a3234]">{cms.announcementBanner}</p>
          <p className="mt-3 text-xs font-bold uppercase text-[#5f7974]">Halaman Informasi</p>
          <p className="mt-1 font-black">{cms.informationPageTitle}</p>
          <p className="mt-2 text-xs leading-5 text-[#6a746f]">{cms.informationPageContent}</p>
          <p className="mt-3 text-xs text-[#7a827e]">SEO: {cms.seoTitle}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-2">
            <Image src={cms.logoImageUrl} alt={`${cms.brandName} logo`} width={40} height={40} className="h-10 w-10 object-contain" />
            <div>
              <p className="font-black">{cms.brandName}</p>
              <p className="text-xs text-[#6a746f]">{cms.brandSubtitle}</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#6a746f]">{cms.footerDescription}</p>
          <p className="mt-3 text-xs text-[#5f7974]">{cms.footerPhone} · {cms.footerEmail}</p>
          <p className="mt-1 text-xs text-[#6a746f]">{cms.footerAddress}</p>
        </div>
      </div>
    </section>
  );
}



