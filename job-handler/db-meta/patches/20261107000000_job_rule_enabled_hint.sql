-- job_rule `enabled` field tooltip — user-friendly hint + title.
-- Same convention as 20261027200000_job_rule_hints_and_event_desc.sql:
-- `job.entities.job_rule.hints.<column>` / `..._title` in job.translations.
INSERT INTO job.translations (key, language, value, created_by, updated_by) VALUES
  ('job.entities.job_rule.hints.enabled_title', 'en-GB', 'Enabled', 'migration-job-rule-enabled-hint', 'migration-job-rule-enabled-hint'),
  ('job.entities.job_rule.hints.enabled_title', 'en-US', 'Enabled', 'migration-job-rule-enabled-hint', 'migration-job-rule-enabled-hint'),
  ('job.entities.job_rule.hints.enabled_title', 'it-IT', 'Attiva', 'migration-job-rule-enabled-hint', 'migration-job-rule-enabled-hint'),
  ('job.entities.job_rule.hints.enabled_title', 'de-DE', 'Aktiviert', 'migration-job-rule-enabled-hint', 'migration-job-rule-enabled-hint'),
  ('job.entities.job_rule.hints.enabled_title', 'fr-FR', 'Activée', 'migration-job-rule-enabled-hint', 'migration-job-rule-enabled-hint'),
  ('job.entities.job_rule.hints.enabled_title', 'es-ES', 'Activada', 'migration-job-rule-enabled-hint', 'migration-job-rule-enabled-hint'),
  ('job.entities.job_rule.hints.enabled_title', 'pt-PT', 'Ativada', 'migration-job-rule-enabled-hint', 'migration-job-rule-enabled-hint'),
  ('job.entities.job_rule.hints.enabled', 'en-GB', 'When on, the rule reacts to the event you chose. Turn it off to pause the rule without deleting it.', 'migration-job-rule-enabled-hint', 'migration-job-rule-enabled-hint'),
  ('job.entities.job_rule.hints.enabled', 'en-US', 'When on, the rule reacts to the event you chose. Turn it off to pause the rule without deleting it.', 'migration-job-rule-enabled-hint', 'migration-job-rule-enabled-hint'),
  ('job.entities.job_rule.hints.enabled', 'it-IT', 'Se attiva, la regola reagisce all''evento scelto. Spegnila per metterla in pausa senza eliminarla.', 'migration-job-rule-enabled-hint', 'migration-job-rule-enabled-hint'),
  ('job.entities.job_rule.hints.enabled', 'de-DE', 'Wenn aktiviert, reagiert die Regel auf das gewählte Ereignis. Deaktivieren, um die Regel zu pausieren, ohne sie zu löschen.', 'migration-job-rule-enabled-hint', 'migration-job-rule-enabled-hint'),
  ('job.entities.job_rule.hints.enabled', 'fr-FR', 'Quand elle est active, la règle réagit à l''événement choisi. Désactivez-la pour la mettre en pause sans la supprimer.', 'migration-job-rule-enabled-hint', 'migration-job-rule-enabled-hint'),
  ('job.entities.job_rule.hints.enabled', 'es-ES', 'Si está activa, la regla reacciona al evento elegido. Desactívala para pausarla sin eliminarla.', 'migration-job-rule-enabled-hint', 'migration-job-rule-enabled-hint'),
  ('job.entities.job_rule.hints.enabled', 'pt-PT', 'Se ativa, a regra reage ao evento escolhido. Desligue-a para a pausar sem a eliminar.', 'migration-job-rule-enabled-hint', 'migration-job-rule-enabled-hint');
