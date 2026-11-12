-- Primebrick: job-handler phase-1 — uuidv7 column defaults
-- Handwritten: swap generation default gen_random_uuid() -> uuidv7()
-- on pre-existing uuid columns (default expressions are a differ blind spot).

ALTER TABLE "job"."job_schedules"  ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "job"."job_runs"       ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "job"."job_triggers"   ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "job"."config_entries" ALTER COLUMN "uuid" SET DEFAULT uuidv7();
ALTER TABLE "job"."translations"   ALTER COLUMN "uuid" SET DEFAULT uuidv7();
