-- Primebrick: `crm.customers.code` — replace the partial unique
-- (`customers_code_alive_uidx`, WHERE deleted_at IS NULL) with an ABSOLUTE
-- unique (`customers_code_uq`), matching the `@Unique()` entity declaration.
--
-- The partial index was semantically broken: it allowed a deleted row's code
-- to be reused by an alive row, which makes RESTORE of the deleted row
-- impossible (the restore itself violates the partial index) and breaks the
-- unique-identity contract — two rows must never share `code`, deleted or not.
--
-- Blocker for a full unique: duplicate codes where AT LEAST ONE side is
-- deleted can exist under the partial index (test residue + the reuse
-- scenario it allowed). Step 1 purges the deleted side of every duplicate
-- group — the ALIVE row always keeps the code; among all-deleted groups the
-- lowest ctid survives. Alive rows are never touched: an alive-vs-alive
-- collision would abort the index build (correct fail-loud, never silently
-- resolved).

DELETE FROM "crm"."customers" a
USING "crm"."customers" b
WHERE a."code" = b."code"
  AND a."deleted_at" IS NOT NULL
  AND a.uuid <> b.uuid
  AND (
    b."deleted_at" IS NULL
    OR a.ctid > b.ctid
  );

DROP INDEX IF EXISTS "crm"."customers_code_alive_uidx";

CREATE UNIQUE INDEX IF NOT EXISTS "customers_code_uq"
ON "crm"."customers" USING btree ("code");
