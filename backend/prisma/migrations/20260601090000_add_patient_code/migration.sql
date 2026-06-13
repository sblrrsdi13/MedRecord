ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "patient_code" TEXT;

WITH numbered AS (
  SELECT
    id,
    EXTRACT(YEAR FROM created_at)::TEXT AS year_part,
    ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM created_at) ORDER BY created_at ASC, id ASC) AS seq
  FROM "patients"
  WHERE "patient_code" IS NULL
)
UPDATE "patients" p
SET "patient_code" = 'PS' || numbered.year_part || LPAD(numbered.seq::TEXT, 4, '0')
FROM numbered
WHERE p.id = numbered.id;

CREATE UNIQUE INDEX IF NOT EXISTS "patients_patient_code_key" ON "patients"("patient_code");
CREATE INDEX IF NOT EXISTS "patients_patient_code_idx" ON "patients"("patient_code");
