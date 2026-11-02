-- 20261107140000 — job_trigger display values.
--
-- The rename patch moved KEYS only (in-place, preserving values). This
-- patch updates the VALUES: entity labels (title/singular/plural), nav +
-- section labels, triggerForm strings, the triggers_changed event label,
-- and the field hints whose prose still said "rule". Label keys get
-- explicit per-language text; hint prose gets a scoped mechanical
-- substitution (the noun swap is grammatical in every shipped language).

BEGIN;

-- ─── entity labels ──────────────────────────────────────────────────
UPDATE job.translations SET value='Job Trigger', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key IN ('job.entities.job_trigger.title','job.entities.job_trigger.singular') AND language IN ('en-GB','en-US') AND deleted_at IS NULL;
UPDATE job.translations SET value='Trigger Job', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key IN ('job.entities.job_trigger.title','job.entities.job_trigger.singular') AND language='it-IT' AND deleted_at IS NULL;
UPDATE job.translations SET value='Job-Trigger', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key IN ('job.entities.job_trigger.title','job.entities.job_trigger.singular') AND language='de-DE' AND deleted_at IS NULL;
UPDATE job.translations SET value='Déclencheur de job', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key IN ('job.entities.job_trigger.title','job.entities.job_trigger.singular') AND language='fr-FR' AND deleted_at IS NULL;
UPDATE job.translations SET value='Trigger de job', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key IN ('job.entities.job_trigger.title','job.entities.job_trigger.singular') AND language='es-ES' AND deleted_at IS NULL;
UPDATE job.translations SET value='Trigger de job', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key IN ('job.entities.job_trigger.title','job.entities.job_trigger.singular') AND language='pt-PT' AND deleted_at IS NULL;

UPDATE job.translations SET value='Job Triggers', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.entities.job_trigger.plural' AND language IN ('en-GB','en-US') AND deleted_at IS NULL;
UPDATE job.translations SET value='Trigger Job', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.entities.job_trigger.plural' AND language='it-IT' AND deleted_at IS NULL;
UPDATE job.translations SET value='Job-Trigger', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.entities.job_trigger.plural' AND language='de-DE' AND deleted_at IS NULL;
UPDATE job.translations SET value='Déclencheurs de job', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.entities.job_trigger.plural' AND language='fr-FR' AND deleted_at IS NULL;
UPDATE job.translations SET value='Triggers de job', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.entities.job_trigger.plural' AND language='es-ES' AND deleted_at IS NULL;
UPDATE job.translations SET value='Triggers de job', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.entities.job_trigger.plural' AND language='pt-PT' AND deleted_at IS NULL;

-- ─── nav + section ──────────────────────────────────────────────────
UPDATE job.translations SET value='Triggers', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key IN ('job.jobs.nav_triggers','job.jobs.sections.triggers') AND language IN ('en-GB','en-US') AND deleted_at IS NULL;
UPDATE job.translations SET value='Trigger', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key IN ('job.jobs.nav_triggers','job.jobs.sections.triggers') AND language='it-IT' AND deleted_at IS NULL;
UPDATE job.translations SET value='Trigger', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key IN ('job.jobs.nav_triggers','job.jobs.sections.triggers') AND language='de-DE' AND deleted_at IS NULL;
UPDATE job.translations SET value='Déclencheurs', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key IN ('job.jobs.nav_triggers','job.jobs.sections.triggers') AND language='fr-FR' AND deleted_at IS NULL;
UPDATE job.translations SET value='Triggers', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key IN ('job.jobs.nav_triggers','job.jobs.sections.triggers') AND language='es-ES' AND deleted_at IS NULL;
UPDATE job.translations SET value='Triggers', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key IN ('job.jobs.nav_triggers','job.jobs.sections.triggers') AND language='pt-PT' AND deleted_at IS NULL;

-- ─── triggerForm ────────────────────────────────────────────────────
UPDATE job.translations SET value='New Job Trigger', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.jobs.triggerForm.title' AND language IN ('en-GB','en-US') AND deleted_at IS NULL;
UPDATE job.translations SET value='Nuovo trigger job', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.jobs.triggerForm.title' AND language='it-IT' AND deleted_at IS NULL;
UPDATE job.translations SET value='Neuer Job-Trigger', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.jobs.triggerForm.title' AND language='de-DE' AND deleted_at IS NULL;
UPDATE job.translations SET value='Nouveau déclencheur de job', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.jobs.triggerForm.title' AND language='fr-FR' AND deleted_at IS NULL;
UPDATE job.translations SET value='Nuevo trigger de job', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.jobs.triggerForm.title' AND language='es-ES' AND deleted_at IS NULL;
UPDATE job.translations SET value='Novo trigger de job', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.jobs.triggerForm.title' AND language='pt-PT' AND deleted_at IS NULL;

UPDATE job.translations SET value='Create Trigger', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.jobs.triggerForm.create' AND language IN ('en-GB','en-US') AND deleted_at IS NULL;
UPDATE job.translations SET value='Crea trigger', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.jobs.triggerForm.create' AND language='it-IT' AND deleted_at IS NULL;
UPDATE job.translations SET value='Trigger erstellen', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.jobs.triggerForm.create' AND language='de-DE' AND deleted_at IS NULL;
UPDATE job.translations SET value='Créer le déclencheur', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.jobs.triggerForm.create' AND language='fr-FR' AND deleted_at IS NULL;
UPDATE job.translations SET value='Crear trigger', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.jobs.triggerForm.create' AND language='es-ES' AND deleted_at IS NULL;
UPDATE job.translations SET value='Criar trigger', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.jobs.triggerForm.create' AND language='pt-PT' AND deleted_at IS NULL;

UPDATE job.translations SET value='Trigger created', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.jobs.triggerForm.created' AND language IN ('en-GB','en-US') AND deleted_at IS NULL;
UPDATE job.translations SET value='Trigger creato', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.jobs.triggerForm.created' AND language='it-IT' AND deleted_at IS NULL;
UPDATE job.translations SET value='Trigger erstellt', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.jobs.triggerForm.created' AND language='de-DE' AND deleted_at IS NULL;
UPDATE job.translations SET value='Déclencheur créé', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.jobs.triggerForm.created' AND language='fr-FR' AND deleted_at IS NULL;
UPDATE job.translations SET value='Trigger creado', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.jobs.triggerForm.created' AND language='es-ES' AND deleted_at IS NULL;
UPDATE job.translations SET value='Trigger criado', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.jobs.triggerForm.created' AND language='pt-PT' AND deleted_at IS NULL;

-- ─── event label ────────────────────────────────────────────────────
UPDATE job.translations SET value='Triggers changed', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.events.triggers_changed.name' AND language IN ('en-GB','en-US') AND deleted_at IS NULL;
UPDATE job.translations SET value='Trigger modificati', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.events.triggers_changed.name' AND language='it-IT' AND deleted_at IS NULL;
UPDATE job.translations SET value='Trigger geändert', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.events.triggers_changed.name' AND language='de-DE' AND deleted_at IS NULL;
UPDATE job.translations SET value='Déclencheurs modifiés', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.events.triggers_changed.name' AND language='fr-FR' AND deleted_at IS NULL;
UPDATE job.translations SET value='Triggers modificados', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.events.triggers_changed.name' AND language='es-ES' AND deleted_at IS NULL;
UPDATE job.translations SET value='Triggers modificados', updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE key='job.events.triggers_changed.name' AND language='pt-PT' AND deleted_at IS NULL;

-- ─── hint prose — scoped noun substitution per language ─────────────
-- en: Rules→Triggers, Rule→Trigger, rule→trigger
UPDATE job.translations
  SET value=replace(replace(replace(value,'Rules','Triggers'),'Rule','Trigger'),'rule','trigger'),
      updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE deleted_at IS NULL AND language IN ('en-GB','en-US')
    AND (key LIKE 'job.entities.job_trigger.hints.%' OR key='job.events.triggers_changed.desc')
    AND value ILIKE '%rule%';
-- it: regole→trigger, regola→trigger (capitalized variants too)
UPDATE job.translations
  SET value=replace(replace(replace(replace(value,'Regole','Trigger'),'regole','trigger'),'Regola','Trigger'),'regola','trigger'),
      updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE deleted_at IS NULL AND language='it-IT'
    AND (key LIKE 'job.entities.job_trigger.hints.%' OR key='job.events.triggers_changed.desc')
    AND value ILIKE '%regol%';
-- de: Regeln→Triggern, Regel→Trigger
UPDATE job.translations
  SET value=replace(replace(value,'Regeln','Triggern'),'Regel','Trigger'),
      updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE deleted_at IS NULL AND language='de-DE'
    AND (key LIKE 'job.entities.job_trigger.hints.%' OR key='job.events.triggers_changed.desc')
    AND value ILIKE '%Regel%';
-- fr: règles→déclencheurs, règle→déclencheur
UPDATE job.translations
  SET value=replace(replace(replace(replace(value,'Règles','Déclencheurs'),'règles','déclencheurs'),'Règle','Déclencheur'),'règle','déclencheur'),
      updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE deleted_at IS NULL AND language='fr-FR'
    AND (key LIKE 'job.entities.job_trigger.hints.%' OR key='job.events.triggers_changed.desc')
    AND value ILIKE '%règle%';
-- es: reglas→triggers, regla→trigger
UPDATE job.translations
  SET value=replace(replace(replace(replace(value,'Reglas','Triggers'),'reglas','triggers'),'Regla','Trigger'),'regla','trigger'),
      updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE deleted_at IS NULL AND language='es-ES'
    AND (key LIKE 'job.entities.job_trigger.hints.%' OR key='job.events.triggers_changed.desc')
    AND value ILIKE '%regla%';
-- pt: regras→triggers, regra→trigger
UPDATE job.translations
  SET value=replace(replace(replace(replace(value,'Regras','Triggers'),'regras','triggers'),'Regra','Trigger'),'regra','trigger'),
      updated_at=now(), updated_by='migration-trigger-labels', version=version+1
  WHERE deleted_at IS NULL AND language='pt-PT'
    AND (key LIKE 'job.entities.job_trigger.hints.%' OR key='job.events.triggers_changed.desc')
    AND value ILIKE '%regra%';

COMMIT;
