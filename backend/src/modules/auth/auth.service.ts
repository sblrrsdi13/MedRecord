import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { RoleName, User } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/errors.js";
import { generatePatientCode } from "../../utils/numbering.js";

type SafeUser = Pick<User, "id" | "name" | "email" | "isActive"> & { role: { name: RoleName } };

function signAccessToken(user: SafeUser) {
  const options: SignOptions = { subject: user.id, expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign(
    { email: user.email, role: user.role.name },
    env.JWT_ACCESS_SECRET,
    options
  );
}

function signRefreshToken(userId: string) {
  const options: SignOptions = {
    subject: userId,
    expiresIn: `${env.JWT_REFRESH_EXPIRES_IN_DAYS}d` as SignOptions["expiresIn"]
  };
  return jwt.sign({}, env.JWT_REFRESH_SECRET, {
    ...options
  });
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true }
  });

  if (!user || !user.isActive) throw new AppError(401, "Email atau password salah", "INVALID_CREDENTIALS");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(401, "Email atau password salah", "INVALID_CREDENTIALS");

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user.id);
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: hashToken(refreshToken), expiresAt }
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name
    }
  };
}

export async function refresh(refreshToken: string) {
  let userId: string;
  try {
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string };
    userId = payload.sub;
  } catch {
    throw new AppError(401, "Refresh token tidak valid", "INVALID_REFRESH_TOKEN");
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: { include: { role: true } } }
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date() || stored.userId !== userId) {
    throw new AppError(401, "Refresh token tidak valid", "INVALID_REFRESH_TOKEN");
  }

  return { accessToken: signAccessToken(stored.user) };
}

export async function logout(refreshToken?: string) {
  if (!refreshToken) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() }
  });
}

export async function registerUser(input: { name: string; email: string; password: string; role: RoleName }) {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existingUser) throw new AppError(409, "Email sudah terdaftar", "EMAIL_ALREADY_REGISTERED");

  const role = await prisma.role.upsert({
    where: { name: input.role },
    create: { name: input.role },
    update: {}
  });

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      roleId: role.id
    },
    include: { role: true }
  });

  return { id: user.id, name: user.name, email: user.email, role: user.role.name };
}

export async function registerPatient(input: {
  name: string;
  email: string;
  password: string;
  nik: string;
  birthDate: Date;
  gender: "MALE" | "FEMALE";
  bloodType?: string;
  phone: string;
  address: string;
}) {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existingUser) throw new AppError(409, "Email sudah terdaftar", "EMAIL_ALREADY_REGISTERED");

  const existingNik = await prisma.patient.findUnique({ where: { nik: input.nik }, select: { id: true } });
  if (existingNik) throw new AppError(409, "NIK sudah terdaftar sebagai pasien", "NIK_ALREADY_REGISTERED");

  const role = await prisma.role.upsert({
    where: { name: "PATIENT" },
    create: { name: "PATIENT" },
    update: {}
  });

  const passwordHash = await bcrypt.hash(input.password, 12);
  const result = await prisma.$transaction(async (tx) => {
    const patientCode = await generatePatientCode(tx);
    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash,
        roleId: role.id
      },
      include: { role: true }
    });

    const patient = await tx.patient.create({
      data: {
        patientCode,
        userId: user.id,
        name: input.name,
        nik: input.nik,
        gender: input.gender,
        birthDate: input.birthDate,
        phone: input.phone,
        address: input.address,
        bloodType: input.bloodType || null
      }
    });

    return { user, patient };
  });

  return {
    id: result.user.id,
    name: result.user.name,
    email: result.user.email,
    role: result.user.role.name,
    patient: {
      id: result.patient.id,
      patientCode: result.patient.patientCode,
      medicalRecordNo: result.patient.medicalRecordNo
    }
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { role: true }
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role.name,
    isActive: user.isActive,
    createdAt: user.createdAt
  };
}

export async function updateProfile(userId: string, input: { name: string; email: string; phone?: string }) {
  const existingEmail = await prisma.user.findFirst({
    where: {
      email: input.email,
      NOT: { id: userId }
    },
    select: { id: true }
  });

  if (existingEmail) {
    throw new AppError(409, "Email sudah digunakan oleh akun lain", "EMAIL_ALREADY_USED");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name: input.name, email: input.email, phone: input.phone },
    include: { role: true }
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role.name
  };
}

export async function changePassword(userId: string, input: { currentPassword: string; newPassword: string }) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!valid) throw new AppError(400, "Password lama tidak sesuai", "INVALID_CURRENT_PASSWORD");

  const passwordHash = await bcrypt.hash(input.newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    prisma.refreshToken.deleteMany({ where: { userId } })
  ]);

  return { changed: true };
}
