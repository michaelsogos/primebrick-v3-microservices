-- Sequence create-form contract i18n — job mirror of the canonical crm
-- patch (bugfix-sequence-create-form-contract). Same contract, re-prefixed
-- crm. → job.: the mirrored keys were seeded by
-- 20261229130000_i18n_job_settings_sequences via the same
-- crm.translations copy — this patch re-syncs the two corrected labels
-- and pulls the new revive_slot badge values.

DELETE FROM job.translations
WHERE key IN (
  'job.entities.sequence.fields.revived_from',
  'job.entities.sequence.fields.default_from'
);

INSERT INTO job.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
SELECT uuidv7(), 'job.' || substring(t.key from 5), t.language, t.value,
       now(), 'migration-sequence-form-contract', now(), 'migration-sequence-form-contract', 1
  FROM crm.translations t
 WHERE t.deleted_at IS NULL
   AND t.key IN (
     'crm.entities.sequence.fields.revived_from',
     'crm.entities.sequence.fields.default_from',
     'crm.entities.sequence.fields.revive_slot_values.sez',
     'crm.entities.sequence.fields.revive_slot_values.sez2',
     'crm.entities.sequence.fields.revive_slot_values.sez3'
   )
   AND NOT EXISTS (
        SELECT 1 FROM job.translations j
         WHERE j.key = 'job.' || substring(t.key from 5)
           AND j.language = t.language
   );
