-- Fire-and-forget: Rename email_templates_communication_log → sender_log
-- and rename provider column → provider_uuid (uuid type).
-- Also add soft-delete columns to providers table.
-- Run this ONCE on the existing live database.

BEGIN;

-- 1. Rename table
ALTER TABLE IF EXISTS emailsender.email_templates_communication_log
  RENAME TO sender_log;

-- 2. Rename provider column → provider_uuid and change type to uuid
ALTER TABLE IF EXISTS emailsender.sender_log
  RENAME COLUMN provider TO provider_uuid;

ALTER TABLE IF EXISTS emailsender.sender_log
  ALTER COLUMN provider_uuid TYPE uuid USING NULL;

-- 3. Add soft-delete columns to providers table
ALTER TABLE IF EXISTS emailsender.providers
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE IF EXISTS emailsender.providers
  ADD COLUMN IF NOT EXISTS deleted_by text;

COMMIT;
