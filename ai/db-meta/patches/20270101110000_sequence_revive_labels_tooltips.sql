-- Sequence revive wave-2 i18n — mirror of the crm canonical patch
-- (moment/mode label pairs + tooltip keys). Prefix rewrite crm→ai.

DELETE FROM ai.translations
WHERE key IN (
  'ai.entities.sequence.fields.expire_at',
  'ai.entities.sequence.fields.switch_at',
  'ai.entities.sequence.fields.revive_every',
  'ai.entities.sequence.fields.revive_grace'
);

INSERT INTO ai.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
SELECT uuidv7(), 'ai.' || substring(t.key from 5), t.language, t.value,
       now(), 'migration-sequence-revive-w2', now(), 'migration-sequence-revive-w2', 1
  FROM crm.translations t
 WHERE t.deleted_at IS NULL
   AND t.key IN (
     'crm.entities.sequence.fields.expire_at',
     'crm.entities.sequence.fields.switch_at',
     'crm.entities.sequence.fields.revive_every',
     'crm.entities.sequence.fields.revive_grace',
     'crm.entities.sequence.fields.revive_every.tooltip',
     'crm.entities.sequence.fields.revive_grace.tooltip',
     'crm.entities.sequence.fields.revive_slot.tooltip',
     'crm.entities.sequence.fields.default_from.tooltip',
     'crm.entities.sequence.fields.sez.tooltip'
   )
   AND NOT EXISTS (
        SELECT 1 FROM ai.translations j
         WHERE j.key = 'ai.' || substring(t.key from 5)
           AND j.language = t.language
   );
