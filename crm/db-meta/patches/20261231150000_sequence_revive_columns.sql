-- Primebrick: sequence reviver — row-owned sezionale defaults, the
-- binding series key, the revive contract, and the generation anchors.
-- `binding_key`/`expire_at`/`switch_at`/`default_from`/`revived_*` are
-- system-owned (never write keys — a writable binding_key would let an
-- operator row hijack a field's series). `revive_every`/`revive_slot`
-- are create-only (the cadence is the row's identity); `revive_grace`
-- stays editable and moves only `switch_at`. NO binding_key backfill by
-- name-shape: claiming a series on a name pattern would be the same
-- hijack vector the column exists to prevent — legacy bound rows are
-- adopted lazily by detUuid on first lookup (adoptSequenceRow).
ALTER TABLE "crm"."sequences"
  ADD COLUMN IF NOT EXISTS "sez"          varchar(200),
  ADD COLUMN IF NOT EXISTS "sez2"         varchar(200),
  ADD COLUMN IF NOT EXISTS "sez3"         varchar(200),
  ADD COLUMN IF NOT EXISTS "binding_key"  varchar(130),
  ADD COLUMN IF NOT EXISTS "revive_every" varchar(30),
  ADD COLUMN IF NOT EXISTS "revive_grace" varchar(30),
  ADD COLUMN IF NOT EXISTS "revive_slot"  varchar(10),
  ADD COLUMN IF NOT EXISTS "expire_at"    timestamptz,
  ADD COLUMN IF NOT EXISTS "switch_at"    timestamptz,
  ADD COLUMN IF NOT EXISTS "default_from" timestamptz,
  ADD COLUMN IF NOT EXISTS "revived_from" uuid,
  ADD COLUMN IF NOT EXISTS "revived_at"   timestamptz,
  ADD COLUMN IF NOT EXISTS "revived_by"   varchar(100);
-- Series resolution index: binding_key + the default_from window the
-- lookup orders on (latest generation owning the document's `at`).
CREATE INDEX IF NOT EXISTS "sequences_binding_key_default_from_idx"
  ON "crm"."sequences" ("binding_key", "default_from" DESC NULLS LAST)
  WHERE "deleted_at" IS NULL;
