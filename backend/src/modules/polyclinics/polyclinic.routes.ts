import { Router } from "express";
import { ADMIN_ROLES } from "../../constants/roles.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createPolyclinicSchema, listPolyclinicsSchema, updatePolyclinicSchema } from "./polyclinic.schema.js";
import * as controller from "./polyclinic.controller.js";
import { emitResourceEvent } from "../../socket/socket.js";

export const polyclinicRoutes = Router();

polyclinicRoutes.use(authenticate);
polyclinicRoutes.get("/", validate(listPolyclinicsSchema), controller.index);
polyclinicRoutes.post("/", authorize(ADMIN_ROLES), validate(createPolyclinicSchema), controller.store);
polyclinicRoutes.put("/:id", authorize(ADMIN_ROLES), validate(updatePolyclinicSchema), controller.update);
polyclinicRoutes.delete("/:id", authorize(ADMIN_ROLES), async (req, res) => {
  const item = await import("../../config/prisma.js").then(({ prisma }) => prisma.polyclinic.delete({ where: { id: req.params.id } }));
  emitResourceEvent("polyclinics", "delete", { id: item.id });
  return res.json({ success: true, message: "Poli berhasil dihapus", data: item });
});
