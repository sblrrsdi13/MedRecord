import { prisma } from "../../config/prisma.js";
import type { StaffPayload } from "./staff.schema.js";

const staffInclude = {
  user: { select: { id: true, name: true, email: true, phone: true, isActive: true } }
};

export async function listStaff() {
  return prisma.staff.findMany({
    include: staffInclude,
    orderBy: { createdAt: "desc" }
  });
}

export async function createStaff(data: StaffPayload) {
  return prisma.staff.create({ data });
}

export async function deleteStaff(id: string) {
  return prisma.staff.delete({ where: { id } });
}
