-- 20261125000000 — customer flat fields → canonical children (CRM model
-- step 3). Atomic: LA shape (civic → street2), data migration into the
-- child tables, display_name backfill, then the 10 flat-column drops.
-- Children of soft-deleted customers inherit `deleted_at` (the sub-array
-- dies with the parent; a restore never resurfaces stale children).
BEGIN;

-- ─── 1. local_addresses: civic → street2 (line1/line2 convention) ───
DROP INDEX IF EXISTS "crm"."local_addresses_dedupe_uidx";
ALTER TABLE "crm"."local_addresses"
  DROP COLUMN IF EXISTS "civic",
  ADD COLUMN IF NOT EXISTS "street2" text;
CREATE UNIQUE INDEX IF NOT EXISTS "local_addresses_dedupe_uidx"
  ON "crm"."local_addresses"
  ("customer_id", lower("street"), COALESCE(lower("street2"), ''), "postal_code", lower("city"), "country")
  WHERE "deleted_at" IS NULL;

-- ─── 2. customers.local_* → local_addresses (type = legal) ───
-- `local_country` was free text ('Italia'); LA.country is ISO-2 — map
-- explicitly, anything unexpected fails the patch loudly (never a
-- truncated wrong country). Partial rows (missing street/zip/city/
-- country) cannot form an LA and are intentionally not migrated.
INSERT INTO "crm"."local_addresses"
  (customer_id, type_uuid, street, postal_code, city, province, country, deleted_at, deleted_by)
SELECT
  c.id,
  t.uuid,
  c.local_address,
  c.local_zip,
  c.local_city,
  c.local_state,
  CASE WHEN c.local_country = 'Italia' THEN 'IT' ELSE c.local_country END,
  c.deleted_at,
  c.deleted_by
FROM "crm"."customers" c
JOIN "crm"."local_address_types" t
  ON t.code = 'legal' AND t.deleted_at IS NULL
WHERE c.local_address IS NOT NULL
  AND c.local_zip IS NOT NULL
  AND c.local_city IS NOT NULL
  AND c.local_country IS NOT NULL;

-- ─── 3. customers.email/phone → customer_contacts ───
-- A flat column is the only channel of that type → is_default = true.
INSERT INTO "crm"."customer_contacts"
  (customer_id, type_uuid, value, is_default, deleted_at, deleted_by)
SELECT c.id, t.uuid, c.email, true, c.deleted_at, c.deleted_by
FROM "crm"."customers" c
JOIN "crm"."contact_types" t
  ON t.code = 'email' AND t.deleted_at IS NULL
WHERE c.email IS NOT NULL
UNION ALL
SELECT c.id, t.uuid, c.phone, true, c.deleted_at, c.deleted_by
FROM "crm"."customers" c
JOIN "crm"."contact_types" t
  ON t.code = 'voice' AND t.deleted_at IS NULL
WHERE c.phone IS NOT NULL;

-- ─── 4. customers.company_name → customer_accounts (kind = legal) ───
-- The account is the fiscal datasheet: company_name + jurisdiction
-- country + the legal LA + the preferred contact channel (email first,
-- voice fallback). Rows without a derivable ISO country are skipped —
-- the name still lands on display_name, the jurisdiction is never
-- invented.
INSERT INTO "crm"."customer_accounts"
  (customer_id, kind_uuid, company_name, country, local_address_id, contact_id, is_default, deleted_at, deleted_by)
SELECT
  c.id,
  k.uuid,
  c.company_name,
  COALESCE(
    CASE WHEN c.local_country = 'Italia' THEN 'IT' ELSE c.local_country END,
    la.country
  ),
  la.id,
  ct.id,
  true,
  c.deleted_at,
  c.deleted_by
FROM "crm"."customers" c
JOIN "crm"."account_kinds" k
  ON k.code = 'legal' AND k.deleted_at IS NULL
LEFT JOIN "crm"."local_addresses" la
  ON la.customer_id = c.id
 AND la.type_uuid = (
   SELECT uuid FROM "crm"."local_address_types" WHERE code = 'legal' AND deleted_at IS NULL
 )
 AND la.deleted_at IS NOT DISTINCT FROM c.deleted_at
LEFT JOIN LATERAL (
  SELECT cc.id
  FROM "crm"."customer_contacts" cc
  JOIN "crm"."contact_types" cct
    ON cct.uuid = cc.type_uuid AND cct.code IN ('email', 'voice')
  WHERE cc.customer_id = c.id
    AND cc.is_default
    AND cc.deleted_at IS NOT DISTINCT FROM c.deleted_at
  ORDER BY CASE WHEN cct.code = 'email' THEN 0 ELSE 1 END
  LIMIT 1
) ct ON true
WHERE c.company_name IS NOT NULL
  AND COALESCE(
        CASE WHEN c.local_country = 'Italia' THEN 'IT' ELSE c.local_country END,
        la.country
      ) IS NOT NULL;

-- ─── 5. display_name backfill ───
-- Informal/pseudonym name: the recognizable company name first, then
-- the person's name, then the code (never left empty).
UPDATE "crm"."customers"
SET "display_name" = COALESCE(
  NULLIF(btrim(concat_ws(' ', "first_name", "last_name")), ''),
  "company_name",
  "code"
)
WHERE "display_name" IS NULL;

-- ─── 6. Drop the 10 flat columns — data now lives in ONE place ───
ALTER TABLE "crm"."customers"
  DROP COLUMN "first_name",
  DROP COLUMN "last_name",
  DROP COLUMN "company_name",
  DROP COLUMN "email",
  DROP COLUMN "phone",
  DROP COLUMN "local_address",
  DROP COLUMN "local_city",
  DROP COLUMN "local_state",
  DROP COLUMN "local_country",
  DROP COLUMN "local_zip";

-- ─── 7. Field labels: street2 in, orphaned keys out ───
INSERT INTO "crm"."translations" ("key", "language", "value", "created_by", "updated_by") VALUES
  ('crm.entities.local_address.fields.street2','en-GB','Street (line 2)','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.street2','en-US','Street (line 2)','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.street2','it-IT','Indirizzo (riga 2)','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.street2','de-DE','Straße (Zeile 2)','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.street2','fr-FR','Adresse (ligne 2)','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.street2','es-ES','Dirección (línea 2)','initial-setup','initial-setup'),
  ('crm.entities.local_address.fields.street2','pt-PT','Morada (linha 2)','initial-setup','initial-setup')
ON CONFLICT DO NOTHING;

DELETE FROM "crm"."translations"
WHERE "key" IN (
  'crm.entities.local_address.fields.civic',
  'crm.entities.customer.fields.first_name',
  'crm.entities.customer.fields.last_name',
  'crm.entities.customer.fields.company_name',
  'crm.entities.customer.fields.email',
  'crm.entities.customer.fields.phone',
  'crm.entities.customer.fields.local_address',
  'crm.entities.customer.fields.local_city',
  'crm.entities.customer.fields.local_state',
  'crm.entities.customer.fields.local_country',
  'crm.entities.customer.fields.local_zip'
);

COMMIT;
