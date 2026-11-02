-- ai.docs.{title,description} — parity for the 4 missing shipped languages
-- (de/fr/es/pt); en-GB/en-US/it-IT already exist. Insert-once.
INSERT INTO ai.translations (key, language, value, created_at, created_by, updated_at, updated_by, version) VALUES
  ('ai.docs.title', 'de-DE', 'Dokumentationsindex', now(), 'migration-ai-docs-parity', now(), 'migration-ai-docs-parity', 1),
  ('ai.docs.title', 'fr-FR', 'Index de la documentation', now(), 'migration-ai-docs-parity', now(), 'migration-ai-docs-parity', 1),
  ('ai.docs.title', 'es-ES', 'Índice de documentación', now(), 'migration-ai-docs-parity', now(), 'migration-ai-docs-parity', 1),
  ('ai.docs.title', 'pt-PT', 'Índice da documentação', now(), 'migration-ai-docs-parity', now(), 'migration-ai-docs-parity', 1),
  ('ai.docs.description', 'de-DE', 'Status des Wissensdatenbank-Index, Quelle-Index-Abweichung und Indexierungsverlauf aller Module.', now(), 'migration-ai-docs-parity', now(), 'migration-ai-docs-parity', 1),
  ('ai.docs.description', 'fr-FR', 'État de l''index de la base de connaissances, dérive source-index et historique d''ingestion de tous les modules.', now(), 'migration-ai-docs-parity', now(), 'migration-ai-docs-parity', 1),
  ('ai.docs.description', 'es-ES', 'Estado del índice de la base de conocimiento, desviación fuente-índice e historial de ingestión de todos los módulos.', now(), 'migration-ai-docs-parity', now(), 'migration-ai-docs-parity', 1),
  ('ai.docs.description', 'pt-PT', 'Estado do índice da base de conhecimento, desvio fonte-índice e histórico de ingestão de todos os módulos.', now(), 'migration-ai-docs-parity', now(), 'migration-ai-docs-parity', 1)
ON CONFLICT (key, language) WHERE deleted_at IS NULL DO NOTHING;
