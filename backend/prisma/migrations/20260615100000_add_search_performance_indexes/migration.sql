-- Safe performance indexes for paginated/search-heavy clinical screens.
-- pg_trgm accelerates ILIKE/contains search on names, codes, invoices, diagnosis, and item names.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "visits_status_visit_date_idx"
ON "visits" ("status", "visit_date");

CREATE INDEX IF NOT EXISTS "medical_records_created_at_idx"
ON "medical_records" ("created_at");

CREATE INDEX IF NOT EXISTS "vital_signs_patient_id_created_at_idx"
ON "vital_signs" ("patient_id", "created_at");

CREATE INDEX IF NOT EXISTS "vital_signs_created_at_idx"
ON "vital_signs" ("created_at");

CREATE INDEX IF NOT EXISTS "prescriptions_status_created_at_idx"
ON "prescriptions" ("status", "created_at");

CREATE INDEX IF NOT EXISTS "payments_status_created_at_idx"
ON "payments" ("status", "created_at");

CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx"
ON "audit_logs" ("created_at");

CREATE INDEX IF NOT EXISTS "users_created_at_idx"
ON "users" ("created_at");

CREATE INDEX IF NOT EXISTS "patients_name_trgm_idx"
ON "patients" USING GIN ("name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "users_name_trgm_idx"
ON "users" USING GIN ("name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "users_email_trgm_idx"
ON "users" USING GIN ("email" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "users_phone_trgm_idx"
ON "users" USING GIN ("phone" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "patients_patient_code_trgm_idx"
ON "patients" USING GIN ("patient_code" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "patients_medical_record_no_trgm_idx"
ON "patients" USING GIN ("medical_record_no" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "patients_nik_trgm_idx"
ON "patients" USING GIN ("nik" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "visits_visit_no_trgm_idx"
ON "visits" USING GIN ("visit_no" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "visits_complaint_trgm_idx"
ON "visits" USING GIN ("complaint" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "medical_records_diagnosis_trgm_idx"
ON "medical_records" USING GIN ("diagnosis" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "medical_records_treatment_trgm_idx"
ON "medical_records" USING GIN ("treatment" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "vital_signs_blood_pressure_trgm_idx"
ON "vital_signs" USING GIN ("blood_pressure" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "vital_signs_notes_trgm_idx"
ON "vital_signs" USING GIN ("notes" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "payments_invoice_no_trgm_idx"
ON "payments" USING GIN ("invoice_no" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "payment_details_item_name_trgm_idx"
ON "payment_details" USING GIN ("item_name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "medicines_code_trgm_idx"
ON "medicines" USING GIN ("code" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "medicines_name_trgm_idx"
ON "medicines" USING GIN ("name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "medicines_unit_trgm_idx"
ON "medicines" USING GIN ("unit" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "audit_logs_action_trgm_idx"
ON "audit_logs" USING GIN ("action" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "audit_logs_resource_trgm_idx"
ON "audit_logs" USING GIN ("resource" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "audit_logs_ip_address_trgm_idx"
ON "audit_logs" USING GIN ("ip_address" gin_trgm_ops);
