-- Primebrick: entity → database patch
-- pb:requires-review
-- generatedAt: 2026-11-24T17:01:34.510Z

-- ── review section (runs only after approval) ──
-- REVIEW index "config_entries_key_uq" redefined (entity using=btree cols=key vs db using=btree cols=key)
DROP INDEX IF EXISTS "webhook"."config_entries_key_uq";
CREATE UNIQUE INDEX IF NOT EXISTS "config_entries_key_uq" ON "webhook"."config_entries" ("key") WHERE deleted_at IS NULL;

-- WARN: DB-only index "config_entries_deleted_at_idx" on webhook.config_entries — not dropped
-- WARN: DB-only index "config_entries_uuid_uq" on webhook.config_entries — not dropped
-- manual: redundant full-unique on the PK column — the primary key already
-- enforces uniqueness; dropped per review (D5).
DROP INDEX IF EXISTS "webhook"."config_entries_uuid_uq";
