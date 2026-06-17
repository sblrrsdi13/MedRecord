import type { Request, Response } from "express";
import { created, ok } from "../../utils/api-response.js";
import { emitResourceEvent } from "../../socket/socket.js";
import * as doctorScheduleService from "./doctor-schedule.service.js";

export async function listDoctorSchedules(req: Request, res: Response) {
  const schedules = await doctorScheduleService.listDoctorSchedules(req.user!);
  return ok(res, schedules);
}

export async function createDoctorSchedule(req: Request, res: Response) {
  const schedule = await doctorScheduleService.createDoctorSchedule(req.body);
  emitResourceEvent("doctor-schedules", "create", { id: schedule.id, doctorId: schedule.doctorId, polyclinicId: schedule.polyclinicId });
  return created(res, schedule, "Jadwal dokter berhasil dibuat");
}

export async function updateDoctorSchedule(req: Request, res: Response) {
  const schedule = await doctorScheduleService.updateDoctorSchedule(req.params.id, req.body);
  emitResourceEvent("doctor-schedules", "update", { id: schedule.id, doctorId: schedule.doctorId, polyclinicId: schedule.polyclinicId });
  return ok(res, schedule, "Jadwal dokter berhasil diperbarui");
}

export async function deleteDoctorSchedule(req: Request, res: Response) {
  const schedule = await doctorScheduleService.deleteDoctorSchedule(req.params.id);
  emitResourceEvent("doctor-schedules", "delete", { id: schedule.id, doctorId: schedule.doctorId, polyclinicId: schedule.polyclinicId });
  return ok(res, schedule, "Jadwal dokter berhasil dihapus");
}
