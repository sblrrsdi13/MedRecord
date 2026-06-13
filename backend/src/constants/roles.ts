import { RoleName } from "@prisma/client";

export const ADMIN_ROLES = [RoleName.ADMIN];
export const OPERATIONAL_ROLES = [
  RoleName.RECEPTIONIST,
  RoleName.NURSE,
  RoleName.DOCTOR,
  RoleName.PHARMACY,
  RoleName.CASHIER
];
export const STAFF_ROLES = [RoleName.ADMIN, ...OPERATIONAL_ROLES];
