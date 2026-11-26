-- Primebrick: entity → database patch
-- generatedAt: 2026-11-21T12:19:55.136Z

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."sequences" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "uuid" uuid DEFAULT uuidv7() NOT NULL,
  "code" varchar(100) NOT NULL,
  "pattern" text NOT NULL,
  "step" int8 NOT NULL,
  "start" int8 NOT NULL,
  "tz" varchar(100),
  "label_key" varchar(100),
  "description_key" varchar(200),
  PRIMARY KEY ("uuid")
);

CREATE UNIQUE INDEX IF NOT EXISTS "sequences_code_uq" ON "crm"."sequences" ("code");

CREATE TABLE IF NOT EXISTS "crm"."sequences_audit" (
  "uuid" uuid NOT NULL DEFAULT uuidv7(),
  "entity_uuid" uuid NOT NULL,
  "action" text NOT NULL,
  "changed_at" timestamptz NOT NULL,
  "changed_by" text NOT NULL DEFAULT 'system',
  "version" integer NOT NULL,
  "delta" jsonb NOT NULL,
  PRIMARY KEY ("uuid", "changed_at")
) PARTITION BY RANGE ("changed_at");

SELECT partman.create_parent('crm.sequences_audit', 'changed_at', '1 month', 'range');
UPDATE partman.part_config SET retention = '12 months', retention_keep_table = false WHERE parent_table = 'crm.sequences_audit';

CREATE INDEX IF NOT EXISTS "sequences_audit_entity_uuid_idx" ON "crm"."sequences_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "sequences_audit_action_idx" ON "crm"."sequences_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "crm";

CREATE TABLE IF NOT EXISTS "crm"."sequence_counters" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "uuid" uuid DEFAULT uuidv7() NOT NULL,
  "sequence_uuid" uuid NOT NULL,
  "period_key" varchar(64) DEFAULT '' NOT NULL,
  "partition_key" varchar(255) DEFAULT '' NOT NULL,
  "counter" int8 NOT NULL,
  "last_alloc_at" timestamptz,
  "last_alloc_by" varchar(100),
  "last_alloc_count" int8,
  PRIMARY KEY ("uuid")
);

CREATE UNIQUE INDEX IF NOT EXISTS "sequence_counters_identity" ON "crm"."sequence_counters" ("sequence_uuid", "period_key", "partition_key");
