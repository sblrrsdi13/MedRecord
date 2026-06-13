CREATE TABLE IF NOT EXISTS "portal_announcements" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'info',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "portal_announcements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "portal_announcements_active_created_idx"
ON "portal_announcements" ("is_active", "created_at");

ALTER TABLE "portal_announcements"
ADD CONSTRAINT "portal_announcements_created_by_fkey"
FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
