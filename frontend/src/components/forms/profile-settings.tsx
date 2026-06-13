"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { KeyRound, Save, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormField, FormMessage, FormSection, sharedFormStyles, sharedInputClassName } from "@/components/forms/shared-form";
import { changePassword, getMe, updateProfile } from "@/services/auth-service";
import { useAuthStore } from "@/store/auth-store";
import type { RoleName } from "@/types/api";

type Profile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: RoleName;
  isActive: boolean;
  createdAt: string;
};

export function ProfileSettings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    getMe().then(setProfile).catch(() => setError("Profile belum dapat dimuat. Silakan login ulang."));
  }, []);

  async function onProfileSubmit(formData: FormData) {
    setProfileMessage(null);
    setError(null);
    try {
      const updated = await updateProfile({
        name: String(formData.get("name")),
        email: String(formData.get("email")),
        phone: String(formData.get("phone") || "") || undefined
      });
      setProfile((current) => current ? { ...current, ...updated } : current);
      setSession({ id: updated.id, name: updated.name, email: updated.email, role: updated.role }, useAuthStore.getState().accessToken ?? "");
      setProfileMessage("Profile berhasil diperbarui.");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Gagal memperbarui profile.");
        return;
      }
      setError("Gagal memperbarui profile.");
    }
  }

  async function onPasswordSubmit(formData: FormData) {
    setPasswordMessage(null);
    setError(null);
    const newPassword = String(formData.get("newPassword"));
    const confirmPassword = String(formData.get("confirmPassword"));
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password baru tidak sama.");
      return;
    }

    try {
      await changePassword({
        currentPassword: String(formData.get("currentPassword")),
        newPassword
      });
      clearSession();
      setPasswordMessage("Password berhasil diganti. Silakan login ulang.");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Gagal mengganti password.");
        return;
      }
      setError("Gagal mengganti password.");
    }
  }

  if (!profile) {
    return <p className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">{error ?? "Memuat profile..."}</p>;
  }

  return (
    <div className="space-y-6">
      <section className="soft-panel overflow-hidden rounded-2xl">
        <div className="relative bg-gradient-to-br from-[#5f7974] via-[#86a197] to-[#d7d2eb] p-6 text-white">
          <div className="absolute right-6 top-6 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 shadow-lg ring-1 ring-white/30 backdrop-blur">
                <UserRound className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">{profile.name}</h1>
                <p className="text-sm text-white/80">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm ring-1 ring-white/25">
              <ShieldCheck className="h-4 w-4" />
              {profile.role}
            </div>
          </div>
        </div>
      </section>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="transition hover:-translate-y-1 hover:shadow-lg">
          <CardHeader>
            <CardTitle>Profile Akun</CardTitle>
            <CardDescription>Perbarui nama tampilan, email login, dan nomor telepon.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={onProfileSubmit} className={sharedFormStyles.form}>
              <FormSection icon={UserRound} title="Identitas Akun">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Nama Lengkap">
                    <Input name="name" defaultValue={profile.name} placeholder="Nama lengkap" className={sharedInputClassName} required />
                  </FormField>
                  <FormField label="Email Login">
                    <Input name="email" type="email" defaultValue={profile.email} placeholder="Email login" className={sharedInputClassName} required />
                  </FormField>
                  <div className="md:col-span-2">
                    <FormField label="Nomor Telepon">
                      <Input name="phone" defaultValue={profile.phone ?? ""} placeholder="Nomor telepon" className={sharedInputClassName} />
                    </FormField>
                  </div>
                </div>
              </FormSection>
              <FormMessage message={profileMessage} />
              <Button type="submit" className="bg-[#5f7974] hover:bg-[#86a197]">
                <Save className="h-4 w-4" />
                Simpan Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="transition hover:-translate-y-1 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" />Ganti Password</CardTitle>
            <CardDescription>Setelah password diganti, Anda perlu login ulang.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={onPasswordSubmit} className={sharedFormStyles.form}>
              <FormSection icon={KeyRound} title="Keamanan Akun">
                <FormField label="Password Lama">
                  <Input name="currentPassword" type="password" placeholder="Password lama" className={sharedInputClassName} required />
                </FormField>
                <FormField label="Password Baru">
                  <Input name="newPassword" type="password" placeholder="Password baru" className={sharedInputClassName} required />
                </FormField>
                <FormField label="Konfirmasi Password Baru">
                  <Input name="confirmPassword" type="password" placeholder="Konfirmasi password baru" className={sharedInputClassName} required />
                </FormField>
              </FormSection>
              <FormMessage message={passwordMessage} />
              <Button type="submit" variant="outline">Ganti Password</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



