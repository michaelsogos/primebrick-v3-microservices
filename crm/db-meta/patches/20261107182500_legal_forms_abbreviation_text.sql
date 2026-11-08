-- 20261107182500 — legal_forms.abbreviation varchar(50) → text.
-- GLEIF abbreviations are semicolon-separated lists of equivalent forms
-- (observed up to ~320 chars), not a single short code.

BEGIN;

ALTER TABLE "crm"."legal_forms" ALTER COLUMN "abbreviation" TYPE text;

COMMIT;
