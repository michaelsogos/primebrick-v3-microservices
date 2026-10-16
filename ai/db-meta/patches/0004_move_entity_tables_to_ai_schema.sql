-- 0004 — Move AI-owned entity tables from `public` (BE-owned) to `ai`
-- (service-owned). Data preserved: ALTER TABLE ... SET SCHEMA rewrites
-- catalog entries — no dump/reload. No cross-schema FKs exist (verified
-- via information_schema.referential_constraints before this patch).
--
-- Audit parents are partitioned monthly — every partition is moved too
-- (SET SCHEMA on the parent does NOT move partitions).
--
-- Idempotent: each statement is skipped when the table is already in ai.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'ai_models',
    'ai_models_audit',
    'ai_models_audit_default',
    'ai_models_audit_p20260501',
    'ai_models_audit_p20260601',
    'ai_models_audit_p20260701',
    'ai_models_audit_p20260801',
    'ai_models_audit_p20260901',
    'ai_models_audit_p20261001',
    'ai_models_audit_p20261101',
    'ai_models_audit_p20261201',
    'ai_models_audit_p20270101',
    'ai_models_test_scores_backup_20260921',
    'ai_cerebellum',
    'ai_cerebellum_audit',
    'ai_cerebellum_audit_default',
    'ai_cerebellum_audit_p20260501',
    'ai_cerebellum_audit_p20260601',
    'ai_cerebellum_audit_p20260701',
    'ai_cerebellum_audit_p20260801',
    'ai_cerebellum_audit_p20260901',
    'ai_cerebellum_audit_p20261001',
    'ai_cerebellum_audit_p20261101',
    'ai_cerebellum_audit_p20261201',
    'ai_cerebellum_audit_p20270101'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I SET SCHEMA ai', t);
    END IF;
  END LOOP;
END $$;
