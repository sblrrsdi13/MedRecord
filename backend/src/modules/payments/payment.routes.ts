import { Router } from "express";
import { OPERATIONAL_ROLES } from "../../constants/roles.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createPayment, deletePayment, listPayments, listReadyPayments, payInvoice, payReadyVisit, updatePayment } from "./payment.controller.js";
import { createPaymentSchema, payReadySchema } from "./payment.schema.js";

export const paymentRoutes = Router();

paymentRoutes.use(authenticate, authorize(OPERATIONAL_ROLES));
paymentRoutes.get("/", listPayments);
paymentRoutes.get("/ready", listReadyPayments);
paymentRoutes.post("/", validate(createPaymentSchema), createPayment);
paymentRoutes.patch("/ready/pay", validate(payReadySchema), payReadyVisit);
paymentRoutes.put("/:id", validate(createPaymentSchema), updatePayment);
paymentRoutes.patch("/:id/pay", payInvoice);
paymentRoutes.delete("/:id", deletePayment);
