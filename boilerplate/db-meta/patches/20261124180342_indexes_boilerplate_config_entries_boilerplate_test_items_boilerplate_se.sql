-- Primebrick: entity → database patch
-- pb:requires-review
-- pb:segments
-- generatedAt: 2026-11-24T18:03:42.594Z

-- Handwritten: canonical (unprefixed) index names.
ALTER INDEX "boilerplate"."boilerplate_translations_key_language_uidx" RENAME TO "translations_key_language_uidx";
ALTER INDEX "boilerplate"."boilerplate_translations_language_idx" RENAME TO "translations_language_idx";
ALTER TABLE "boilerplate"."translations" RENAME CONSTRAINT "translations_uuid_key" TO "translations_uuid_uq";

-- pb:begin-no-transaction
CREATE INDEX CONCURRENTLY IF NOT EXISTS "sequences_binding_key_default_from_idx" ON "boilerplate"."sequences" ("binding_key", "default_from" DESC NULLS LAST) WHERE deleted_at IS NULL;
-- pb:end-no-transaction

-- ── review section (runs only after approval) ──
-- REVIEW index "config_entries_key_uq" redefined (entity using=btree cols=key vs db using=btree cols=key)
DROP INDEX IF EXISTS "boilerplate"."config_entries_key_uq";
CREATE UNIQUE INDEX IF NOT EXISTS "config_entries_key_uq" ON "boilerplate"."config_entries" ("key") WHERE deleted_at IS NULL;
-- REVIEW index "test_items_name_uq" redefined (entity using=btree cols=name vs db using=btree cols=name)
DROP INDEX IF EXISTS "boilerplate"."test_items_name_uq";
CREATE UNIQUE INDEX IF NOT EXISTS "test_items_name_uq" ON "boilerplate"."test_items" ("name") WHERE deleted_at IS NULL;
