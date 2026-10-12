-- Fire-and-forget: ai.docs_ingest_log — one row per docs-pack ingest run
-- (startup / register / gateway_online / manual / dev_script). Powers the
-- admin "perché, da chi, quando" ingestion history. Idempotent.

CREATE TABLE IF NOT EXISTS "ai"."docs_ingest_log" (
    id            bigserial    PRIMARY KEY,
    repo          text         NULL,
    service_code  text         NOT NULL,
    trigger_source text        NOT NULL,
    ok            boolean      NOT NULL,
    stats         jsonb        NOT NULL DEFAULT '{}'::jsonb,
    error         text         NULL,
    created_at    timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS docs_ingest_log_created_idx ON "ai"."docs_ingest_log" (created_at DESC);
CREATE INDEX IF NOT EXISTS docs_ingest_log_repo_idx ON "ai"."docs_ingest_log" (repo);
