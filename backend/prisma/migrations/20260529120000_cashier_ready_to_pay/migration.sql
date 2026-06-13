-- Add ready-to-pay cashier workflow support.
ALTER TYPE "VisitStatus" ADD VALUE IF NOT EXISTS 'ready_to_pay';

ALTER TABLE "polyclinics"
ADD COLUMN IF NOT EXISTS "consultation_fee" DECIMAL(12,2) NOT NULL DEFAULT 50000;

ALTER TABLE "medical_records"
ADD COLUMN IF NOT EXISTS "treatment_fee" DECIMAL(12,2) NOT NULL DEFAULT 0;

ALTER TABLE "payments"
ADD COLUMN IF NOT EXISTS "payment_method" TEXT;
