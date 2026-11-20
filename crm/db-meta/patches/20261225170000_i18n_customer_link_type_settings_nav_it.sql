-- Primebrick: `customer_link_type` it-IT rename — the Settings-nav surface.
-- The settings sidebar reads `crm.settings.nav.{entity}` (a sibling surface to
-- `crm.{entity}.nav` covered by 20261225150000): "tipo collegamento" →
-- "relazione clienti" (customer RELATIONSHIP type, not a generic link).

UPDATE crm.translations SET value = 'Tipi Relazione Clienti', updated_at = now(), updated_by = 'migration-linktype-settingsnav-i18n', version = version + 1
WHERE key = 'crm.settings.nav.customer_link_types' AND language = 'it-IT';
