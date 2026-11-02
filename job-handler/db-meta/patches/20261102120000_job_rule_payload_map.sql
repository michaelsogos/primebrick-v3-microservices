-- Primebrick: Job module — job_rules.payload_map (callable payload mapping).
--
-- Callable targets (census.callables) replaced the jobs.due.*-only target
-- vocabulary: a rule may now point at any governed LISTEN subject that
-- publishes a payload_schema. `payload_map` holds the rule-owned DST that
-- builds the callable's request payload from the source event at arm time —
-- `applyPayloadMap` in @primebrick/core resolves each entry. NULL = the
-- event payload forwards verbatim.
--
-- Translation keys follow the module namespace boundary (job.* only):
--   job.entities.job_rule.fields.payload_map      — field label
--   job.entities.job_rule.hints.payload_map[_title] — field hint

BEGIN;

ALTER TABLE "job"."job_rules" ADD COLUMN IF NOT EXISTS "payload_map" jsonb;

INSERT INTO job.translations (key, language, value, created_by, updated_by) VALUES
  -- payload_map field label
  ('job.entities.job_rule.fields.payload_map', 'en-GB', 'Payload mapping', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.fields.payload_map', 'en-US', 'Payload mapping', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.fields.payload_map', 'it-IT', 'Mappatura payload', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.fields.payload_map', 'de-DE', 'Payload-Mapping', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.fields.payload_map', 'fr-FR', 'Mappage du payload', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.fields.payload_map', 'es-ES', 'Mapeo de payload', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.fields.payload_map', 'pt-PT', 'Mapeamento de payload', 'initial-setup', 'initial-setup'),
  -- payload_map hint title
  ('job.entities.job_rule.hints.payload_map_title', 'en-GB', 'Payload mapping', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.hints.payload_map_title', 'en-US', 'Payload mapping', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.hints.payload_map_title', 'it-IT', 'Mappatura payload', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.hints.payload_map_title', 'de-DE', 'Payload-Mapping', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.hints.payload_map_title', 'fr-FR', 'Mappage du payload', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.hints.payload_map_title', 'es-ES', 'Mapeo de payload', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.hints.payload_map_title', 'pt-PT', 'Mapeamento de payload', 'initial-setup', 'initial-setup'),
  -- payload_map hint body
  ('job.entities.job_rule.hints.payload_map', 'en-GB', 'How to build the request payload for the destination — per destination field, pick a constant value, a path into the event payload, or a rule context value (actor, rule id, fire time). Leave empty to forward the event payload unchanged.', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.hints.payload_map', 'en-US', 'How to build the request payload for the destination — per destination field, pick a constant value, a path into the event payload, or a rule context value (actor, rule id, fire time). Leave empty to forward the event payload unchanged.', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.hints.payload_map', 'it-IT', 'Come costruire il payload della richiesta per la destinazione — per ogni campo di destinazione scegli un valore costante, un percorso nel payload dell''evento o un valore di contesto della regola (attore, id regola, ora di esecuzione). Lascia vuoto per inoltrare il payload dell''evento invariato.', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.hints.payload_map', 'de-DE', 'Wie die Anfrage-Payload für das Ziel aufgebaut wird — pro Zielfeld einen konstanten Wert, einen Pfad in die Ereignis-Payload oder einen Regel-Kontextwert (Akteur, Regel-ID, Ausführungszeit) wählen. Leer lassen, um die Ereignis-Payload unverändert weiterzuleiten.', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.hints.payload_map', 'fr-FR', 'Comment construire le payload de la requête pour la destination — pour chaque champ de destination, choisir une valeur constante, un chemin dans le payload de l''événement ou une valeur de contexte de la règle (acteur, id de règle, heure d''exécution). Laisser vide pour transmettre le payload de l''événement tel quel.', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.hints.payload_map', 'es-ES', 'Cómo construir el payload de la solicitud para el destino — por cada campo de destino, elegir un valor constante, una ruta en el payload del evento o un valor de contexto de la regla (actor, id de regla, hora de ejecución). Dejar vacío para reenviar el payload del evento sin cambios.', 'initial-setup', 'initial-setup'),
  ('job.entities.job_rule.hints.payload_map', 'pt-PT', 'Como construir o payload do pedido para o destino — para cada campo de destino, escolher um valor constante, um caminho no payload do evento ou um valor de contexto da regra (ator, id da regra, hora de execução). Deixar vazio para reencaminhar o payload do evento sem alterações.', 'initial-setup', 'initial-setup')
ON CONFLICT DO NOTHING;

COMMIT;
