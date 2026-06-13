import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Minimal 8 karakter")
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(120),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter").max(72),
  role: z.enum(["ADMIN", "RECEPTIONIST", "NURSE", "DOCTOR", "PHARMACY", "CASHIER", "PATIENT"])
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const patientRegisterSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(120),
  email: z.string().email("Email tidak valid"),
  nik: z.string().min(8, "NIK minimal 8 digit").max(32, "NIK terlalu panjang"),
  birthDate: z.string().min(1, "Tanggal lahir wajib diisi"),
  gender: z.enum(["MALE", "FEMALE"], { message: "Jenis kelamin wajib dipilih" }),
  bloodType: z.string().max(5, "Golongan darah terlalu panjang").optional(),
  phone: z.string().min(8, "Nomor telepon minimal 8 digit").max(30, "Nomor telepon terlalu panjang"),
  address: z.string().min(5, "Alamat minimal 5 karakter").max(500, "Alamat terlalu panjang"),
  password: z.string().min(8, "Password minimal 8 karakter").max(72),
  confirmPassword: z.string().min(8, "Konfirmasi password wajib diisi")
}).refine((value) => value.password === value.confirmPassword, {
  message: "Konfirmasi password tidak sama",
  path: ["confirmPassword"]
});

export type PatientRegisterInput = z.infer<typeof patientRegisterSchema>;



