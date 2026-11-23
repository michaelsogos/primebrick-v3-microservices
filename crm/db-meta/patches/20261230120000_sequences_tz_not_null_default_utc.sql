-- Primebrick: `tz` becomes a governed NOT NULL column with physical default
-- 'UTC'. NULL backfill first (the semantic was always "null → UTC"), then the
-- constraint + default — same physical+served contract as `step`/`start`
-- (`defaultSql` literal → form prefill + DB DEFAULT).
UPDATE "crm"."sequences" SET "tz" = 'UTC' WHERE "tz" IS NULL;
ALTER TABLE "crm"."sequences" ALTER COLUMN "tz" SET DEFAULT 'UTC';
ALTER TABLE "crm"."sequences" ALTER COLUMN "tz" SET NOT NULL;
