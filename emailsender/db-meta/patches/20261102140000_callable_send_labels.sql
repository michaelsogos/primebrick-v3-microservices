-- Primebrick Emailsender: callable-catalog i18n for `emailsender.send`.
--
-- The route's `payload_schema` opts it into `endpoints.callables` — the
-- scheduler/rule-form picker renders label + description. Keys live in
-- the module's own namespace (`emailsender.callable.*`).

INSERT INTO emailsender.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
  ('emailsender.callable.send.label', 'en-GB', 'Send email', now(), 'migration-callable-labels', now(), 'migration-callable-labels', 1),
  ('emailsender.callable.send.label', 'en-US', 'Send email', now(), 'migration-callable-labels', now(), 'migration-callable-labels', 1),
  ('emailsender.callable.send.label', 'it-IT', 'Invia email', now(), 'migration-callable-labels', now(), 'migration-callable-labels', 1),
  ('emailsender.callable.send.label', 'de-DE', 'E-Mail senden', now(), 'migration-callable-labels', now(), 'migration-callable-labels', 1),
  ('emailsender.callable.send.label', 'fr-FR', 'Envoyer un e-mail', now(), 'migration-callable-labels', now(), 'migration-callable-labels', 1),
  ('emailsender.callable.send.label', 'es-ES', 'Enviar correo', now(), 'migration-callable-labels', now(), 'migration-callable-labels', 1),
  ('emailsender.callable.send.label', 'pt-PT', 'Enviar e-mail', now(), 'migration-callable-labels', now(), 'migration-callable-labels', 1),
  ('emailsender.callable.send.desc', 'en-GB', 'Sends a templated email through the configured provider — accepts template code, recipients and merge variables.', now(), 'migration-callable-labels', now(), 'migration-callable-labels', 1),
  ('emailsender.callable.send.desc', 'en-US', 'Sends a templated email through the configured provider — accepts template code, recipients and merge variables.', now(), 'migration-callable-labels', now(), 'migration-callable-labels', 1),
  ('emailsender.callable.send.desc', 'it-IT', 'Invia un''email da template tramite il provider configurato — accetta codice template, destinatari e variabili di merge.', now(), 'migration-callable-labels', now(), 'migration-callable-labels', 1),
  ('emailsender.callable.send.desc', 'de-DE', 'Sendet eine Vorlagen-E-Mail über den konfigurierten Anbieter — akzeptiert Vorlagencode, Empfänger und Merge-Variablen.', now(), 'migration-callable-labels', now(), 'migration-callable-labels', 1),
  ('emailsender.callable.send.desc', 'fr-FR', 'Envoie un e-mail basé sur un modèle via le fournisseur configuré — accepte code de modèle, destinataires et variables de fusion.', now(), 'migration-callable-labels', now(), 'migration-callable-labels', 1),
  ('emailsender.callable.send.desc', 'es-ES', 'Envía un correo basado en plantilla a través del proveedor configurado — acepta código de plantilla, destinatarios y variables de combinación.', now(), 'migration-callable-labels', now(), 'migration-callable-labels', 1),
  ('emailsender.callable.send.desc', 'pt-PT', 'Envia um e-mail baseado em modelo pelo provedor configurado — aceita código de modelo, destinatários e variáveis de mesclagem.', now(), 'migration-callable-labels', now(), 'migration-callable-labels', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
