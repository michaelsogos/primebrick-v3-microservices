-- Sequence revive wave-2 i18n (bugfix-sequence-create-form-contract):
--
--   • moment/mode label pairs — the persisted instants get the
--     "happened/will happen" labels; the varchar axes get the "how it's
--     expressed" labels:
--       expire_at    → "Rinnovo il"   (the revive MOMENT)
--       switch_at    → "Attivato il"  (the switch MOMENT)
--       revive_every → "Rinnovo Ogni" (how expire is expressed)
--       revive_grace → "Attivazione"  (how switch is expressed)
--   • tooltip keys ×5 — meta columns carry `tooltip:` i18n keys on the
--     non-obvious fields; copy explains the depends_on gate and the
--     interval-or-exact-date grammar. `sez*` share one tooltip.

DELETE FROM crm.translations
WHERE key IN (
  'crm.entities.sequence.fields.expire_at',
  'crm.entities.sequence.fields.switch_at',
  'crm.entities.sequence.fields.revive_every',
  'crm.entities.sequence.fields.revive_grace'
);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  -- ── expire_at → the revive MOMENT ─────────────────────────────────
  (uuidv7(), 'crm.entities.sequence.fields.expire_at', 'en-GB', 'Renews On', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.expire_at', 'en-US', 'Renews On', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.expire_at', 'it-IT', 'Rinnovo Il', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.expire_at', 'fr-FR', 'Renouvelé Le', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.expire_at', 'es-ES', 'Renovado El', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.expire_at', 'de-DE', 'Erneuert Am', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  -- ── switch_at → the switch MOMENT ─────────────────────────────────
  (uuidv7(), 'crm.entities.sequence.fields.switch_at', 'en-GB', 'Activated On', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.switch_at', 'en-US', 'Activated On', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.switch_at', 'it-IT', 'Attivato Il', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.switch_at', 'fr-FR', 'Activé Le', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.switch_at', 'es-ES', 'Activado El', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.switch_at', 'de-DE', 'Aktiviert Am', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  -- ── revive_every → how expire is expressed ────────────────────────
  (uuidv7(), 'crm.entities.sequence.fields.revive_every', 'en-GB', 'Renew Every', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_every', 'en-US', 'Renew Every', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_every', 'it-IT', 'Rinnovo Ogni', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_every', 'fr-FR', 'Renouveler Tous Les', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_every', 'es-ES', 'Renovar Cada', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_every', 'de-DE', 'Erneuern Alle', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  -- ── revive_grace → how switch is expressed ────────────────────────
  (uuidv7(), 'crm.entities.sequence.fields.revive_grace', 'en-GB', 'Activation', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_grace', 'en-US', 'Activation', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_grace', 'it-IT', 'Attivazione', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_grace', 'fr-FR', 'Activation', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_grace', 'es-ES', 'Activación', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_grace', 'de-DE', 'Aktivierung', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),

  -- ── tooltips — the gate + the interval-or-date grammar ────────────
  (uuidv7(), 'crm.entities.sequence.fields.revive_every.tooltip', 'en-GB', 'How often the numbering renews: an interval (e.g. 1 year) or an exact date. Each renewal starts a new generation.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_every.tooltip', 'en-US', 'How often the numbering renews: an interval (e.g. 1 year) or an exact date. Each renewal starts a new generation.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_every.tooltip', 'it-IT', 'Ogni quanto la numerazione si rinnova: un intervallo (es. 1 anno) oppure una data esatta. A ogni rinnovo inizia una nuova generazione.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_every.tooltip', 'fr-FR', 'Fréquence de renouvellement de la numérotation : un intervalle (ex. 1 an) ou une date exacte. Chaque renouvellement démarre une nouvelle génération.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_every.tooltip', 'es-ES', 'Cada cuánto se renueva la numeración: un intervalo (ej. 1 año) o una fecha exacta. Cada renovación inicia una nueva generación.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_every.tooltip', 'de-DE', 'Wie oft die Nummerierung erneuert wird: ein Intervall (z. B. 1 Jahr) oder ein exaktes Datum. Jede Erneuerung startet eine neue Generation.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),

  (uuidv7(), 'crm.entities.sequence.fields.revive_grace.tooltip', 'en-GB', 'When the next generation becomes active: an offset after the renewal moment or an exact date. Until then the previous generation keeps working.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_grace.tooltip', 'en-US', 'When the next generation becomes active: an offset after the renewal moment or an exact date. Until then the previous generation keeps working.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_grace.tooltip', 'it-IT', 'Quando la nuova generazione diventa attiva: un intervallo dopo il rinnovo oppure una data esatta. Fino ad allora la numerazione precedente continua a funzionare.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_grace.tooltip', 'fr-FR', 'Quand la nouvelle génération devient active : un décalage après le renouvellement ou une date exacte. Jusque-là, la numérotation précédente continue de fonctionner.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_grace.tooltip', 'es-ES', 'Cuándo se activa la nueva generación: un intervalo tras la renovación o una fecha exacta. Hasta entonces la numeración anterior sigue funcionando.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_grace.tooltip', 'de-DE', 'Wann die neue Generation aktiv wird: ein Abstand nach der Erneuerung oder ein exaktes Datum. Bis dahin funktioniert die vorherige Nummerierung weiter.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),

  (uuidv7(), 'crm.entities.sequence.fields.revive_slot.tooltip', 'en-GB', 'Which code section advances at each renewal (e.g. the year). Available only when "Renew every" is set.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot.tooltip', 'en-US', 'Which code section advances at each renewal (e.g. the year). Available only when "Renew every" is set.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot.tooltip', 'it-IT', 'Quale sezionale del codice avanza a ogni rinnovo (es. l''anno). Disponibile solo se "Rinnovo ogni" è impostato.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot.tooltip', 'fr-FR', 'Quelle section du code avance à chaque renouvellement (ex. l''année). Disponible uniquement si « Renouveler tous les » est défini.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot.tooltip', 'es-ES', 'Qué sección del código avanza en cada renovación (ej. el año). Disponible solo si «Renovar cada» está definido.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.revive_slot.tooltip', 'de-DE', 'Welcher Codeabschnitt bei jeder Erneuerung weiterzählt (z. B. das Jahr). Nur verfügbar, wenn „Erneuern alle" gesetzt ist.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),

  (uuidv7(), 'crm.entities.sequence.fields.default_from.tooltip', 'en-GB', 'When this generation starts being used. Available only when "Renew every" is set.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.default_from.tooltip', 'en-US', 'When this generation starts being used. Available only when "Renew every" is set.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.default_from.tooltip', 'it-IT', 'Da quando questa generazione può essere usata. Disponibile solo se "Rinnovo ogni" è impostato.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.default_from.tooltip', 'fr-FR', 'À partir de quand cette génération peut être utilisée. Disponible uniquement si « Renouveler tous les » est défini.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.default_from.tooltip', 'es-ES', 'Desde cuándo se puede usar esta generación. Disponible solo si «Renovar cada» está definido.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.default_from.tooltip', 'de-DE', 'Ab wann diese Generation verwendet werden kann. Nur verfügbar, wenn „Erneuern alle" gesetzt ist.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),

  (uuidv7(), 'crm.entities.sequence.fields.sez.tooltip', 'en-GB', 'Current value of the code section that renewals advance (e.g. 2026). Updated automatically at each renewal.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.sez.tooltip', 'en-US', 'Current value of the code section that renewals advance (e.g. 2026). Updated automatically at each renewal.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.sez.tooltip', 'it-IT', 'Valore corrente del sezionale che avanza ai rinnovi (es. 2026). Aggiornato automaticamente a ogni rinnovo.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.sez.tooltip', 'fr-FR', 'Valeur actuelle de la section avancée par les renouvellements (ex. 2026). Mise à jour automatiquement à chaque renouvellement.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.sez.tooltip', 'es-ES', 'Valor actual de la sección que avanza con las renovaciones (ej. 2026). Se actualiza automáticamente en cada renovación.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1),
  (uuidv7(), 'crm.entities.sequence.fields.sez.tooltip', 'de-DE', 'Aktueller Wert des Abschnitts, den Erneuerungen weiterzählen (z. B. 2026). Wird bei jeder Erneuerung automatisch aktualisiert.', now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1);
