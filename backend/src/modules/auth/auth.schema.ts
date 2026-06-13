import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  })
});

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    password: z.string().min(8).max(72),
    role: z.enum(["ADMIN", "RECEPTIONIST", "NURSE", "DOCTOR", "PHARMACY", "CASHIER", "PATIENT"])
  })
});

export const patientRegisterSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    password: z.string().min(8).max(72),
    nik: z.string().min(8).max(32),
    birthDate: z.coerce.date(),
    gender: z.enum(["MALE", "FEMALE"]),
    bloodType: z.string().max(5).optional(),
    phone: z.string().min(8).max(30),
    address: z.string().min(5).max(500)
  })
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    phone: z.string().max(30).optional()
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8).max(72)
  })
});
