import { Router } from "express";
import { OPERATIONAL_ROLES, STAFF_ROLES } from "../../constants/roles.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createDoctorSchedule, deleteDoctorSchedule, listDoctorSchedules, updateDoctorSchedule } from "./doctor-schedule.controller.js";
import { createDoctorScheduleSchema, updateDoctorScheduleSchema } from "./doctor-schedule.schema.js";

export const doctorScheduleRoutes = Router();

doctorScheduleRoutes.use(authenticate);
doctorScheduleRoutes.get("/", authorize(STAFF_ROLES), listDoctorSchedules);
doctorScheduleRoutes.post("/", authorize(OPERATIONAL_ROLES), validate(createDoctorScheduleSchema), createDoctorSchedule);
doctorScheduleRoutes.put("/:id", authorize(OPERATIONAL_ROLES), validate(updateDoctorScheduleSchema), updateDoctorSchedule);
doctorScheduleRoutes.delete("/:id", authorize(OPERATIONAL_ROLES), deleteDoctorSchedule);
