-- Primebrick: entity → database patch
-- pb:requires-review
-- generatedAt: 2026-11-24T19:06:59.880Z

-- ── review section (runs only after approval) ──
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "boilerplate"."config_entries" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "boilerplate"."config_entries" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "boilerplate"."test_items" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "boilerplate"."test_items" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "boilerplate"."sequences" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "boilerplate"."sequences" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "boilerplate"."sequence_counters" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
-- set default "updated_at" → clock_timestamp() (db=now())
ALTER TABLE "boilerplate"."sequence_counters" ALTER COLUMN "updated_at" SET DEFAULT clock_timestamp();
