-- schedule lifecycle actions: row/bulk CTA labels + confirm dialogs +
-- `stopped`/`paused` status values (jobs.jobs.actions.*, job_schedule values).
INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.jobs.actions.stop', 'en-GB', 'Stop', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.stop', 'en-US', 'Stop', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.stop', 'it-IT', 'Ferma', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.stop', 'de-DE', 'Anhalten', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.stop', 'fr-FR', 'Arrêter', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.stop', 'es-ES', 'Detener', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.stop', 'pt-PT', 'Parar', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.jobs.actions.pause', 'en-GB', 'Pause', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.pause', 'en-US', 'Pause', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.pause', 'it-IT', 'Pausa', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.pause', 'de-DE', 'Pausieren', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.pause', 'fr-FR', 'Suspendre', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.pause', 'es-ES', 'Pausar', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.pause', 'pt-PT', 'Pausar', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.jobs.actions.resume', 'en-GB', 'Resume', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.resume', 'en-US', 'Resume', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.resume', 'it-IT', 'Riprendi', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.resume', 'de-DE', 'Fortsetzen', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.resume', 'fr-FR', 'Reprendre', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.resume', 'es-ES', 'Reanudar', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.resume', 'pt-PT', 'Retomar', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.jobs.actions.disable', 'en-GB', 'Disable', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.disable', 'en-US', 'Disable', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.disable', 'it-IT', 'Disabilita', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.disable', 'de-DE', 'Deaktivieren', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.disable', 'fr-FR', 'Désactiver', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.disable', 'es-ES', 'Deshabilitar', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.disable', 'pt-PT', 'Desativar', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.jobs.actions.enable', 'en-GB', 'Enable', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.enable', 'en-US', 'Enable', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.enable', 'it-IT', 'Abilita', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.enable', 'de-DE', 'Aktivieren', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.enable', 'fr-FR', 'Activer', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.enable', 'es-ES', 'Habilitar', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.enable', 'pt-PT', 'Ativar', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.jobs.actions.disarm_all', 'en-GB', 'Disable all', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.disarm_all', 'en-US', 'Disable all', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.disarm_all', 'it-IT', 'Disabilita tutto', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.disarm_all', 'de-DE', 'Alle deaktivieren', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.disarm_all', 'fr-FR', 'Tout désactiver', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.disarm_all', 'es-ES', 'Deshabilitar todo', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.disarm_all', 'pt-PT', 'Desativar tudo', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.jobs.actions.pause_all', 'en-GB', 'Pause all', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.pause_all', 'en-US', 'Pause all', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.pause_all', 'it-IT', 'Pausa tutto', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.pause_all', 'de-DE', 'Alle pausieren', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.pause_all', 'fr-FR', 'Tout suspendre', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.pause_all', 'es-ES', 'Pausar todo', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.pause_all', 'pt-PT', 'Pausar tudo', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.jobs.actions.resume_all', 'en-GB', 'Resume all', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.resume_all', 'en-US', 'Resume all', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.resume_all', 'it-IT', 'Riprendi tutto', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.resume_all', 'de-DE', 'Alle fortsetzen', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.resume_all', 'fr-FR', 'Tout reprendre', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.resume_all', 'es-ES', 'Reanudar todo', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.resume_all', 'pt-PT', 'Retomar tudo', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.jobs.actions.disarm_all_confirm', 'en-GB', 'Disable every armed schedule? Triggers will be switched off and infra jobs suppressed until manually re-enabled.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.disarm_all_confirm', 'en-US', 'Disable every armed schedule? Triggers will be switched off and infra jobs suppressed until manually re-enabled.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.disarm_all_confirm', 'it-IT', 'Disabilitare ogni schedule armata? I trigger verranno spenti e i job infra soppressi finché non vengono riabilitati manualmente.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.disarm_all_confirm', 'de-DE', 'Alle scharfen Zeitpläne deaktivieren? Trigger werden ausgeschaltet und Infra-Jobs unterdrückt, bis sie manuell wieder aktiviert werden.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.disarm_all_confirm', 'fr-FR', 'Désactiver toutes les planifications armées ? Les déclencheurs seront éteints et les jobs infra supprimés jusqu''à réactivation manuelle.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.disarm_all_confirm', 'es-ES', '¿Deshabilitar todas las programaciones armadas? Los triggers se apagarán y los jobs infra quedarán suprimidos hasta reactivarse manualmente.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.disarm_all_confirm', 'pt-PT', 'Desativar todos os agendamentos armados? Os triggers serão desligados e os jobs infra suprimidos até serem reativados manualmente.', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.jobs.actions.pause_all_confirm', 'en-GB', 'Pause every armed schedule? All re-arm paths stay suppressed until you resume.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.pause_all_confirm', 'en-US', 'Pause every armed schedule? All re-arm paths stay suppressed until you resume.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.pause_all_confirm', 'it-IT', 'Mettere in pausa ogni schedule armata? Tutti i percorsi di ri-arm restano soppressi finché non riprendi.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.pause_all_confirm', 'de-DE', 'Alle scharfen Zeitpläne pausieren? Alle Wiederaktivierungswege bleiben unterdrückt, bis Sie fortsetzen.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.pause_all_confirm', 'fr-FR', 'Suspendre toutes les planifications armées ? Tous les chemins de réarmement restent supprimés jusqu''à la reprise.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.pause_all_confirm', 'es-ES', '¿Pausar todas las programaciones armadas? Todas las vías de rearme quedan suprimidas hasta que reanudes.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.pause_all_confirm', 'pt-PT', 'Pausar todos os agendamentos armados? Todos os caminhos de rearme ficam suprimidos até retomar.', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.jobs.actions.resume_all_confirm', 'en-GB', 'Resume every paused schedule? Triggers re-derive and infra owners get a re-arm request.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.resume_all_confirm', 'en-US', 'Resume every paused schedule? Triggers re-derive and infra owners get a re-arm request.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.resume_all_confirm', 'it-IT', 'Riprendere ogni schedule in pausa? I trigger si ri-derivano e gli owner infra ricevono una richiesta di ri-arm.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.resume_all_confirm', 'de-DE', 'Alle pausierten Zeitpläne fortsetzen? Trigger werden neu abgeleitet und Infra-Besitzer erhalten eine Wiederaktivierungsanfrage.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.resume_all_confirm', 'fr-FR', 'Reprendre toutes les planifications suspendues ? Les déclencheurs se re-déduisent et les propriétaires infra reçoivent une demande de réarmement.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.resume_all_confirm', 'es-ES', '¿Reanudar todas las programaciones pausadas? Los triggers se re-derivan y los propietarios infra reciben una solicitud de rearme.', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.jobs.actions.resume_all_confirm', 'pt-PT', 'Retomar todos os agendamentos pausados? Os triggers são re-derivados e os proprietários infra recebem um pedido de rearme.', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.entities.job_schedule.values.stopped', 'en-GB', 'Stopped', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.stopped', 'en-US', 'Stopped', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.stopped', 'it-IT', 'Fermata', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.stopped', 'de-DE', 'Angehalten', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.stopped', 'fr-FR', 'Arrêtée', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.stopped', 'es-ES', 'Detenida', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.stopped', 'pt-PT', 'Parada', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO job.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
('job.entities.job_schedule.values.paused', 'en-GB', 'Paused', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.paused', 'en-US', 'Paused', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.paused', 'it-IT', 'In pausa', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.paused', 'de-DE', 'Pausiert', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.paused', 'fr-FR', 'Suspendue', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.paused', 'es-ES', 'Pausada', now(), 'initial-setup', now(), 'initial-setup', 1),
('job.entities.job_schedule.values.paused', 'pt-PT', 'Pausada', now(), 'initial-setup', now(), 'initial-setup', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
