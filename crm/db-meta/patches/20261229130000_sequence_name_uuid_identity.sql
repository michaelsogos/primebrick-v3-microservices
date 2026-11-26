-- Primebrick: sequence identity is uuid-ONLY. The registry column `code`
-- becomes plain `name` (operator-facing label, NOT unique — duplicate names
-- are operator data), the unique index on `code` is dropped, and
-- `label_key` is removed (name is the single human label;
-- `description_key` stays as the translated tooltip).
ALTER TABLE "crm"."sequences" RENAME COLUMN "code" TO "name";
DROP INDEX IF EXISTS "crm"."sequences_code_uq";
ALTER TABLE "crm"."sequences" DROP COLUMN IF EXISTS "label_key";
