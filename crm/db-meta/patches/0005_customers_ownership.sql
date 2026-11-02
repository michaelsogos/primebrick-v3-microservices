-- 0005 — customer ownership migration: public.customers{,_audit} → crm schema,
-- system.entities.customer.* → crm.entities.customer.* in crm.translations.
--
-- The `customer` domain entity is OWNED by the primebrick-crm module
-- (entity class, schema, routes, meta, export pipeline). Zero-copy move:
-- ALTER TABLE ... SET SCHEMA preserves rows, constraints, indexes and the
-- audit trail — no FK into public.customers exists (verified on the live
-- schema and the BE snapshot).
--
-- Label keys move to the module namespace per `entities_ns: "crm"` on
-- the served meta — same precedent as job's 0006_job_entities_ns rename.
-- Source rows are soft-deleted per the TranslationEntityBase contract
-- (Deletable → auto-excluded by the DAL), never hard-purged.

BEGIN;

-- ─── Tables: schema move (data + audit trail preserved in place) ─────────────
ALTER TABLE "public"."customers"       SET SCHEMA "crm";
ALTER TABLE "public"."customers_audit" SET SCHEMA "crm";

-- ─── Translations: copy into the module namespace ────────────────────────────
INSERT INTO "crm"."translations" (key, language, value, created_at, created_by, updated_at, updated_by, version)
SELECT
  'crm.entities.customer.' || substr(key, length('system.entities.customer.') + 1),
  language,
  value,
  now(),
  'migration-crm-customer-ownership',
  now(),
  'migration-crm-customer-ownership',
  1
FROM "system"."translations"
WHERE "key" LIKE 'system.entities.customer.%'
  AND "deleted_at" IS NULL
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

-- ─── Translations: retire the system-namespace copies (soft-delete) ──────────
UPDATE "system"."translations"
SET
  "deleted_at" = now(),
  "deleted_by" = 'migration-crm-customer-ownership',
  "updated_at" = now(),
  "updated_by" = 'migration-crm-customer-ownership',
  "version" = "version" + 1
WHERE "key" LIKE 'system.entities.customer.%'
  AND "deleted_at" IS NULL;

COMMIT;
