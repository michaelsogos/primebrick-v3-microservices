-- Primebrick: Job module — remove job_rules.source_subject entirely.
--
-- The fire-time "Nats-Schedule-Source" indirection was never consumed at
-- runtime (the rules engine intentionally never forwarded it) and the
-- capability is superseded by the future workflow engine. The field is
-- removed everywhere: form placement, entity meta, entity class, DB
-- column and translation keys.

BEGIN;

ALTER TABLE "job"."job_rules" DROP COLUMN IF EXISTS "source_subject";

DELETE FROM "job"."translations"
WHERE key IN (
  'job.entities.job_rule.fields.source_subject',
  'job.entities.job_rule.hints.source_subject',
  'job.entities.job_rule.hints.source_subject_title'
);

COMMIT;
