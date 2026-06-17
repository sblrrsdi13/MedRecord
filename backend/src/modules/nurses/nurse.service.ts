import { prisma } from "../../config/prisma.js";
import type { NursePayload } from "./nurse.schema.js";

const nurseInclude = {
  user: { select: { id: true, name: true, email: true, phone: true, isActive: true } }
};

export async function listNurses() {
  return prisma.nurse.findMany({
    include: nurseInclude,
    orderBy: { createdAt: "desc" }
  });
}

export async function createNurse(data: NursePayload) {
  return prisma.nurse.create({ data });
}

export async function deleteNurse(id: string) {
  return prisma.nurse.delete({ where: { id } });
}
