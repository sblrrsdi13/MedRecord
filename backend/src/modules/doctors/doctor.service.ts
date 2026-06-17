import { prisma } from "../../config/prisma.js";
import type { DoctorPayload } from "./doctor.schema.js";

const doctorInclude = {
  user: { select: { id: true, name: true, email: true, phone: true } },
  polyclinic: { select: { id: true, name: true, code: true, queuePrefix: true, isActive: true } }
};

export async function listDoctors() {
  return prisma.doctor.findMany({
    include: doctorInclude,
    orderBy: { createdAt: "desc" }
  });
}

export async function createDoctor(data: DoctorPayload) {
  return prisma.doctor.create({ data });
}

export async function updateDoctor(id: string, data: DoctorPayload) {
  return prisma.doctor.update({ where: { id }, data });
}

export async function deleteDoctor(id: string) {
  return prisma.doctor.delete({ where: { id } });
}
