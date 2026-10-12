-- Fire-and-forget: auditable columns on ai.docs_ingest_log.
-- The log is an IAuditableEntity (standard DAL `add` stamps
-- created_at/created_by — "chi e quando" for free) but has NO audit trail:
-- rows are append-only, never updated/deleted. The earlier ad-hoc `actor`
-- column is superseded by `created_by` (same data, stamped by the DAL).
-- Idempotent.

ALTER TABLE "ai"."docs_ingest_log" ADD COLUMN IF NOT EXISTS created_by text NULL;
ALTER TABLE "ai"."docs_ingest_log" ADD COLUMN IF NOT EXISTS updated_at timestamptz NULL;
ALTER TABLE "ai"."docs_ingest_log" ADD COLUMN IF NOT EXISTS updated_by text NULL;
ALTER TABLE "ai"."docs_ingest_log" ADD COLUMN IF NOT EXISTS version integer NULL;
ALTER TABLE "ai"."docs_ingest_log" ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL;
ALTER TABLE "ai"."docs_ingest_log" ADD COLUMN IF NOT EXISTS deleted_by text NULL;

-- Backfill + enforce NOT NULL on the audit contract columns.
UPDATE "ai"."docs_ingest_log" SET
    created_by = COALESCE(actor, 'system'),
    updated_at = COALESCE(updated_at, created_at, now()),
    updated_by = COALESCE(updated_by, actor, 'system'),
    version    = COALESCE(version, 1)
WHERE created_by IS NULL;

ALTER TABLE "ai"."docs_ingest_log" ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE "ai"."docs_ingest_log" ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE "ai"."docs_ingest_log" ALTER COLUMN updated_by SET NOT NULL;
ALTER TABLE "ai"."docs_ingest_log" ALTER COLUMN version SET NOT NULL;

-- The DAL `add` stamps created_*/updated_* but not version — same as every
-- other auditable entity, the initial value is a column default.
ALTER TABLE "ai"."docs_ingest_log" ALTER COLUMN version SET DEFAULT 1;

ALTER TABLE "ai"."docs_ingest_log" DROP COLUMN IF EXISTS actor;
