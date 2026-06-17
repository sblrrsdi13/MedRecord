import { z } from "zod";

export const doctorScheduleSchema = z.object({
  body: z.object({
    doctorId: z.string().uuid(),
    polyclinicId: z.string().uuid(),
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    quota: z.coerce.number().int().min(1).max(300).default(30),
    isActive: z.boolean().default(true)
  })
});

export const createDoctorScheduleSchema = doctorScheduleSchema;
export const updateDoctorScheduleSchema = doctorScheduleSchema;

export type DoctorSchedulePayload = z.infer<typeof doctorScheduleSchema>["body"];
