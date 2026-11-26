-- Primebrick: entity → database patch
-- pb:requires-review
-- generatedAt: 2026-11-24T19:06:51.401Z

-- ── review section (runs only after approval) ──
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "webhook"."config_entries" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "webhook"."config_entries" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "webhook"."sequences" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "webhook"."sequences" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "webhook"."sequence_counters" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "webhook"."sequence_counters" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
