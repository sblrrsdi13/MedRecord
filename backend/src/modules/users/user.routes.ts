import { Router } from "express";
import { RoleName } from "@prisma/client";
import { STAFF_ROLES } from "../../constants/roles.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { deactivateUser, deleteUserPermanent, listUsers, updateUser } from "./user.controller.js";
import { updateUserSchema } from "./user.schema.js";

export const userRoutes = Router();

userRoutes.use(authenticate);
userRoutes.get("/", authorize(STAFF_ROLES), listUsers);
userRoutes.put("/:id", authorize([RoleName.ADMIN]), validate(updateUserSchema), updateUser);
userRoutes.delete("/:id", authorize([RoleName.ADMIN]), deactivateUser);
userRoutes.delete("/:id/permanent", authorize([RoleName.ADMIN]), deleteUserPermanent);
