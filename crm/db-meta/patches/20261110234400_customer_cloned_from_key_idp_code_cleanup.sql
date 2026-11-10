-- Two drift fixes on crm.entities.customer.fields.*:
--
-- 1) `cloned_from` is a physical customer column (uuid ref, seeded with the
--    customer entity) whose fields.* label was never shipped — the list page
--    renders the raw key. Adds the label in all shipped locales.
--
-- 2) `idp_code` label rows are stale seed data: no `idp_code` column exists
--    on crm.customers (it lives on crm.customer_accounts). Soft-deletes the
--    orphaned labels.

INSERT INTO "crm"."translations" ("key", "language", "value", "created_at", "created_by", "updated_at", "updated_by", "version") VALUES
  ('crm.entities.customer.fields.cloned_from', 'de-DE', 'Geklont von', now(), 'migration-cloned-from-label', now(), 'migration-cloned-from-label', 1),
  ('crm.entities.customer.fields.cloned_from', 'en-GB', 'Cloned From', now(), 'migration-cloned-from-label', now(), 'migration-cloned-from-label', 1),
  ('crm.entities.customer.fields.cloned_from', 'en-US', 'Cloned From', now(), 'migration-cloned-from-label', now(), 'migration-cloned-from-label', 1),
  ('crm.entities.customer.fields.cloned_from', 'es-ES', 'Clonado de', now(), 'migration-cloned-from-label', now(), 'migration-cloned-from-label', 1),
  ('crm.entities.customer.fields.cloned_from', 'fr-FR', 'Cloné depuis', now(), 'migration-cloned-from-label', now(), 'migration-cloned-from-label', 1),
  ('crm.entities.customer.fields.cloned_from', 'it-IT', 'Clonato da', now(), 'migration-cloned-from-label', now(), 'migration-cloned-from-label', 1),
  ('crm.entities.customer.fields.cloned_from', 'pt-PT', 'Clonado de', now(), 'migration-cloned-from-label', now(), 'migration-cloned-from-label', 1);

UPDATE "crm"."translations"
SET deleted_at = now(),
    deleted_by = 'migration-idp-code-stale-label'
WHERE key = 'crm.entities.customer.fields.idp_code'
  AND deleted_at IS NULL;
