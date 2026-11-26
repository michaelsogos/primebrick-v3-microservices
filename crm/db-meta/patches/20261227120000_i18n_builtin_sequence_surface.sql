-- Primebrick: builtin `sequence` entity — i18n surface for the auto-mounted
-- settings dict page (mounted by construction via createMicroservice nav
-- merge — never authored by the module). Keys: settings nav leaf, entity
-- title/singular/plural/new.title, column labels, and the version_history
-- audit block (values mirrored from crm.entities.customer_type — same
-- governed vocabulary, different entity prefix).

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.settings.nav.sequences', 'en-GB', 'Sequences', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.settings.nav.sequences', 'en-US', 'Sequences', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.settings.nav.sequences', 'it-IT', 'Sequenze', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.settings.nav.sequences', 'fr-FR', 'Séquences', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.settings.nav.sequences', 'es-ES', 'Secuencias', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.settings.nav.sequences', 'de-DE', 'Sequenzen', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.settings.nav.sequences', 'pt-PT', 'Sequências', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.title', 'en-GB', 'Sequences', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.title', 'en-US', 'Sequences', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.title', 'it-IT', 'Sequenze', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.title', 'fr-FR', 'Séquences', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.title', 'es-ES', 'Secuencias', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.title', 'de-DE', 'Sequenzen', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.title', 'pt-PT', 'Sequências', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.singular', 'en-GB', 'Sequence', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.singular', 'en-US', 'Sequence', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.singular', 'it-IT', 'Sequenza', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.singular', 'fr-FR', 'Séquence', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.singular', 'es-ES', 'Secuencia', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.singular', 'de-DE', 'Sequenz', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.singular', 'pt-PT', 'Sequência', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.plural', 'en-GB', 'Sequences', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.plural', 'en-US', 'Sequences', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.plural', 'it-IT', 'Sequenze', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.plural', 'fr-FR', 'Séquences', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.plural', 'es-ES', 'Secuencias', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.plural', 'de-DE', 'Sequenzen', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.plural', 'pt-PT', 'Sequências', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.new.title', 'en-GB', 'New sequence', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.new.title', 'en-US', 'New sequence', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.new.title', 'it-IT', 'Nuova sequenza', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.new.title', 'fr-FR', 'Nouvelle séquence', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.new.title', 'es-ES', 'Nueva secuencia', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.new.title', 'de-DE', 'Neue Sequenz', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.new.title', 'pt-PT', 'Nova sequência', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.fields.code', 'en-GB', 'Code', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.code', 'en-US', 'Code', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.code', 'it-IT', 'Codice', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.code', 'fr-FR', 'Code', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.code', 'es-ES', 'Código', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.code', 'de-DE', 'Code', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.code', 'pt-PT', 'Código', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.fields.pattern', 'en-GB', 'Pattern', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.pattern', 'en-US', 'Pattern', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.pattern', 'it-IT', 'Pattern', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.pattern', 'fr-FR', 'Motif', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.pattern', 'es-ES', 'Patrón', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.pattern', 'de-DE', 'Muster', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.pattern', 'pt-PT', 'Padrão', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.fields.step', 'en-GB', 'Step', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.step', 'en-US', 'Step', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.step', 'it-IT', 'Incremento', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.step', 'fr-FR', 'Pas', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.step', 'es-ES', 'Paso', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.step', 'de-DE', 'Schritt', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.step', 'pt-PT', 'Passo', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.fields.start', 'en-GB', 'First value', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.start', 'en-US', 'First value', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.start', 'it-IT', 'Valore iniziale', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.start', 'fr-FR', 'Valeur initiale', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.start', 'es-ES', 'Valor inicial', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.start', 'de-DE', 'Startwert', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.start', 'pt-PT', 'Valor inicial', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.fields.tz', 'en-GB', 'Time zone', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.tz', 'en-US', 'Time zone', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.tz', 'it-IT', 'Fuso orario', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.tz', 'fr-FR', 'Fuseau horaire', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.tz', 'es-ES', 'Zona horaria', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.tz', 'de-DE', 'Zeitzone', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.tz', 'pt-PT', 'Fuso horário', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.fields.label_key', 'en-GB', 'Label key', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.label_key', 'en-US', 'Label key', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.label_key', 'it-IT', 'Chiave etichetta', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.label_key', 'fr-FR', 'Clé de libellé', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.label_key', 'es-ES', 'Clave de etiqueta', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.label_key', 'de-DE', 'Label-Schlüssel', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.label_key', 'pt-PT', 'Chave de rótulo', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.fields.description_key', 'en-GB', 'Description key', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.description_key', 'en-US', 'Description key', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.description_key', 'it-IT', 'Chiave descrizione', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.description_key', 'fr-FR', 'Clé de description', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.description_key', 'es-ES', 'Clave de descripción', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.description_key', 'de-DE', 'Beschreibungsschlüssel', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.fields.description_key', 'pt-PT', 'Chave de descrição', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.version_history.actions.create', 'de-DE', 'Erstellung', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.create', 'en-GB', 'Creation', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.create', 'en-US', 'Creation', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.create', 'es-ES', 'Creación', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.create', 'fr-FR', 'Création', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.create', 'it-IT', 'Creazione', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.create', 'pt-PT', 'Criação', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.version_history.actions.delete', 'de-DE', 'Löschung', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.delete', 'en-GB', 'Deletion', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.delete', 'en-US', 'Deletion', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.delete', 'es-ES', 'Eliminación', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.delete', 'fr-FR', 'Suppression', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.delete', 'it-IT', 'Eliminazione', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.delete', 'pt-PT', 'Exclusão', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.version_history.actions.hard_delete', 'de-DE', 'Endgültige Löschung', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.hard_delete', 'en-GB', 'Permanent deletion', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.hard_delete', 'en-US', 'Permanent deletion', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.hard_delete', 'es-ES', 'Eliminación definitiva', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.hard_delete', 'fr-FR', 'Suppression définitive', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.hard_delete', 'it-IT', 'Eliminazione definitiva', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.hard_delete', 'pt-PT', 'Exclusão definitiva', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.version_history.actions.insert', 'de-DE', 'Erstellung', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.insert', 'en-GB', 'Creation', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.insert', 'en-US', 'Creation', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.insert', 'es-ES', 'Creación', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.insert', 'fr-FR', 'Création', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.insert', 'it-IT', 'Creazione', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.insert', 'pt-PT', 'Criação', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.version_history.actions.restore', 'de-DE', 'Wiederherstellung', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.restore', 'en-GB', 'Restoration', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.restore', 'en-US', 'Restoration', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.restore', 'es-ES', 'Restauración', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.restore', 'fr-FR', 'Restauration', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.restore', 'it-IT', 'Ripristino', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.restore', 'pt-PT', 'Restauração', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.version_history.actions.soft_delete', 'de-DE', 'Löschung', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.soft_delete', 'en-GB', 'Deletion', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.soft_delete', 'en-US', 'Deletion', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.soft_delete', 'es-ES', 'Eliminación', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.soft_delete', 'fr-FR', 'Suppression', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.soft_delete', 'it-IT', 'Eliminazione', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.soft_delete', 'pt-PT', 'Exclusão', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.version_history.actions.update', 'de-DE', 'Änderung', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.update', 'en-GB', 'Modification', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.update', 'en-US', 'Modification', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.update', 'es-ES', 'Modificación', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.update', 'fr-FR', 'Modification', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.update', 'it-IT', 'Modifica', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.actions.update', 'pt-PT', 'Modificação', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.version_history.changed_from', 'de-DE', 'geändert von', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.changed_from', 'en-GB', 'changed from', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.changed_from', 'en-US', 'changed from', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.changed_from', 'es-ES', 'cambiado de', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.changed_from', 'fr-FR', 'changé de', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.changed_from', 'it-IT', 'cambiato da', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.changed_from', 'pt-PT', 'alterado de', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.version_history.cleared', 'de-DE', 'gelöscht', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.cleared', 'en-GB', 'cleared', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.cleared', 'en-US', 'cleared', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.cleared', 'es-ES', 'borrado', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.cleared', 'fr-FR', 'effacé', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.cleared', 'it-IT', 'cancellato', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.cleared', 'pt-PT', 'limpo', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.version_history.empty', 'de-DE', 'Keine Versionshistorie verfügbar', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.empty', 'en-GB', 'No version history available', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.empty', 'en-US', 'No version history available', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.empty', 'es-ES', 'No hay historial de versiones disponible', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.empty', 'fr-FR', 'Aucun historique de versions disponible', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.empty', 'it-IT', 'Nessuno storico versioni disponibile', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.empty', 'pt-PT', 'Nenhum histórico de versões disponível', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.version_history.error', 'de-DE', 'Versionshistorie konnte nicht geladen werden', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.error', 'en-GB', 'Failed to load version history', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.error', 'en-US', 'Failed to load version history', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.error', 'es-ES', 'Error al cargar el historial de versiones', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.error', 'fr-FR', 'Échec du chargement de l''historique des versions', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.error', 'it-IT', 'Impossibile caricare lo storico versioni', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.error', 'pt-PT', 'Falha ao carregar histórico de versões', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.version_history.field_modified', 'de-DE', 'Feld {field} geändert von {from} zu {to}', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.field_modified', 'en-GB', 'Field {field} changed from {from} to {to}', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.field_modified', 'en-US', 'Field {field} changed from {from} to {to}', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.field_modified', 'es-ES', 'Campo {field} modificado de {from} a {to}', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.field_modified', 'fr-FR', 'Champ {field} modifié de {from} à {to}', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.field_modified', 'it-IT', 'Campo {field} modificato da {from} a {to}', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.field_modified', 'pt-PT', 'Campo {field} modificado de {from} para {to}', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.version_history.hide_details', 'de-DE', 'Details ausblenden', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.hide_details', 'en-GB', 'Hide details', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.hide_details', 'en-US', 'Hide details', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.hide_details', 'es-ES', 'Ocultar detalles', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.hide_details', 'fr-FR', 'Masquer les détails', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.hide_details', 'it-IT', 'Nascondi dettagli', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.hide_details', 'pt-PT', 'Ocultar detalhes', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.version_history.loading', 'de-DE', 'Versionshistorie wird geladen…', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.loading', 'en-GB', 'Loading version history…', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.loading', 'en-US', 'Loading version history…', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.loading', 'es-ES', 'Cargando historial de versiones…', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.loading', 'fr-FR', 'Chargement de l''historique des versions…', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.loading', 'it-IT', 'Caricamento storico versioni…', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.loading', 'pt-PT', 'Carregando histórico de versões…', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.version_history.not_set', 'de-DE', 'nicht gesetzt', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.not_set', 'en-GB', 'not set', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.not_set', 'en-US', 'not set', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.not_set', 'es-ES', 'no establecido', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.not_set', 'fr-FR', 'non défini', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.not_set', 'it-IT', 'non impostato', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.not_set', 'pt-PT', 'não definido', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.version_history.null', 'de-DE', 'leer', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.null', 'en-GB', 'empty', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.null', 'en-US', 'empty', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.null', 'es-ES', 'vacío', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.null', 'fr-FR', 'vide', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.null', 'it-IT', 'vuoto', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.null', 'pt-PT', 'vazio', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.version_history.record_created', 'de-DE', 'Datensatz erstellt', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_created', 'en-GB', 'Record created', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_created', 'en-US', 'Record created', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_created', 'es-ES', 'Registro creado', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_created', 'fr-FR', 'Enregistrement créé', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_created', 'it-IT', 'Record creato', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_created', 'pt-PT', 'Registro criado', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.version_history.record_deleted', 'de-DE', 'Datensatz gelöscht', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_deleted', 'en-GB', 'Record deleted', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_deleted', 'en-US', 'Record deleted', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_deleted', 'es-ES', 'Registro eliminado', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_deleted', 'fr-FR', 'Enregistrement supprimé', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_deleted', 'pt-PT', 'Registro excluído', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.version_history.record_hard_deleted', 'de-DE', 'Datensatz endgültig gelöscht', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_hard_deleted', 'en-GB', 'Record permanently deleted', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_hard_deleted', 'en-US', 'Record permanently deleted', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_hard_deleted', 'es-ES', 'Registro eliminado definitivamente', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_hard_deleted', 'fr-FR', 'Enregistrement supprimé définitivement', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_hard_deleted', 'it-IT', 'Record eliminato definitivamente', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_hard_deleted', 'pt-PT', 'Registro excluído definitivamente', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.version_history.record_restored', 'de-DE', 'Datensatz wiederhergestellt', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_restored', 'en-GB', 'Record restored', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_restored', 'en-US', 'Record restored', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_restored', 'es-ES', 'Registro restaurado', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_restored', 'fr-FR', 'Enregistrement restauré', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_restored', 'it-IT', 'Record ripristinato', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_restored', 'pt-PT', 'Registro restaurado', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.version_history.record_soft_deleted', 'de-DE', 'Datensatz gelöscht', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_soft_deleted', 'en-GB', 'Record deleted', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_soft_deleted', 'en-US', 'Record deleted', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_soft_deleted', 'es-ES', 'Registro eliminado', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_soft_deleted', 'fr-FR', 'Enregistrement supprimé', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_soft_deleted', 'it-IT', 'Record eliminato', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.record_soft_deleted', 'pt-PT', 'Registro excluído', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.version_history.set', 'de-DE', 'gesetzt auf', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.set', 'en-GB', 'set to', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.set', 'en-US', 'set to', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.set', 'es-ES', 'establecido a', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.set', 'fr-FR', 'défini sur', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.set', 'it-IT', 'impostato a', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.set', 'pt-PT', 'definido como', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.version_history.show_details', 'de-DE', 'Details anzeigen', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.show_details', 'en-GB', 'Show details', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.show_details', 'en-US', 'Show details', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.show_details', 'es-ES', 'Mostrar detalles', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.show_details', 'fr-FR', 'Afficher les détails', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.show_details', 'it-IT', 'Mostra dettagli', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.show_details', 'pt-PT', 'Mostrar detalhes', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.version_history.title', 'de-DE', 'Versionshistorie', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.title', 'en-GB', 'Version History', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.title', 'en-US', 'Version History', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.title', 'es-ES', 'Historial de versiones', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.title', 'fr-FR', 'Historique des versions', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.title', 'it-IT', 'Storico Versioni', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.title', 'pt-PT', 'Histórico de versões', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.version_history.to', 'de-DE', 'zu', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.to', 'en-GB', 'to', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.to', 'en-US', 'to', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.to', 'es-ES', 'a', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.to', 'fr-FR', 'à', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.to', 'it-IT', 'a', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.to', 'pt-PT', 'para', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.version_history.unchanged', 'de-DE', 'unverändert bei', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.unchanged', 'en-GB', 'unchanged at', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.unchanged', 'en-US', 'unchanged at', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.unchanged', 'es-ES', 'sin cambios en', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.unchanged', 'fr-FR', 'inchangé à', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.unchanged', 'it-IT', 'invariato a', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.unchanged', 'pt-PT', 'inalterado em', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);

INSERT INTO crm.translations (uuid, key, language, value, created_at, created_by, updated_at, updated_by, version)
VALUES
  (uuidv7(), 'crm.entities.sequence.version_history.view_more', 'de-DE', 'Mehr anzeigen', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.view_more', 'en-GB', 'View more', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.view_more', 'en-US', 'View more', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.view_more', 'es-ES', 'Ver más', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.view_more', 'fr-FR', 'Voir plus', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.view_more', 'it-IT', 'Vedi altro', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1),
  (uuidv7(), 'crm.entities.sequence.version_history.view_more', 'pt-PT', 'Ver mais', now(), 'migration-sequences-i18n', now(), 'migration-sequences-i18n', 1);
