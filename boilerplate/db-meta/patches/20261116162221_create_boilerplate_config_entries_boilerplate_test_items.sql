-- Primebrick: entity → database patch
-- generatedAt: 2026-11-16T16:22:21.346Z

CREATE SCHEMA IF NOT EXISTS "boilerplate";

CREATE TABLE IF NOT EXISTS "boilerplate"."config_entries" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "uuid" uuid DEFAULT uuidv7() NOT NULL,
  "key" varchar(100) NOT NULL,
  "value" text,
  "type" varchar(50) NOT NULL,
  "type_config" text,
  "label_key" varchar(100),
  "description_key" varchar(100),
  "reserved" boolean NOT NULL,
  "group_key" varchar(100),
  PRIMARY KEY ("uuid")
);

CREATE UNIQUE INDEX IF NOT EXISTS "config_entries_key_uq" ON "boilerplate"."config_entries" ("key");

CREATE SCHEMA IF NOT EXISTS "boilerplate";

CREATE TABLE IF NOT EXISTS "boilerplate"."test_items" (
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" text NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "updated_by" text NOT NULL,
  "version" int4 DEFAULT 1 NOT NULL,
  "deleted_at" timestamptz,
  "deleted_by" text,
  "uuid" uuid DEFAULT uuidv7() NOT NULL,
  "name" varchar(120) NOT NULL,
  "note" text,
  "enabled" boolean NOT NULL,
  PRIMARY KEY ("uuid")
);

CREATE UNIQUE INDEX IF NOT EXISTS "test_items_name_uq" ON "boilerplate"."test_items" ("name");
