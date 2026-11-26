-- Primebrick: builtin sequence revive row action — CTA label and
-- pre-dispatch confirm copy. The builtin registry is mounted per module,
-- so every owning schema carries its own <schema>.actions.* vocabulary.

INSERT INTO ai.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
SELECT v.uuid, v.key, v.language, v.value, v.created_at, v.created_by, v.updated_at, v.updated_by, v.version
FROM (VALUES
  (uuidv7(), 'ai.actions.sequence_revive', 'en-GB', 'Revive now', now(), 'migration-sequence-revive-action', now(), 'migration-sequence-revive-action', 1),
  (uuidv7(), 'ai.actions.sequence_revive_confirm', 'en-GB', 'Revive this sequence now? A new generation is created and the current one retires after its grace window.', now(), 'migration-sequence-revive-action', now(), 'migration-sequence-revive-action', 1),
  (uuidv7(), 'ai.actions.sequence_revive', 'en-US', 'Revive now', now(), 'migration-sequence-revive-action', now(), 'migration-sequence-revive-action', 1),
  (uuidv7(), 'ai.actions.sequence_revive_confirm', 'en-US', 'Revive this sequence now? A new generation is created and the current one retires after its grace window.', now(), 'migration-sequence-revive-action', now(), 'migration-sequence-revive-action', 1),
  (uuidv7(), 'ai.actions.sequence_revive', 'it-IT', 'Rinnova ora', now(), 'migration-sequence-revive-action', now(), 'migration-sequence-revive-action', 1),
  (uuidv7(), 'ai.actions.sequence_revive_confirm', 'it-IT', 'Rinnovare questa sequenza ora? Verrà creata una nuova generazione e quella corrente verrà ritirata dopo la finestra di tolleranza.', now(), 'migration-sequence-revive-action', now(), 'migration-sequence-revive-action', 1),
  (uuidv7(), 'ai.actions.sequence_revive', 'fr-FR', 'Renouveler maintenant', now(), 'migration-sequence-revive-action', now(), 'migration-sequence-revive-action', 1),
  (uuidv7(), 'ai.actions.sequence_revive_confirm', 'fr-FR', 'Renouveler cette séquence maintenant ? Une nouvelle génération est créée et la génération actuelle est retirée après sa fenêtre de tolérance.', now(), 'migration-sequence-revive-action', now(), 'migration-sequence-revive-action', 1),
  (uuidv7(), 'ai.actions.sequence_revive', 'es-ES', 'Renovar ahora', now(), 'migration-sequence-revive-action', now(), 'migration-sequence-revive-action', 1),
  (uuidv7(), 'ai.actions.sequence_revive_confirm', 'es-ES', '¿Renovar esta secuencia ahora? Se crea una nueva generación y la actual se retira después de su ventana de tolerancia.', now(), 'migration-sequence-revive-action', now(), 'migration-sequence-revive-action', 1),
  (uuidv7(), 'ai.actions.sequence_revive', 'de-DE', 'Jetzt erneuern', now(), 'migration-sequence-revive-action', now(), 'migration-sequence-revive-action', 1),
  (uuidv7(), 'ai.actions.sequence_revive_confirm', 'de-DE', 'Diese Sequenz jetzt erneuern? Eine neue Generation wird erstellt und die aktuelle nach ihrem Toleranzfenster außer Betrieb genommen.', now(), 'migration-sequence-revive-action', now(), 'migration-sequence-revive-action', 1),
  (uuidv7(), 'ai.actions.sequence_revive', 'pt-PT', 'Renovar agora', now(), 'migration-sequence-revive-action', now(), 'migration-sequence-revive-action', 1),
  (uuidv7(), 'ai.actions.sequence_revive_confirm', 'pt-PT', 'Renovar esta sequência agora? Uma nova geração é criada e a atual é retirada após a sua janela de tolerância.', now(), 'migration-sequence-revive-action', now(), 'migration-sequence-revive-action', 1)
) AS v(uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
WHERE NOT EXISTS (
  SELECT 1 FROM ai.translations t
  WHERE t.key = v.key AND t.language = v.language
);
