"use client";

import { useEffect, useState } from "react";
import { KeyRound, LockKeyhole, Network, Save, ShieldCheck, Timer, UserCheck, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSecurityPolicy, updateSecurityPolicy, type SecurityPolicy } from "@/features/admin-system/services/admin-system-service";

const defaultPolicy: SecurityPolicy = {
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

export default function SecurityPage() {
  const [policy, setPolicy] = useState<SecurityPolicy>(defaultPolicy);
  const [whitelistText, setWhitelistText] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSecurityPolicy()
      .then((data) => {
        setPolicy(data);
        setWhitelistText(data.whitelistIps.join("\n"));
      })
      .catch(() => setError("Gagal memuat pengaturan keamanan. Pastikan login sebagai Admin."));
  }, []);

  function update<K extends keyof SecurityPolicy>(key: K, value: SecurityPolicy[K]) {
    setPolicy((current) => ({ ...current, [key]: value }));
    setMessage(null);
    setError(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...policy,
        whitelistIps: whitelistText.split("\n").map((item) => item.trim()).filter(Boolean)
      };
      const saved = await updateSecurityPolicy(payload);
      setPolicy(saved);
      setWhitelistText(saved.whitelistIps.join("\n"));
      setMessage("Pengaturan keamanan berhasil disimpan.");
    } catch {
      setError("Gagal menyimpan security policy. Periksa panjang password, timeout, dan whitelist IP.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#5f7974]">Keamanan</p>
          <h1 className="mt-2 text-3xl font-black text-[#2a3234]">Security Policy</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6a746f]">
            Atur password policy, session timeout, whitelist IP, two-factor authentication, enkripsi data, dan kebijakan akses data pasien.
          </p>
        </div>
        <Button type="button" onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Menyimpan..." : "Simpan Security Policy"}
        </Button>
      </div>

      {message && <p className="rounded-xl border border-[#c7c1b5] bg-[#e6efe5] p-3 text-sm text-[#5f7974]">{message}</p>}
      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Password Policy</CardTitle>
            <CardDescription>Aturan minimal keamanan password user.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Minimal panjang password">
              <input className="h-10 rounded-lg border bg-white px-3 text-sm" type="number" min={8} max={32} value={policy.minPasswordLength} onChange={(event) => update("minPasswordLength", Number(event.target.value))} />
            </Field>
            <Toggle label="Wajib huruf besar" checked={policy.requireUppercase} onChange={(value) => update("requireUppercase", value)} />
            <Toggle label="Wajib angka" checked={policy.requireNumber} onChange={(value) => update("requireNumber", value)} />
            <Toggle label="Wajib simbol" checked={policy.requireSymbol} onChange={(value) => update("requireSymbol", value)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Timer className="h-5 w-5" /> Session & Akses</CardTitle>
            <CardDescription>Kontrol durasi login dan pembatasan akses jaringan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Session timeout (menit)">
              <input className="h-10 rounded-lg border bg-white px-3 text-sm" type="number" min={5} max={1440} value={policy.sessionTimeoutMinutes} onChange={(event) => update("sessionTimeoutMinutes", Number(event.target.value))} />
            </Field>
            <Field label="Whitelist IP">
              <textarea className="min-h-32 rounded-lg border bg-white px-3 py-2 text-sm" value={whitelistText} onChange={(event) => setWhitelistText(event.target.value)} placeholder={"192.168.1.10\n10.10.10.5"} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Proteksi Akun & Data</CardTitle>
            <CardDescription>Fitur keamanan tingkat aplikasi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Toggle icon={LockKeyhole} label="Two-Factor Authentication" checked={policy.twoFactorEnabled} onChange={(value) => update("twoFactorEnabled", value)} />
            <Toggle icon={Network} label="Enkripsi data aktif" checked={policy.dataEncryptionEnabled} onChange={(value) => update("dataEncryptionEnabled", value)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5" /> Kebijakan Akses Data Pasien</CardTitle>
            <CardDescription>Catatan kebijakan internal untuk melindungi data medis.</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea className="min-h-52 w-full rounded-lg border bg-white px-3 py-2 text-sm" value={policy.patientDataAccessPolicy} onChange={(event) => update("patientDataAccessPolicy", event.target.value)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold uppercase tracking-[0.06em] text-[#4a5657]">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, checked, onChange, icon: Icon }: { label: string; checked: boolean; onChange: (value: boolean) => void; icon?: LucideIcon }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border bg-[#faf8ef] p-3 text-sm font-semibold">
      <span className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-[#5f7974]" />}
        {label}
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}
