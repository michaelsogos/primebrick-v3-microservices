-- 20261107120000 — job_rule → job_trigger unification.
--
-- The declaration entity absorbs all three trigger intents (event+schedule
-- gate, event-only immediate, schedule-only timer — the latter replaces
-- `kind:"manual"` arms). `event_subject`/`schedule_spec` become nullable:
-- at-least-one is enforced in code. `job_schedules` stays the engine's
-- armed-state mirror; its `rule_uuid` link column follows the rename.
--
-- Translation keys follow the entity/nav/event renames IN PLACE (UPDATE
-- preserves values + languages + audit columns — no reseed): entity
-- segment job_rule→job_trigger, nav_rules→nav_triggers, sections.rules→
-- sections.triggers, ruleForm→triggerForm, events.rules_changed→
-- triggers_changed.
--
-- Permission keys `access.system.job.rules*` derive from the renamed
-- routes (`/system/job/triggers*`) — wildcard-granted roles
-- (`access.system.*`) are unaffected.

BEGIN;

-- ─── table + audit rename ────────────────────────────────────────────
ALTER TABLE "job"."job_rules" RENAME TO "job_triggers";
ALTER TABLE "job"."job_rules_audit" RENAME TO "job_triggers_audit";
ALTER TABLE "job"."job_rules_audit_default" RENAME TO "job_triggers_audit_default";

ALTER TABLE "job"."job_triggers" RENAME CONSTRAINT "job_rules_pkey" TO "job_triggers_pkey";
ALTER TABLE "job"."job_triggers" RENAME CONSTRAINT "job_rules_uuid_uq" TO "job_triggers_uuid_uq";
ALTER TABLE "job"."job_triggers" RENAME CONSTRAINT "job_rules_name_uq" TO "job_triggers_name_uq";
ALTER TABLE "job"."job_triggers_audit" RENAME CONSTRAINT "job_rules_audit_pkey" TO "job_triggers_audit_pkey";

ALTER INDEX "job"."job_rules_audit_entity_uuid_idx" RENAME TO "job_triggers_audit_entity_uuid_idx";
ALTER INDEX "job"."job_rules_audit_action_idx" RENAME TO "job_triggers_audit_action_idx";

-- ─── mutually-mandatory pair → nullable at rest ─────────────────────
ALTER TABLE "job"."job_triggers" ALTER COLUMN "event_subject" DROP NOT NULL;
ALTER TABLE "job"."job_triggers" ALTER COLUMN "schedule_spec" DROP NOT NULL;

-- ─── schedules→trigger link ─────────────────────────────────────────
ALTER TABLE "job"."job_schedules" RENAME COLUMN "rule_uuid" TO "trigger_uuid";
-- Materialized mirror rows follow the new kind vocabulary.
UPDATE "job"."job_schedules" SET kind = 'trigger' WHERE kind = 'rule';

-- ─── pg_partman registration follows the audit rename ───────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'partman' AND table_name = 'part_config'
  ) THEN
    UPDATE partman.part_config
      SET parent_table = 'job.job_triggers_audit'
      WHERE parent_table = 'job.job_rules_audit';
  END IF;
END $$;

-- ─── translation key renames (in place — values/audits preserved) ────
UPDATE "job"."translations"
  SET key = 'job.entities.job_trigger.' || substring(key from 'job\.entities\.job_rule\.(.+)$')
  WHERE key LIKE 'job.entities.job_rule.%';
UPDATE "job"."translations"
  SET key = 'job.jobs.nav_triggers' WHERE key = 'job.jobs.nav_rules';
UPDATE "job"."translations"
  SET key = 'job.jobs.sections.triggers' WHERE key = 'job.jobs.sections.rules';
UPDATE "job"."translations"
  SET key = 'job.jobs.triggerForm.' || substring(key from 'job\.jobs\.ruleForm\.(.+)$')
  WHERE key LIKE 'job.jobs.ruleForm.%';
UPDATE "job"."translations"
  SET key = 'job.events.triggers_changed.' || substring(key from 'job\.events\.rules_changed\.(.+)$')
  WHERE key LIKE 'job.events.rules_changed.%';
-- kind badge: rule → trigger (key + displayed value).
UPDATE "job"."translations"
  SET key = 'job.entities.job_schedule.status.trigger'
  WHERE key = 'job.entities.job_schedule.status.rule';
UPDATE "job"."translations" SET value = 'Trigger', updated_at = now(), updated_by = 'migration-job-trigger-rename', version = version + 1
  WHERE key = 'job.entities.job_schedule.status.trigger' AND language IN ('en-GB', 'en-US') AND deleted_at IS NULL;
UPDATE "job"."translations" SET value = 'Trigger', updated_at = now(), updated_by = 'migration-job-trigger-rename', version = version + 1
  WHERE key = 'job.entities.job_schedule.status.trigger' AND language = 'it-IT' AND deleted_at IS NULL;
UPDATE "job"."translations" SET value = 'Trigger', updated_at = now(), updated_by = 'migration-job-trigger-rename', version = version + 1
  WHERE key = 'job.entities.job_schedule.status.trigger' AND language = 'de-DE' AND deleted_at IS NULL;
UPDATE "job"."translations" SET value = 'Trigger', updated_at = now(), updated_by = 'migration-job-trigger-rename', version = version + 1
  WHERE key = 'job.entities.job_schedule.status.trigger' AND language = 'fr-FR' AND deleted_at IS NULL;
UPDATE "job"."translations" SET value = 'Trigger', updated_at = now(), updated_by = 'migration-job-trigger-rename', version = version + 1
  WHERE key = 'job.entities.job_schedule.status.trigger' AND language = 'es-ES' AND deleted_at IS NULL;
UPDATE "job"."translations" SET value = 'Trigger', updated_at = now(), updated_by = 'migration-job-trigger-rename', version = version + 1
  WHERE key = 'job.entities.job_schedule.status.trigger' AND language = 'pt-PT' AND deleted_at IS NULL;

-- ─── new badge value: execution_context "me" (7 languages) ──────────
INSERT INTO job.translations (key, language, value, created_by, updated_by) VALUES
  ('job.entities.job_trigger.status.me', 'en-GB', 'Me', 'migration-job-trigger-rename', 'migration-job-trigger-rename'),
  ('job.entities.job_trigger.status.me', 'en-US', 'Me', 'migration-job-trigger-rename', 'migration-job-trigger-rename'),
  ('job.entities.job_trigger.status.me', 'it-IT', 'Io', 'migration-job-trigger-rename', 'migration-job-trigger-rename'),
  ('job.entities.job_trigger.status.me', 'de-DE', 'Ich', 'migration-job-trigger-rename', 'migration-job-trigger-rename'),
  ('job.entities.job_trigger.status.me', 'fr-FR', 'Moi', 'migration-job-trigger-rename', 'migration-job-trigger-rename'),
  ('job.entities.job_trigger.status.me', 'es-ES', 'Yo', 'migration-job-trigger-rename', 'migration-job-trigger-rename'),
  ('job.entities.job_trigger.status.me', 'pt-PT', 'Eu', 'migration-job-trigger-rename', 'migration-job-trigger-rename')
ON CONFLICT DO NOTHING;

-- ─── execution_context hint — now describes all three lanes ─────────
UPDATE "job"."translations" SET value = '`user` runs the action as the triggering user (with their permissions); `me` runs as the trigger''s author — identity resolved fresh at dispatch time; `system` runs with module privileges. Must match the lane in the destination subject.', updated_at = now(), updated_by = 'migration-job-trigger-rename', version = version + 1
  WHERE key = 'job.entities.job_trigger.hints.execution_context' AND language IN ('en-GB', 'en-US') AND deleted_at IS NULL;
UPDATE "job"."translations" SET value = '`user` esegue l''azione come l''utente che ha innescato (con i suoi permessi); `me` come l''autore del trigger — identità risolta fresca al momento dell''esecuzione; `system` con i privilegi del modulo. Deve corrispondere alla lane nel soggetto destinazione.', updated_at = now(), updated_by = 'migration-job-trigger-rename', version = version + 1
  WHERE key = 'job.entities.job_trigger.hints.execution_context' AND language = 'it-IT' AND deleted_at IS NULL;
UPDATE "job"."translations" SET value = '`user` führt die Aktion als der auslösende Benutzer aus (mit dessen Berechtigungen); `me` als der Autor des Triggers — Identität wird zum Ausführungszeitpunkt frisch aufgelöst; `system` mit Modulprivilegien. Muss zur Lane im Ziel-Subject passen.', updated_at = now(), updated_by = 'migration-job-trigger-rename', version = version + 1
  WHERE key = 'job.entities.job_trigger.hints.execution_context' AND language = 'de-DE' AND deleted_at IS NULL;
UPDATE "job"."translations" SET value = '`user` exécute l''action comme l''utilisateur déclencheur (avec ses permissions) ; `me` comme l''auteur du déclencheur — identité résolue à jour au moment de l''exécution ; `system` avec les privilèges du module. Doit correspondre à la lane du sujet de destination.', updated_at = now(), updated_by = 'migration-job-trigger-rename', version = version + 1
  WHERE key = 'job.entities.job_trigger.hints.execution_context' AND language = 'fr-FR' AND deleted_at IS NULL;
UPDATE "job"."translations" SET value = '`user` ejecuta la acción como el usuario que disparó (con sus permisos); `me` como el autor del trigger — identidad resuelta al momento de la ejecución; `system` con privilegios del módulo. Debe coincidir con la lane del asunto de destino.', updated_at = now(), updated_by = 'migration-job-trigger-rename', version = version + 1
  WHERE key = 'job.entities.job_trigger.hints.execution_context' AND language = 'es-ES' AND deleted_at IS NULL;
UPDATE "job"."translations" SET value = '`user` executa a ação como o usuário que disparou (com suas permissões); `me` como o autor do trigger — identidade resolvida no momento da execução; `system` com privilégios do módulo. Deve corresponder à lane no assunto de destino.', updated_at = now(), updated_by = 'migration-job-trigger-rename', version = version + 1
  WHERE key = 'job.entities.job_trigger.hints.execution_context' AND language = 'pt-PT' AND deleted_at IS NULL;

COMMIT;
