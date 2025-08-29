-- Add prospecting flags to Clinic table (idempotent)
-- Timestamp: 2025-08-29 15:10:38 -03:00

BEGIN;

ALTER TABLE "Clinic"
  ADD COLUMN IF NOT EXISTS "prospectEmail" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Clinic"
  ADD COLUMN IF NOT EXISTS "prospectCall" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Clinic"
  ADD COLUMN IF NOT EXISTS "prospectWhatsapp" BOOLEAN NOT NULL DEFAULT false;

COMMIT;
