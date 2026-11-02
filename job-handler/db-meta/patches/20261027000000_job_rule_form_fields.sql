-- Primebrick: Job module — job_rule entity-form field labels.
-- The host EntityFormPage archetype renders `/system/job/rules/create` from
-- `jobRuleMeta` + `page_props.form`; the two newly-declared columns
-- (`filter`, `source_subject`) need their canonical field labels.
-- Convention: `job.entities.job_rule.fields.<column>` in job.translations
-- (namespace boundary — job.translations may only contain `job.*` keys).

INSERT INTO job.translations (key, language, value, created_by, updated_by) VALUES
  ('job.entities.job_rule.fields.filter', 'en-GB', 'Filter', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.fields.filter', 'en-US', 'Filter', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.fields.filter', 'it-IT', 'Filtro', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.fields.filter', 'de-DE', 'Filter', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.fields.filter', 'fr-FR', 'Filtre', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.fields.filter', 'es-ES', 'Filtro', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.fields.filter', 'pt-PT', 'Filtro', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.fields.source_subject', 'en-GB', 'Source Subject', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.fields.source_subject', 'en-US', 'Source Subject', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.fields.source_subject', 'it-IT', 'Soggetto Sorgente', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.fields.source_subject', 'de-DE', 'Quell-Subject', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.fields.source_subject', 'fr-FR', 'Sujet source', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.fields.source_subject', 'es-ES', 'Asunto de origen', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.fields.source_subject', 'pt-PT', 'Assunto de origem', 'initial-setup', 'initial-setup');
