import { Router } from "express";
import { STAFF_ROLES } from "../../constants/roles.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createAnnouncement, deleteAnnouncement, listAnnouncements, updateAnnouncement } from "./announcement.controller.js";
import { announcementSchema } from "./announcement.schema.js";

export const announcementRoutes = Router();

announcementRoutes.use(authenticate);
announcementRoutes.get("/", listAnnouncements);
announcementRoutes.post("/", authorize(STAFF_ROLES), validate(announcementSchema), createAnnouncement);
announcementRoutes.put("/:id", authorize(STAFF_ROLES), validate(announcementSchema), updateAnnouncement);
announcementRoutes.delete("/:id", authorize(STAFF_ROLES), deleteAnnouncement);
