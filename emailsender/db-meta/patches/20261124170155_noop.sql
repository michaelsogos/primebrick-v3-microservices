-- Primebrick: entity → database patch
-- pb:requires-review
-- generatedAt: 2026-11-24T17:01:55.015Z

-- ── review section (runs only after approval) ──
-- REVIEW index "providers_provider_uq" redefined (entity using=btree cols=provider vs db using=btree cols=provider)
DROP INDEX IF EXISTS "emailsender"."providers_provider_uq";
CREATE UNIQUE INDEX IF NOT EXISTS "providers_provider_uq" ON "emailsender"."providers" ("provider") WHERE deleted_at IS NULL;
-- REVIEW index "config_entries_key_uq" redefined (entity using=btree cols=key vs db using=btree cols=key)
DROP INDEX IF EXISTS "emailsender"."config_entries_key_uq";
CREATE UNIQUE INDEX IF NOT EXISTS "config_entries_key_uq" ON "emailsender"."config_entries" ("key") WHERE deleted_at IS NULL;
