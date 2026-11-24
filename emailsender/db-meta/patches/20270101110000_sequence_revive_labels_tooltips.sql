-- Sequence revive wave-2 i18n — mirror of the crm canonical patch
-- (moment/mode label pairs + tooltip keys). Prefix rewrite crm→emailsender.

DELETE FROM emailsender.translations
WHERE key IN (
  'emailsender.entities.sequence.fields.expire_at',
  'emailsender.entities.sequence.fields.switch_at',
  'emailsender.entities.sequence.fields.revive_every',
  'emailsender.entities.sequence.fields.revive_grace'
);

INSERT INTO emailsender.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
SELECT uuidv7(), 'emailsender.' || substring(t.key from 5), t.language, t.value,
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
        SELECT 1 FROM emailsender.translations j
         WHERE j.key = 'emailsender.' || substring(t.key from 5)
           AND j.language = t.language
   );
