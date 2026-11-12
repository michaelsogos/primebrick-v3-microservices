-- 0001 — job schema baseline (consolidated first-install script).
-- Entity-generated DDL + handwritten supplement for registry-external objects.

-- Primebrick: entity → database patch
-- generatedAt: 2026-11-11T15:54:09.721Z

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE SCHEMA IF NOT EXISTS "partman";
CREATE EXTENSION IF NOT EXISTS "pg_partman" SCHEMA "partman";

CREATE SCHEMA IF NOT EXISTS "job";

CREATE TABLE IF NOT EXISTS "job"."config_entries" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "key" varchar(100) NOT NULL,
  "value" text,
  "type" varchar(50) NOT NULL,
  "type_config" text,
  "label_key" varchar(100),
  "description_key" varchar(100),
  "reserved" boolean NOT NULL,
  "group_key" varchar(100),
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "config_entries_uuid_uq" ON "job"."config_entries" ("uuid");
CREATE UNIQUE INDEX IF NOT EXISTS "config_entries_key_uq" ON "job"."config_entries" ("key");

CREATE SCHEMA IF NOT EXISTS "job";

CREATE TABLE IF NOT EXISTS "job"."job_schedules" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "schedule_subject" text NOT NULL,
  "service_code" text NOT NULL,
  "job_name" text NOT NULL,
  "kind" varchar(30) NOT NULL,
  "lane" varchar(10) NOT NULL,
  "schedule_spec" text NOT NULL,
  "schedule_type" varchar(10) NOT NULL,
  "target_subject" text NOT NULL,
  "status" varchar(20) NOT NULL,
  "initiator" text,
  "trigger_uuid" uuid,
  "armed_at" timestamptz,
  "disarmed_at" timestamptz,
  "fired_at" timestamptz,
  "expires_at" timestamptz,
  "next_run_at" timestamptz,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "job_schedules_uuid_uq" ON "job"."job_schedules" ("uuid");
CREATE UNIQUE INDEX IF NOT EXISTS "job_schedules_schedule_subject_uq" ON "job"."job_schedules" ("schedule_subject");

CREATE SCHEMA IF NOT EXISTS "job";

CREATE TABLE IF NOT EXISTS "job"."job_runs" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "schedule_subject" text,
  "service_code" text NOT NULL,
  "job_name" text NOT NULL,
  "lane" varchar(10) NOT NULL,
  "status" varchar(20) NOT NULL,
  "fire_seq" int8,
  "error_code" text,
  "error_detail" text,
  "duration_ms" int8,
  "redelivery_count" int4,
  "initiator" text,
  "report" jsonb,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "job_runs_uuid_uq" ON "job"."job_runs" ("uuid");

CREATE SCHEMA IF NOT EXISTS "job";

CREATE TABLE IF NOT EXISTS "job"."job_triggers" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "id" bigint generated always as identity NOT NULL,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(200) NOT NULL,
  "event_subject" text,
  "filter" jsonb,
  "schedule_spec" text,
  "target_subject" text NOT NULL,
  "payload_map" jsonb,
  "execution_context" varchar(10) NOT NULL,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "job_triggers_uuid_uq" ON "job"."job_triggers" ("uuid");
CREATE UNIQUE INDEX IF NOT EXISTS "job_triggers_name_uq" ON "job"."job_triggers" ("name");

CREATE TABLE IF NOT EXISTS "job"."job_triggers_audit" (
  "id" bigint generated always as identity NOT NULL,
  "entity_id" bigint NOT NULL,
  "entity_uuid" uuid NOT NULL,
  "action" text NOT NULL,
  "changed_at" timestamptz NOT NULL,
  "changed_by" text NOT NULL DEFAULT 'system',
  "version" integer NOT NULL,
  "delta" jsonb NOT NULL,
  PRIMARY KEY ("id", "changed_at")
) PARTITION BY RANGE ("changed_at");

SELECT partman.create_parent('job.job_triggers_audit', 'changed_at', '1 month', 'range');

CREATE INDEX IF NOT EXISTS "job_triggers_audit_entity_uuid_idx" ON "job"."job_triggers_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "job_triggers_audit_action_idx" ON "job"."job_triggers_audit" ("action");

-- ─── Handwritten supplement ──────────────────────────────────────────────
-- Objects the entity registry does not declare:
--   • job.translations — CRUD via entity route, excluded from registry by design
--   • DB-only indexes (not expressible by entity decorators today)

CREATE TABLE IF NOT EXISTS job.translations (
    id bigint NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    key character varying(255) NOT NULL,
    language character varying(10) NOT NULL,
    value text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by character varying(255) NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by character varying(255),
    CONSTRAINT translations_pkey PRIMARY KEY (id),
    CONSTRAINT translations_uuid_key UNIQUE (uuid),
    CONSTRAINT translations_key_shape CHECK (((key)::text ~ '^job(\.[a-z0-9_]+)+$'::text))
);

CREATE SEQUENCE IF NOT EXISTS job.translations_id_seq;
ALTER SEQUENCE job.translations_id_seq OWNED BY job.translations.id;
ALTER TABLE ONLY job.translations ALTER COLUMN id SET DEFAULT nextval('job.translations_id_seq'::regclass);

CREATE UNIQUE INDEX IF NOT EXISTS job_translations_key_language_uidx ON job.translations USING btree (key, language) WHERE (deleted_at IS NULL);
CREATE INDEX IF NOT EXISTS job_translations_language_idx ON job.translations USING btree (language) WHERE (deleted_at IS NULL);

CREATE INDEX IF NOT EXISTS job_runs_created_idx ON job.job_runs USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS job_runs_schedule_idx ON job.job_runs USING btree (schedule_subject);
CREATE INDEX IF NOT EXISTS job_runs_status_idx ON job.job_runs USING btree (status);
CREATE INDEX IF NOT EXISTS job_schedules_service_idx ON job.job_schedules USING btree (service_code);
CREATE INDEX IF NOT EXISTS job_schedules_status_idx ON job.job_schedules USING btree (status);
