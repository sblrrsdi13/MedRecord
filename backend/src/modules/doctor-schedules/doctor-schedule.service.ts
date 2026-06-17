import { RoleName } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import type { DoctorSchedulePayload } from "./doctor-schedule.schema.js";

const doctorScheduleInclude = {
  doctor: { include: { user: { select: { id: true, name: true, email: true } } } },
  polyclinic: true
};

export async function listDoctorSchedules(user: { id: string; role: RoleName }) {
  return prisma.doctorSchedule.findMany({
    where: user.role === RoleName.DOCTOR ? { doctor: { userId: user.id } } : undefined,
    include: doctorScheduleInclude,
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
  });
}

export async function createDoctorSchedule(data: DoctorSchedulePayload) {
  return prisma.doctorSchedule.create({ data });
}

export async function updateDoctorSchedule(id: string, data: DoctorSchedulePayload) {
  return prisma.doctorSchedule.update({ where: { id }, data });
}

export async function deleteDoctorSchedule(id: string) {
  return prisma.doctorSchedule.delete({ where: { id } });
}
