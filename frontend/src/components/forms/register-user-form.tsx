"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { KeyRound, Save, ShieldCheck, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { FormField, FormSection, sharedFormStyles, sharedInputClassName, sharedSelectTriggerClassName } from "@/components/forms/shared-form";
import { registerUser } from "@/features/auth/services/auth-service";
import { registerSchema, type RegisterInput } from "@/validations/auth.schema";
import { emitResourceChanged } from "@/utils/resource-events";

const roles: Array<{ value: RegisterInput["role"]; label: string; helper: string }> = [
  { value: "ADMIN", label: "Admin", helper: "Akses penuh sistem" },
  { value: "RECEPTIONIST", label: "Receptionist", helper: "Registrasi pasien dan antrian" },
  { value: "NURSE", label: "Nurse", helper: "Vital sign dan pemeriksaan awal" },
  { value: "DOCTOR", label: "Doctor", helper: "Rekam medis dan resep" },
  { value: "PHARMACY", label: "Pharmacy", helper: "Resep dan stok obat" },
  { value: "CASHIER", label: "Cashier", helper: "Pembayaran dan invoice" }
];

export function RegisterUserForm({ onSuccess }: { onSuccess?: () => void }) {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "RECEPTIONIST"
    }
  });

  async function onSubmit(values: RegisterInput) {
    setMessage(null);
    try {
      const user = await registerUser(values);
      setMessage({ type: "success", text: `User ${user.name} berhasil dibuat sebagai ${user.role}.` });
      form.reset({ name: "", email: "", password: "", role: "RECEPTIONIST" });
      emitResourceChanged("users");
      onSuccess?.();
    } catch {
      setMessage({ type: "error", text: "Gagal membuat user. Pastikan Anda login sebagai Admin dan email belum dipakai." });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={sharedFormStyles.form}>
      <FormSection icon={UserRound} title="Identitas Akun">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Nama Lengkap">
            <Input id="name" placeholder="Nama user" className={sharedInputClassName} {...form.register("name")} />
          </FormField>
          {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
          <FormField label="Email">
            <Input id="email" type="email" placeholder="user@klinik.local" className={sharedInputClassName} {...form.register("email")} />
          </FormField>
          {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
        </div>
      </FormSection>

      <FormSection icon={KeyRound} title="Akses Login">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Password Awal">
            <PasswordInput id="password" placeholder="Minimal 8 karakter" inputClassName={sharedInputClassName} {...form.register("password")} />
          </FormField>
          {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
          <FormField label="Role">
            <select id="role" className={sharedSelectTriggerClassName} {...form.register("role")}>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </FormField>
          {form.formState.errors.role && <p className="text-xs text-destructive">{form.formState.errors.role.message}</p>}
        </div>
      </FormSection>

      <FormSection icon={ShieldCheck} title="Ringkasan Role">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => (
            <div key={role.value} className="rounded-lg border border-[#c7c1b5] bg-[#faf8ef] p-3">
              <p className="text-sm font-semibold text-[#2a3234]">{role.label}</p>
              <p className="text-xs text-[#7a827e]">{role.helper}</p>
            </div>
          ))}
        </div>
      </FormSection>

      {message && (
        <p className={message.type === "success" ? "rounded-md bg-[#e6efe5] px-3 py-2 text-sm text-[#5f7974]" : "rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"}>
          {message.text}
        </p>
      )}

      <div className={sharedFormStyles.actions}>
        <button type="reset" className="inline-flex h-10 items-center justify-center rounded-md border border-[#c7c1b5] px-4 text-sm font-medium">
          Reset
        </button>
        <button type="submit" disabled={form.formState.isSubmitting} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#5f7974] px-4 text-sm font-medium text-white hover:bg-[#86a197] disabled:opacity-60">
          <Save className="h-4 w-4" />
          {form.formState.isSubmitting ? "Menyimpan..." : "Buat User"}
        </button>
      </div>
    </form>
  );
}



