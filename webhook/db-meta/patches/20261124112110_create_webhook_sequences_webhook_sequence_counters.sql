-- Primebrick: entity → database patch
-- pb:requires-review
-- generatedAt: 2026-11-24T11:21:10.733Z

CREATE SCHEMA IF NOT EXISTS "webhook";

CREATE TABLE IF NOT EXISTS "webhook"."sequences" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text DEFAULT 'system' NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text DEFAULT 'system' NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "uuid" uuid DEFAULT uuidv7() NOT NULL,
  "name" varchar(100) NOT NULL,
  "pattern" text NOT NULL,
  "step" int8 DEFAULT 1 NOT NULL,
  "start" int8 DEFAULT 1 NOT NULL,
  "tz" varchar(100) DEFAULT 'UTC' NOT NULL,
  "description_key" varchar(200),
  "sez" varchar(200),
  "sez2" varchar(200),
  "sez3" varchar(200),
  "binding_key" varchar(130),
  "revive_every" varchar(30),
  "revive_grace" varchar(30),
  "revive_slot" varchar(10),
  "expire_at" timestamptz,
  "switch_at" timestamptz,
  "default_from" timestamptz,
  "revived_from" uuid,
  "revived_at" timestamptz,
  "revived_by" varchar(100),
  PRIMARY KEY ("uuid")
);

CREATE TABLE IF NOT EXISTS "webhook"."sequences_audit" (
  "uuid" uuid NOT NULL DEFAULT uuidv7(),
  "entity_uuid" uuid NOT NULL,
  "action" text NOT NULL,
  "changed_at" timestamptz NOT NULL,
  "changed_by" text NOT NULL DEFAULT 'system',
  "version" integer NOT NULL,
  "delta" jsonb NOT NULL,
  PRIMARY KEY ("uuid", "changed_at")
) PARTITION BY RANGE ("changed_at");

SELECT partman.create_parent('webhook.sequences_audit', 'changed_at', '1 month', 'range');
UPDATE partman.part_config SET retention = '12 months', retention_keep_table = false WHERE parent_table = 'webhook.sequences_audit';

CREATE INDEX IF NOT EXISTS "sequences_audit_entity_uuid_idx" ON "webhook"."sequences_audit" ("entity_uuid");
CREATE INDEX IF NOT EXISTS "sequences_audit_action_idx" ON "webhook"."sequences_audit" ("action");

CREATE SCHEMA IF NOT EXISTS "webhook";

CREATE TABLE IF NOT EXISTS "webhook"."sequence_counters" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text DEFAULT 'system' NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text DEFAULT 'system' NOT NULL,
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

CREATE UNIQUE INDEX IF NOT EXISTS "sequence_counters_identity" ON "webhook"."sequence_counters" ("sequence_uuid", "period_key", "partition_key");

-- ── review section (runs only after approval) ──
-- set default "created_by" → 'system' (db=(none))
ALTER TABLE "webhook"."config_entries" ALTER COLUMN "created_by" SET DEFAULT 'system';
-- set default "updated_by" → 'system' (db=(none))
ALTER TABLE "webhook"."config_entries" ALTER COLUMN "updated_by" SET DEFAULT 'system';
-- drop default "type" (db='string')
ALTER TABLE "webhook"."config_entries" ALTER COLUMN "type" DROP DEFAULT;

-- WARN: DB-only index "config_entries_uuid_uq" on webhook.config_entries — not dropped
-- WARN: DB-only index "config_entries_deleted_at_idx" on webhook.config_entries — not dropped
