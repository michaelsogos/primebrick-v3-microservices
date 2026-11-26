-- Primebrick: entity → database patch
-- pb:requires-review
-- generatedAt: 2026-11-22T20:15:06.888Z

-- ── review section (runs only after approval) ──
-- set default "created_by" → 'system' (db=(none))
ALTER TABLE "crm"."customers" ALTER COLUMN "created_by" SET DEFAULT 'system';
-- set default "updated_by" → 'system' (db=(none))
ALTER TABLE "crm"."customers" ALTER COLUMN "updated_by" SET DEFAULT 'system';
-- set default "created_by" → 'system' (db=(none))
ALTER TABLE "crm"."sequences" ALTER COLUMN "created_by" SET DEFAULT 'system';
-- set default "updated_by" → 'system' (db=(none))
ALTER TABLE "crm"."sequences" ALTER COLUMN "updated_by" SET DEFAULT 'system';
-- set default "step" → 1 (db=(none))
ALTER TABLE "crm"."sequences" ALTER COLUMN "step" SET DEFAULT 1;
-- set default "start" → 1 (db=(none))
ALTER TABLE "crm"."sequences" ALTER COLUMN "start" SET DEFAULT 1;
-- set default "created_by" → 'system' (db=(none))
ALTER TABLE "crm"."sequence_counters" ALTER COLUMN "created_by" SET DEFAULT 'system';
-- set default "updated_by" → 'system' (db=(none))
ALTER TABLE "crm"."sequence_counters" ALTER COLUMN "updated_by" SET DEFAULT 'system';
