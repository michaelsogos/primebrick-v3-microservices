-- Primebrick: Job module — rule-creation form labels (/jobs/rules/new).
--
-- The remote rule form reuses the canonical field labels at
-- job.entities.job_rule.fields.*; these are its page-level keys.

INSERT INTO job.translations (key, language, value, created_by, updated_by) VALUES
  ('job.jobs.ruleForm.title', 'en-GB', 'New Job Rule', 'initial-setup', 'initial-setup'),
  ('job.jobs.ruleForm.title', 'en-US', 'New Job Rule', 'initial-setup', 'initial-setup'),
  ('job.jobs.ruleForm.title', 'it-IT', 'Nuova regola job', 'initial-setup', 'initial-setup'),
  ('job.jobs.ruleForm.title', 'de-DE', 'Neue Job-Regel', 'initial-setup', 'initial-setup'),
  ('job.jobs.ruleForm.title', 'fr-FR', 'Nouvelle règle de job', 'initial-setup', 'initial-setup'),
  ('job.jobs.ruleForm.title', 'es-ES', 'Nueva regla de job', 'initial-setup', 'initial-setup'),
  ('job.jobs.ruleForm.title', 'pt-PT', 'Nova regra de job', 'initial-setup', 'initial-setup'),
  ('job.jobs.ruleForm.desc', 'en-GB', 'Arm a schedule whenever an event matching the subject (and filter) is published.', 'initial-setup', 'initial-setup'),
  ('job.jobs.ruleForm.desc', 'en-US', 'Arm a schedule whenever an event matching the subject (and filter) is published.', 'initial-setup', 'initial-setup'),
  ('job.jobs.ruleForm.desc', 'it-IT', 'Arma una pianificazione ogni volta che viene pubblicato un evento corrispondente al subject (e al filtro).', 'initial-setup', 'initial-setup'),
  ('job.jobs.ruleForm.desc', 'de-DE', 'Armiert einen Zeitplan, sobald ein zum Subject (und Filter) passendes Ereignis veröffentlicht wird.', 'initial-setup', 'initial-setup'),
  ('job.jobs.ruleForm.desc', 'fr-FR', 'Arme une planification à chaque publication d’un événement correspondant au sujet (et au filtre).', 'initial-setup', 'initial-setup'),
  ('job.jobs.ruleForm.desc', 'es-ES', 'Arma una planificación cada vez que se publica un evento que coincide con el subject (y el filtro).', 'initial-setup', 'initial-setup'),
  ('job.jobs.ruleForm.desc', 'pt-PT', 'Arma um agendamento sempre que um evento correspondente ao subject (e ao filtro) for publicado.', 'initial-setup', 'initial-setup'),
  ('job.jobs.ruleForm.create', 'en-GB', 'Create Rule', 'initial-setup', 'initial-setup'),
  ('job.jobs.ruleForm.create', 'en-US', 'Create Rule', 'initial-setup', 'initial-setup'),
  ('job.jobs.ruleForm.create', 'it-IT', 'Crea regola', 'initial-setup', 'initial-setup'),
  ('job.jobs.ruleForm.create', 'de-DE', 'Regel erstellen', 'initial-setup', 'initial-setup'),
  ('job.jobs.ruleForm.create', 'fr-FR', 'Créer la règle', 'initial-setup', 'initial-setup'),
  ('job.jobs.ruleForm.create', 'es-ES', 'Crear regla', 'initial-setup', 'initial-setup'),
  ('job.jobs.ruleForm.create', 'pt-PT', 'Criar regra', 'initial-setup', 'initial-setup'),
  ('job.jobs.ruleForm.created', 'en-GB', 'Rule created', 'initial-setup', 'initial-setup'),
  ('job.jobs.ruleForm.created', 'en-US', 'Rule created', 'initial-setup', 'initial-setup'),
  ('job.jobs.ruleForm.created', 'it-IT', 'Regola creata', 'initial-setup', 'initial-setup'),
  ('job.jobs.ruleForm.created', 'de-DE', 'Regel erstellt', 'initial-setup', 'initial-setup'),
  ('job.jobs.ruleForm.created', 'fr-FR', 'Règle créée', 'initial-setup', 'initial-setup'),
  ('job.jobs.ruleForm.created', 'es-ES', 'Regla creada', 'initial-setup', 'initial-setup'),
  ('job.jobs.ruleForm.created', 'pt-PT', 'Regra criada', 'initial-setup', 'initial-setup');
