-- Primebrick: `crm.customers.code` uniqueness — the human customer code
-- was the only identity column without a unique index (dict entities all
-- carry `*_code_uq`). PARTIAL, `deleted_at IS NULL`: a hard unique cannot
-- build on existing data (deleted duplicate rows legitimately coexist)
-- and the contract is that a deleted customer's code may be reused —
-- same convention as `customer_accounts_default_uidx` /
-- `customer_contacts_default_uidx` / `crm_translations_key_language_uidx`.

CREATE UNIQUE INDEX IF NOT EXISTS "customers_code_alive_uidx"
ON "crm"."customers" USING btree ("code")
WHERE (deleted_at IS NULL);
