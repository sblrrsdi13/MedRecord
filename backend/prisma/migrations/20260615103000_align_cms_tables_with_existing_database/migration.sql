CREATE TABLE IF NOT EXISTS "site_settings" (
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "site_settings_pkey" PRIMARY KEY ("key")
);

ALTER TABLE "portal_announcements"
ALTER COLUMN "created_at" TYPE TIMESTAMPTZ USING "created_at" AT TIME ZONE 'UTC',
ALTER COLUMN "created_at" SET DEFAULT now(),
ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ USING "updated_at" AT TIME ZONE 'UTC',
ALTER COLUMN "updated_at" SET DEFAULT now();
