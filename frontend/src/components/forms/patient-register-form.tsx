"use client";

import axios from "axios";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, IdCard, LockKeyhole, UserPlus, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { DateChooser } from "@/components/ui/date-chooser";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { SelectChooser } from "@/components/ui/select-chooser";
import { registerPatient } from "@/services/auth-service";
import { patientRegisterSchema, type PatientRegisterInput } from "@/validations/auth.schema";

export function PatientRegisterForm({ onLoginClick }: { onLoginClick?: () => void }) {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<PatientRegisterInput>({
    resolver: zodResolver(patientRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      nik: "",
      birthDate: "",
      gender: "MALE",
      bloodType: "",
      phone: "",
      address: "",
      password: "",
      confirmPassword: ""
    }
  });

  async function onSubmit(values: PatientRegisterInput) {
    setSuccess(null);
    setError(null);
    try {
      await registerPatient(values);
      setSuccess("Akun dan data pasien berhasil dibuat. No. RM akan dibuat otomatis saat rekam medis pertama dicatat oleh petugas klinik.");
      form.reset();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Registrasi gagal. Periksa kembali data Anda.");
        return;
      }
      setError("Registrasi gagal. Periksa kembali data Anda.");
    }
  }

  if (success) {
    return (
      <div className="space-y-4 rounded-2xl border border-[#c7c1b5] bg-[#e6efe5] p-5 text-[#2a3234]">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Registrasi berhasil</p>
            <p className="mt-1 text-sm">{success}</p>
          </div>
        </div>
        <Link
          href="/login?tab=login"
          onClick={onLoginClick}
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Masuk ke Login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <Section icon={IdCard} title="Identitas Pasien">
        <Field label="Nama lengkap" error={form.formState.errors.name?.message}>
          <Input id="name" placeholder="Nama sesuai identitas" {...form.register("name")} />
        </Field>
        <Field label="NIK" error={form.formState.errors.nik?.message}>
          <Input id="nik" inputMode="numeric" placeholder="Nomor induk kependudukan" {...form.register("nik")} />
        </Field>
        <Field label="Tanggal lahir" error={form.formState.errors.birthDate?.message}>
          <DateChooser
            name="birthDate"
            value={form.watch("birthDate")}
            max={new Date().toISOString().slice(0, 10)}
            placeholder="Pilih tanggal lahir"
            required
            onValueChange={(nextValue) => form.setValue("birthDate", nextValue, { shouldDirty: true, shouldValidate: true })}
          />
        </Field>
        <Field label="Jenis kelamin" error={form.formState.errors.gender?.message}>
          <SelectChooser
            name="gender"
            value={form.watch("gender")}
            required
            options={[
              { value: "MALE", label: "Laki-laki" },
              { value: "FEMALE", label: "Perempuan" }
            ]}
            onValueChange={(nextValue) => form.setValue("gender", nextValue as PatientRegisterInput["gender"], { shouldDirty: true, shouldValidate: true })}
          />
        </Field>
        <Field label="Golongan darah" error={form.formState.errors.bloodType?.message}>
          <SelectChooser
            name="bloodType"
            value={form.watch("bloodType") ?? ""}
            options={[
              { value: "", label: "Tidak diketahui" },
              { value: "A", label: "A" },
              { value: "B", label: "B" },
              { value: "AB", label: "AB" },
              { value: "O", label: "O" }
            ]}
            onValueChange={(nextValue) => form.setValue("bloodType", nextValue, { shouldDirty: true, shouldValidate: true })}
          />
        </Field>
      </Section>

      <Section icon={UserPlus} title="Kontak & Alamat">
        <Field label="Email login" error={form.formState.errors.email?.message}>
          <Input id="email" type="email" placeholder="nama@email.com" {...form.register("email")} />
        </Field>
        <Field label="Nomor telepon" error={form.formState.errors.phone?.message}>
          <Input id="phone" inputMode="tel" placeholder="081234567890" {...form.register("phone")} />
        </Field>
        <Field label="Alamat lengkap" error={form.formState.errors.address?.message} wide>
          <textarea id="address" className="min-h-24 rounded-lg border border-[#c7c1b5] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#86a197]/25" placeholder="Alamat tempat tinggal pasien" {...form.register("address")} />
        </Field>
      </Section>

      <Section icon={LockKeyhole} title="Keamanan Akun">
        <Field label="Password" error={form.formState.errors.password?.message}>
          <PasswordInput id="password" placeholder="Minimal 8 karakter" {...form.register("password")} />
        </Field>
        <Field label="Konfirmasi password" error={form.formState.errors.confirmPassword?.message}>
          <PasswordInput id="confirmPassword" placeholder="Ulangi password" {...form.register("confirmPassword")} />
        </Field>
      </Section>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
        <UserPlus className="h-4 w-4" />
        {form.formState.isSubmitting ? "Mendaftarkan..." : "Daftar Sebagai Pasien"}
      </Button>
    </form>
  );
}

function Section({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#c7c1b5] bg-[#faf8ef]/70 p-4">
      <div className="mb-4 flex items-center gap-2 border-b border-[#d9d5c9] pb-2">
        <Icon className="h-4 w-4 text-[#5f7974]" />
        <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-[#5f7974]">{title}</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({ label, children, error, wide }: { label: string; children: React.ReactNode; error?: string; wide?: boolean }) {
  return (
    <label className={wide ? "flex min-w-0 flex-col gap-2 sm:col-span-2" : "flex min-w-0 flex-col gap-2"}>
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </label>
  );
}



