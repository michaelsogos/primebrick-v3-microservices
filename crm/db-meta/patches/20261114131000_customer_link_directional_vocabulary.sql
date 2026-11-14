-- customer_link directional vocabulary — the `inverse_label_key` column
-- lands via the entity-derived schema patch; this patch seeds the four
-- directional labels (read child-side: "the parent IS a ‹label›") plus
-- the served field/nav labels. NULL inverse = self-inverse type —
-- the four seeds are all directional by domain.
-- pb:segments

UPDATE crm.customer_link_types SET inverse_label_key = 'crm.entities.customer_link_type.rows.inverse.subsidiary' WHERE code = 'subsidiary';
UPDATE crm.customer_link_types SET inverse_label_key = 'crm.entities.customer_link_type.rows.inverse.employee' WHERE code = 'employee';
UPDATE crm.customer_link_types SET inverse_label_key = 'crm.entities.customer_link_type.rows.inverse.consultant' WHERE code = 'consultant';
UPDATE crm.customer_link_types SET inverse_label_key = 'crm.entities.customer_link_type.rows.inverse.referent' WHERE code = 'referent';

-- ── directional type labels — child-side reading of the edge ──────────

INSERT INTO crm.translations (key, language, value, created_by, updated_by) VALUES
  ('crm.entities.customer_link_type.rows.inverse.subsidiary', 'en-GB', 'Parent company', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.rows.inverse.subsidiary', 'en-US', 'Parent company', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.rows.inverse.subsidiary', 'it-IT', 'Capogruppo', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.rows.inverse.subsidiary', 'fr-FR', 'Société mère', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.rows.inverse.subsidiary', 'es-ES', 'Sociedad matriz', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.rows.inverse.subsidiary', 'de-DE', 'Muttergesellschaft', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.rows.inverse.subsidiary', 'pt-PT', 'Empresa-mãe', 'initial-setup', 'initial-setup');

INSERT INTO crm.translations (key, language, value, created_by, updated_by) VALUES
  ('crm.entities.customer_link_type.rows.inverse.employee', 'en-GB', 'Employer', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.rows.inverse.employee', 'en-US', 'Employer', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.rows.inverse.employee', 'it-IT', 'Datore di lavoro', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.rows.inverse.employee', 'fr-FR', 'Employeur', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.rows.inverse.employee', 'es-ES', 'Empleador', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.rows.inverse.employee', 'de-DE', 'Arbeitgeber', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.rows.inverse.employee', 'pt-PT', 'Empregador', 'initial-setup', 'initial-setup');

INSERT INTO crm.translations (key, language, value, created_by, updated_by) VALUES
  ('crm.entities.customer_link_type.rows.inverse.consultant', 'en-GB', 'Client', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.rows.inverse.consultant', 'en-US', 'Client', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.rows.inverse.consultant', 'it-IT', 'Cliente', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.rows.inverse.consultant', 'fr-FR', 'Client', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.rows.inverse.consultant', 'es-ES', 'Cliente', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.rows.inverse.consultant', 'de-DE', 'Kunde', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.rows.inverse.consultant', 'pt-PT', 'Cliente', 'initial-setup', 'initial-setup');

INSERT INTO crm.translations (key, language, value, created_by, updated_by) VALUES
  ('crm.entities.customer_link_type.rows.inverse.referent', 'en-GB', 'Organization', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.rows.inverse.referent', 'en-US', 'Organization', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.rows.inverse.referent', 'it-IT', 'Organizzazione', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.rows.inverse.referent', 'fr-FR', 'Organisation', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.rows.inverse.referent', 'es-ES', 'Organización', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.rows.inverse.referent', 'de-DE', 'Organisation', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.rows.inverse.referent', 'pt-PT', 'Organização', 'initial-setup', 'initial-setup');

-- ── served field labels — ends were seeded under the stale `*_customer_id`
--    keys; the physical columns are `*_customer_uuid` ───────────────────

-- en-GB / en-US / it-IT end labels were seeded by an earlier patch;
-- only the missing languages land here.
INSERT INTO crm.translations (key, language, value, created_by, updated_by) VALUES
  ('crm.entities.customer_link.fields.parent_customer_uuid', 'fr-FR', 'Client parent', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link.fields.parent_customer_uuid', 'es-ES', 'Cliente padre', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link.fields.parent_customer_uuid', 'de-DE', 'Übergeordneter Kunde', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link.fields.parent_customer_uuid', 'pt-PT', 'Cliente pai', 'initial-setup', 'initial-setup');

INSERT INTO crm.translations (key, language, value, created_by, updated_by) VALUES
  ('crm.entities.customer_link.fields.child_customer_uuid', 'fr-FR', 'Client enfant', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link.fields.child_customer_uuid', 'es-ES', 'Cliente hijo', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link.fields.child_customer_uuid', 'de-DE', 'Untergeordneter Kunde', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link.fields.child_customer_uuid', 'pt-PT', 'Cliente filho', 'initial-setup', 'initial-setup');

INSERT INTO crm.translations (key, language, value, created_by, updated_by) VALUES
  ('crm.entities.customer_link_type.fields.inverse_label_key', 'en-GB', 'Inverse label key', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.fields.inverse_label_key', 'en-US', 'Inverse label key', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.fields.inverse_label_key', 'it-IT', 'Chiave etichetta inversa', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.fields.inverse_label_key', 'fr-FR', 'Clé de l''étiquette inverse', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.fields.inverse_label_key', 'es-ES', 'Clave de etiqueta inversa', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.fields.inverse_label_key', 'de-DE', 'Inverser Label-Schlüssel', 'initial-setup', 'initial-setup'),
  ('crm.entities.customer_link_type.fields.inverse_label_key', 'pt-PT', 'Chave de etiqueta inversa', 'initial-setup', 'initial-setup');

-- ── settings nav leaf for the new dict surface ────────────────────────

INSERT INTO crm.translations (key, language, value, created_by, updated_by) VALUES
  ('crm.settings.nav.customer_link_types', 'en-GB', 'Link types', 'initial-setup', 'initial-setup'),
  ('crm.settings.nav.customer_link_types', 'en-US', 'Link types', 'initial-setup', 'initial-setup'),
  ('crm.settings.nav.customer_link_types', 'it-IT', 'Tipi collegamento', 'initial-setup', 'initial-setup'),
  ('crm.settings.nav.customer_link_types', 'fr-FR', 'Types de lien', 'initial-setup', 'initial-setup'),
  ('crm.settings.nav.customer_link_types', 'es-ES', 'Tipos de vínculo', 'initial-setup', 'initial-setup'),
  ('crm.settings.nav.customer_link_types', 'de-DE', 'Verknüpfungstypen', 'initial-setup', 'initial-setup'),
  ('crm.settings.nav.customer_link_types', 'pt-PT', 'Tipos de ligação', 'initial-setup', 'initial-setup');
