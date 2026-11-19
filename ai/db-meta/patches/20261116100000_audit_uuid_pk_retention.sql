-- Primebrick: audit rows get a uuidv7 `uuid` row key, PK becomes
-- (uuid, changed_at) and the surrogate bigint `id` is eradicated — same
-- shape the DAL now emits for every {entity}_audit table.
--
-- part_config still points ai_cerebellum_audit / ai_models_audit at their
-- pre-move 'public.*' names — repoint to the ai schema parents and drop
-- the stale public templates. The ai templates were never generated —
-- create them from the migrated parents so future partitions get the
-- uuid shape.
--
-- Audit retention is intrinsic: every {entity}_audit parent keeps 12
-- months and drops expired partitions (retention_keep_table = false).

ALTER TABLE "ai"."ai_cerebellum_audit" ADD COLUMN "uuid" uuid NOT NULL DEFAULT uuidv7();
ALTER TABLE "ai"."ai_cerebellum_audit" DROP CONSTRAINT "ai_cerebellum_audit_pkey";
ALTER TABLE "ai"."ai_cerebellum_audit" ADD PRIMARY KEY ("uuid", "changed_at");
ALTER TABLE "ai"."ai_cerebellum_audit" DROP COLUMN "id";

ALTER TABLE "ai"."ai_models_audit" ADD COLUMN "uuid" uuid NOT NULL DEFAULT uuidv7();
ALTER TABLE "ai"."ai_models_audit" DROP CONSTRAINT "ai_models_audit_pkey";
ALTER TABLE "ai"."ai_models_audit" ADD PRIMARY KEY ("uuid", "changed_at");
ALTER TABLE "ai"."ai_models_audit" DROP COLUMN "id";

UPDATE partman.part_config
   SET parent_table = 'ai.ai_cerebellum_audit',
       template_table = 'partman.template_ai_ai_cerebellum_audit'
 WHERE parent_table = 'public.ai_cerebellum_audit';
UPDATE partman.part_config
   SET parent_table = 'ai.ai_models_audit',
       template_table = 'partman.template_ai_ai_models_audit'
 WHERE parent_table = 'public.ai_models_audit';

DROP TABLE IF EXISTS "partman"."template_public_ai_cerebellum_audit";
DROP TABLE IF EXISTS "partman"."template_public_ai_models_audit";
CREATE TABLE IF NOT EXISTS "partman"."template_ai_ai_cerebellum_audit"
  (LIKE "ai"."ai_cerebellum_audit" INCLUDING ALL);
CREATE TABLE IF NOT EXISTS "partman"."template_ai_ai_models_audit"
  (LIKE "ai"."ai_models_audit" INCLUDING ALL);

UPDATE partman.part_config
   SET retention = '12 months', retention_keep_table = false
 WHERE parent_table IN ('ai.ai_cerebellum_audit', 'ai.ai_models_audit');
