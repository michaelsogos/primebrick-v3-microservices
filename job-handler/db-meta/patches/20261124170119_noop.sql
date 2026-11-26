-- Primebrick: entity → database patch
-- pb:requires-review
-- generatedAt: 2026-11-24T17:01:19.270Z

-- ── review section (runs only after approval) ──
-- REVIEW index "config_entries_key_uq" redefined (entity using=btree cols=key vs db using=btree cols=key)
ALTER TABLE "job"."config_entries" DROP CONSTRAINT IF EXISTS "config_entries_key_uq";
CREATE UNIQUE INDEX IF NOT EXISTS "config_entries_key_uq" ON "job"."config_entries" ("key") WHERE deleted_at IS NULL;
-- REVIEW index "job_triggers_name_uq" redefined (entity using=btree cols=name vs db using=btree cols=name)
ALTER TABLE "job"."job_triggers" DROP CONSTRAINT IF EXISTS "job_triggers_name_uq";
CREATE UNIQUE INDEX IF NOT EXISTS "job_triggers_name_uq" ON "job"."job_triggers" ("name") WHERE deleted_at IS NULL;
