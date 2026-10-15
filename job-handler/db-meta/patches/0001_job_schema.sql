-- 0001 — job schema: primebrick-job domain tables.
--
-- job_rules     — admin-managed business event→schedule rules
-- job_schedules — registry of armed JetStream schedules (sole writer: this service)
-- job_runs      — execution history (fire → terminal status, RFC-style errors)
-- config_entries — mandatory microservice config table

BEGIN;

CREATE SCHEMA IF NOT EXISTS "job";

CREATE TABLE IF NOT EXISTS "job"."job_rules" (
  "id"                bigint GENERATED ALWAYS AS IDENTITY,
  "uuid"              uuid NOT NULL DEFAULT gen_random_uuid(),
  "name"              varchar(200) NOT NULL,
  "event_subject"     text NOT NULL,
  "filter"            jsonb,
  "schedule_spec"     text NOT NULL,
  "target_subject"    text NOT NULL,
  "execution_context" varchar(10) NOT NULL DEFAULT 'user',
  "source_subject"    text,
  "enabled"           boolean NOT NULL DEFAULT true,
  "created_at"        timestamptz NOT NULL DEFAULT now(),
  "created_by"        text NOT NULL DEFAULT 'system',
  "updated_at"        timestamptz NOT NULL DEFAULT now(),
  "updated_by"        text NOT NULL DEFAULT 'system',
  "version"           integer NOT NULL DEFAULT 1,
  "deleted_at"        timestamptz,
  "deleted_by"        text,
  PRIMARY KEY ("id"),
  CONSTRAINT "job_rules_uuid_uq" UNIQUE ("uuid"),
  CONSTRAINT "job_rules_name_uq" UNIQUE ("name")
);

CREATE TABLE IF NOT EXISTS "job"."job_schedules" (
  "id"               bigint GENERATED ALWAYS AS IDENTITY,
  "uuid"             uuid NOT NULL DEFAULT gen_random_uuid(),
  "schedule_subject" text NOT NULL,
  "service_code"     text NOT NULL,
  "job_name"         text NOT NULL,
  "kind"             varchar(30) NOT NULL,
  "lane"             varchar(10) NOT NULL,
  "schedule_spec"    text NOT NULL,
  "target_subject"   text NOT NULL,
  "status"           varchar(20) NOT NULL DEFAULT 'armed',
  "initiator"        text,
  "rule_uuid"        uuid,
  "armed_at"         timestamptz,
  "disarmed_at"      timestamptz,
  "created_at"       timestamptz NOT NULL DEFAULT now(),
  "created_by"       text NOT NULL DEFAULT 'system',
  "updated_at"       timestamptz NOT NULL DEFAULT now(),
  "updated_by"       text NOT NULL DEFAULT 'system',
  "version"          integer NOT NULL DEFAULT 1,
  PRIMARY KEY ("id"),
  CONSTRAINT "job_schedules_uuid_uq" UNIQUE ("uuid"),
  CONSTRAINT "job_schedules_subject_uq" UNIQUE ("schedule_subject")
);

CREATE INDEX IF NOT EXISTS "job_schedules_service_idx"
  ON "job"."job_schedules" ("service_code");
CREATE INDEX IF NOT EXISTS "job_schedules_status_idx"
  ON "job"."job_schedules" ("status");

CREATE TABLE IF NOT EXISTS "job"."job_runs" (
  "id"               bigint GENERATED ALWAYS AS IDENTITY,
  "uuid"             uuid NOT NULL DEFAULT gen_random_uuid(),
  "schedule_subject" text NOT NULL,
  "service_code"     text NOT NULL,
  "job_name"         text NOT NULL,
  "lane"             varchar(10) NOT NULL,
  "status"           varchar(20) NOT NULL,
  "error_code"       text,
  "error_detail"     text,
  "duration_ms"      bigint,
  "redelivery_count" integer,
  "initiator"        text,
  "report"           jsonb,
  "created_at"       timestamptz NOT NULL DEFAULT now(),
  "created_by"       text NOT NULL DEFAULT 'system',
  "updated_at"       timestamptz NOT NULL DEFAULT now(),
  "updated_by"       text NOT NULL DEFAULT 'system',
  "version"          integer NOT NULL DEFAULT 1,
  PRIMARY KEY ("id"),
  CONSTRAINT "job_runs_uuid_uq" UNIQUE ("uuid")
);

CREATE INDEX IF NOT EXISTS "job_runs_schedule_idx"
  ON "job"."job_runs" ("schedule_subject");
CREATE INDEX IF NOT EXISTS "job_runs_status_idx"
  ON "job"."job_runs" ("status");
CREATE INDEX IF NOT EXISTS "job_runs_created_idx"
  ON "job"."job_runs" ("created_at" DESC);

-- Mandatory microservice config table (same shape as every US).
CREATE TABLE IF NOT EXISTS "job"."config_entries" (
  "id"              bigint GENERATED ALWAYS AS IDENTITY,
  "uuid"            uuid NOT NULL DEFAULT gen_random_uuid(),
  "key"             varchar(100) NOT NULL,
  "value"           text,
  "type"            varchar(50) NOT NULL DEFAULT 'string',
  "type_config"     text,
  "label_key"       varchar(100),
  "description_key" varchar(100),
  "reserved"        boolean NOT NULL DEFAULT false,
  "group_key"       varchar(100),
  "created_at"      timestamptz NOT NULL DEFAULT now(),
  "created_by"      text NOT NULL DEFAULT 'system',
  "updated_at"      timestamptz NOT NULL DEFAULT now(),
  "updated_by"      text NOT NULL DEFAULT 'system',
  "version"         integer NOT NULL DEFAULT 1,
  "deleted_at"      timestamptz,
  "deleted_by"      text,
  PRIMARY KEY ("id"),
  CONSTRAINT "config_entries_uuid_uq" UNIQUE ("uuid"),
  CONSTRAINT "config_entries_key_uq" UNIQUE ("key")
);

COMMIT;
