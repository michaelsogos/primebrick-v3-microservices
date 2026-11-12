-- Primebrick: crm phase-2+3 — uuid reference columns + backfill
-- Each *_id bigint FK gains a *_uuid twin pointing at target.uuid.
-- Columns stay NULLABLE until phase 4/5 (NOT NULL now would break
-- writes that don't populate uuid yet). entity_uuid FKs enforce
-- referential integrity immediately; old *_id FKs govern until phase 5.

ALTER TABLE "crm"."customer_accounts"  ADD COLUMN IF NOT EXISTS "customer_uuid"      uuid;
ALTER TABLE "crm"."customer_accounts"  ADD COLUMN IF NOT EXISTS "local_address_uuid" uuid;
ALTER TABLE "crm"."customer_accounts"  ADD COLUMN IF NOT EXISTS "contact_uuid"       uuid;
ALTER TABLE "crm"."customer_consents"  ADD COLUMN IF NOT EXISTS "customer_uuid"      uuid;
ALTER TABLE "crm"."customer_contacts"  ADD COLUMN IF NOT EXISTS "customer_uuid"      uuid;
ALTER TABLE "crm"."customer_links"     ADD COLUMN IF NOT EXISTS "parent_customer_uuid" uuid;
ALTER TABLE "crm"."customer_links"     ADD COLUMN IF NOT EXISTS "child_customer_uuid"  uuid;
ALTER TABLE "crm"."local_addresses"    ADD COLUMN IF NOT EXISTS "customer_uuid"      uuid;

UPDATE "crm"."customer_accounts" t SET "customer_uuid"      = r."uuid" FROM "crm"."customers"        r WHERE t."customer_id"       = r."id" AND t."customer_uuid" IS NULL;
UPDATE "crm"."customer_accounts" t SET "local_address_uuid" = r."uuid" FROM "crm"."local_addresses"  r WHERE t."local_address_id" = r."id" AND t."local_address_uuid" IS NULL;
UPDATE "crm"."customer_accounts" t SET "contact_uuid"       = r."uuid" FROM "crm"."customer_contacts" r WHERE t."contact_id"       = r."id" AND t."contact_uuid" IS NULL;
UPDATE "crm"."customer_consents" t SET "customer_uuid"      = r."uuid" FROM "crm"."customers"        r WHERE t."customer_id"       = r."id" AND t."customer_uuid" IS NULL;
UPDATE "crm"."customer_contacts" t SET "customer_uuid"      = r."uuid" FROM "crm"."customers"        r WHERE t."customer_id"       = r."id" AND t."customer_uuid" IS NULL;
UPDATE "crm"."customer_links"    t SET "parent_customer_uuid" = r."uuid" FROM "crm"."customers"      r WHERE t."parent_customer_id" = r."id" AND t."parent_customer_uuid" IS NULL;
UPDATE "crm"."customer_links"    t SET "child_customer_uuid"  = r."uuid" FROM "crm"."customers"      r WHERE t."child_customer_id"  = r."id" AND t."child_customer_uuid" IS NULL;
UPDATE "crm"."local_addresses"   t SET "customer_uuid"      = r."uuid" FROM "crm"."customers"        r WHERE t."customer_id"       = r."id" AND t."customer_uuid" IS NULL;

-- Orphan assertions: any *_id set without resolvable *_uuid = broken data — fail the patch.
DO $$
DECLARE missing bigint;
BEGIN
  SELECT count(*) INTO missing FROM "crm"."customer_accounts" WHERE "customer_id"       IS NOT NULL AND "customer_uuid" IS NULL;
  IF missing > 0 THEN RAISE EXCEPTION 'customer_accounts.customer_uuid: % orphaned refs', missing; END IF;
  SELECT count(*) INTO missing FROM "crm"."customer_accounts" WHERE "local_address_id" IS NOT NULL AND "local_address_uuid" IS NULL;
  IF missing > 0 THEN RAISE EXCEPTION 'customer_accounts.local_address_uuid: % orphaned refs', missing; END IF;
  SELECT count(*) INTO missing FROM "crm"."customer_accounts" WHERE "contact_id"       IS NOT NULL AND "contact_uuid" IS NULL;
  IF missing > 0 THEN RAISE EXCEPTION 'customer_accounts.contact_uuid: % orphaned refs', missing; END IF;
  SELECT count(*) INTO missing FROM "crm"."customer_consents"  WHERE "customer_id"       IS NOT NULL AND "customer_uuid" IS NULL;
  IF missing > 0 THEN RAISE EXCEPTION 'customer_consents.customer_uuid: % orphaned refs', missing; END IF;
  SELECT count(*) INTO missing FROM "crm"."customer_contacts"  WHERE "customer_id"       IS NOT NULL AND "customer_uuid" IS NULL;
  IF missing > 0 THEN RAISE EXCEPTION 'customer_contacts.customer_uuid: % orphaned refs', missing; END IF;
  SELECT count(*) INTO missing FROM "crm"."customer_links"     WHERE "parent_customer_id" IS NOT NULL AND "parent_customer_uuid" IS NULL;
  IF missing > 0 THEN RAISE EXCEPTION 'customer_links.parent_customer_uuid: % orphaned refs', missing; END IF;
  SELECT count(*) INTO missing FROM "crm"."customer_links"     WHERE "child_customer_id"  IS NOT NULL AND "child_customer_uuid" IS NULL;
  IF missing > 0 THEN RAISE EXCEPTION 'customer_links.child_customer_uuid: % orphaned refs', missing; END IF;
  SELECT count(*) INTO missing FROM "crm"."local_addresses"    WHERE "customer_id"       IS NOT NULL AND "customer_uuid" IS NULL;
  IF missing > 0 THEN RAISE EXCEPTION 'local_addresses.customer_uuid: % orphaned refs', missing; END IF;
END $$;

ALTER TABLE "crm"."customer_accounts"  ADD CONSTRAINT "customer_accounts_customer_uuid_fkey"      FOREIGN KEY ("customer_uuid")       REFERENCES "crm"."customers"("uuid")         ON DELETE CASCADE;
ALTER TABLE "crm"."customer_accounts"  ADD CONSTRAINT "customer_accounts_local_address_uuid_fkey" FOREIGN KEY ("local_address_uuid")  REFERENCES "crm"."local_addresses"("uuid")   ON DELETE RESTRICT;
ALTER TABLE "crm"."customer_accounts"  ADD CONSTRAINT "customer_accounts_contact_uuid_fkey"       FOREIGN KEY ("contact_uuid")        REFERENCES "crm"."customer_contacts"("uuid") ON DELETE RESTRICT;
ALTER TABLE "crm"."customer_consents"  ADD CONSTRAINT "customer_consents_customer_uuid_fkey"      FOREIGN KEY ("customer_uuid")       REFERENCES "crm"."customers"("uuid")         ON DELETE CASCADE;
ALTER TABLE "crm"."customer_contacts"  ADD CONSTRAINT "customer_contacts_customer_uuid_fkey"      FOREIGN KEY ("customer_uuid")       REFERENCES "crm"."customers"("uuid")         ON DELETE CASCADE;
ALTER TABLE "crm"."customer_links"     ADD CONSTRAINT "customer_links_parent_uuid_fkey"           FOREIGN KEY ("parent_customer_uuid") REFERENCES "crm"."customers"("uuid")        ON DELETE CASCADE;
ALTER TABLE "crm"."customer_links"     ADD CONSTRAINT "customer_links_child_uuid_fkey"            FOREIGN KEY ("child_customer_uuid")  REFERENCES "crm"."customers"("uuid")        ON DELETE CASCADE;
ALTER TABLE "crm"."local_addresses"    ADD CONSTRAINT "local_addresses_customer_uuid_fkey"        FOREIGN KEY ("customer_uuid")       REFERENCES "crm"."customers"("uuid")         ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "customer_accounts_customer_uuid_idx" ON "crm"."customer_accounts" ("customer_uuid")       WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS "customer_consents_customer_uuid_idx" ON "crm"."customer_consents" ("customer_uuid")       WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS "customer_contacts_customer_uuid_idx" ON "crm"."customer_contacts" ("customer_uuid")       WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS "customer_links_parent_uuid_idx"      ON "crm"."customer_links"    ("parent_customer_uuid") WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS "customer_links_child_uuid_idx"       ON "crm"."customer_links"    ("child_customer_uuid")  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS "local_addresses_customer_uuid_idx"   ON "crm"."local_addresses"   ("customer_uuid")       WHERE deleted_at IS NULL;
