import { Router } from "express";
import { STAFF_ROLES } from "../../constants/roles.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { clearNotifications, deleteNotification, listNotifications, markNotificationRead, sendNotification } from "./notification.controller.js";
import { sendNotificationSchema } from "./notification.schema.js";

export const notificationRoutes = Router();

notificationRoutes.use(authenticate);
notificationRoutes.get("/", listNotifications);
notificationRoutes.post("/", authorize(STAFF_ROLES), validate(sendNotificationSchema), sendNotification);
notificationRoutes.patch("/:id/read", markNotificationRead);
notificationRoutes.delete("/", clearNotifications);
notificationRoutes.delete("/:id", deleteNotification);
