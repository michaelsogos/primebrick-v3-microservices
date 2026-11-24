-- Primebrick: entity → database patch
-- pb:requires-review
-- generatedAt: 2026-11-24T19:12:10.546Z

-- ── review section (runs only after approval) ──
-- set default "created_at" → clock_timestamp() (db=now())
ALTER TABLE "ai"."ai_telemetry" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();
